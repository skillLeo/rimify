<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RolePermissionRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Rollen & Rechte — the permission matrix, as a grid rather than a list of opaque strings.
 *
 * Roles are the columns and modules the rows, because that is how the question is actually asked:
 * "can the Buchhaltung export orders?" is read across, not looked up.
 *
 * The grid is editable by whoever holds `roles` × `edit`, one cell at a time: `PermissionMatrix`
 * reads this table on every request with no cross-request cache, so a right taken away here stops
 * being honoured on the very next click, without a deployment.
 *
 * One thing cannot be done from this screen, and it is the important one: the last account that can
 * edit roles cannot have that taken away. There is no second door into this table — no console for
 * the client, no seeder they can re-run — so a panel that allowed it would be a panel somebody
 * locks permanently, with the only way back being a developer and a database client.
 */
class RollenController extends Controller
{
    public const SAVED_TOAST = 'Gespeichert.';

    /** What the refusal says. Named so the test asserts the sentence the admin actually reads. */
    public const LOCKOUT_REFUSAL = 'Das würde das letzte Konto aussperren, das Rollen und Rechte '
        .'ändern darf. Gib die Berechtigung zuerst einer anderen Rolle.';

    public function index(Request $request): Response
    {
        $roles = DB::table('roles')
            ->where('guard_name', 'admin')
            ->orderByDesc('is_system')
            ->orderBy('id')
            ->get(['id', 'name', 'label_de', 'description_de', 'is_system']);

        $cells = DB::table('role_permissions')->get(['role_id', 'module', 'action', 'allowed']);

        $matrix = [];

        foreach ($cells as $cell) {
            $matrix[$cell->role_id.':'.$cell->module.':'.$cell->action] = (bool) $cell->allowed;
        }

        $counts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('COUNT(*) as users'))
            ->groupBy('role_id')
            ->pluck('users', 'role_id');

        $columns = [];

        foreach ($roles as $role) {
            $columns[] = [
                'id' => (int) $role->id,
                'name' => (string) $role->name,
                // The identifier is `name`; this is what a human reads and may rename freely.
                'label' => $role->label_de ?? $role->name,
                'description' => $role->description_de,
                'isSystem' => (bool) $role->is_system,
                'users' => (int) ($counts[$role->id] ?? 0),
            ];
        }

        $rows = [];

        foreach (PermissionModule::cases() as $module) {
            $actions = [];

            foreach (PermissionAction::cases() as $action) {
                $perRole = [];

                foreach ($columns as $column) {
                    $perRole[$column['id']] = $matrix[$column['id'].':'.$module->value.':'.$action->value] ?? false;
                }

                $actions[] = [
                    'action' => $action->value,
                    'label' => $action->labelDe(),
                    'roles' => $perRole,
                ];
            }

            $rows[] = [
                'module' => $module->value,
                'label' => $module->labelDe(),
                'actions' => $actions,
            ];
        }

        return Inertia::render('Admin/Rollen/Index', [
            'roles' => $columns,
            'modules' => $rows,
            // What this admin may do here. The server refuses regardless (R-11); this only decides
            // whether the grid draws checkboxes or the read-only ticks and dashes.
            'can' => [
                'update' => self::admin($request)->may(PermissionModule::Roles, PermissionAction::Edit),
            ],
        ]);
    }

    /**
     * Allows or denies one cell.
     *
     * Written with `updateOrInsert` because a role created from the panel may not have every cell,
     * and absence must never be read as "allowed" (see PermissionMatrix): the row is made the
     * moment somebody decides about it.
     */
    public function updatePermission(RolePermissionRequest $request, int $role): RedirectResponse
    {
        $exists = DB::table('roles')->where('id', $role)->where('guard_name', 'admin')->exists();

        abort_unless($exists, 404);

        $module = $request->module();
        $action = $request->action();
        $allowed = $request->allowed();
        $admin = $request->admin();

        DB::transaction(function () use ($role, $module, $action, $allowed, $admin): void {
            $before = DB::table('role_permissions')
                ->where('role_id', $role)
                ->where('module', $module->value)
                ->where('action', $action->value)
                ->value('allowed');

            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $role, 'module' => $module->value, 'action' => $action->value],
                ['allowed' => $allowed, 'updated_at' => now()],
            );

            /*
             * Checked AFTER the write and inside the transaction, so the question asked is the one
             * that matters — "with this change in place, can anybody still get back in?" — rather
             * than a guess about the change beforehand. A no rolls the whole thing back.
             */
            if (self::wouldLockEveryoneOut()) {
                throw ValidationException::withMessages(['allowed' => self::LOCKOUT_REFUSAL]);
            }

            self::audit($admin, 'role_permission.updated', [
                'role_id' => $role,
                'module' => $module->value,
                'action' => $action->value,
                'old' => $before === null ? null : (bool) $before,
                'allowed' => $allowed,
            ]);
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    /** Whether no account at all would still be able to edit roles. */
    private static function wouldLockEveryoneOut(): bool
    {
        return DB::table('role_permissions as rp')
            ->join('model_has_roles as mhr', 'mhr.role_id', '=', 'rp.role_id')
            ->where('mhr.model_type', (new AdminUser)->getMorphClass())
            ->where('rp.module', PermissionModule::Roles->value)
            ->where('rp.action', PermissionAction::Edit->value)
            ->where('rp.allowed', true)
            ->doesntExist();
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /**
     * One append-only entry per change. A permission is the one thing in this panel whose history
     * somebody will one day need to read, so the entry names the cell and what it was before.
     *
     * @param  array<string, mixed>  $properties
     */
    private static function audit(AdminUser $admin, string $event, array $properties): void
    {
        activity('admin')
            ->causedBy($admin)
            ->withProperties($properties)
            ->tap(static function (AuditLog $entry) use ($admin): void {
                $entry->forceFill([
                    'actor_email' => $admin->email,
                    'ip_address' => request()->ip(),
                ]);
            })
            ->log($event);
    }
}
