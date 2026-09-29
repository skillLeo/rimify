<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleDestroyRequest;
use App\Http\Requests\Admin\RoleDuplicateRequest;
use App\Http\Requests\Admin\RolePermissionRequest;
use App\Http\Requests\Admin\RolePermissionsReplaceRequest;
use App\Http\Requests\Admin\RoleStoreRequest;
use App\Http\Requests\Admin\RoleUpdateRequest;
use App\Models\AdminUser;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use stdClass;

/**
 * Rollen & Rechte — the roles, and for one role at a time the grid of what it may do: modules down,
 * actions across (docs/admin/BRIEF.md §2), only the actions each module really has.
 *
 * `PermissionMatrix` reads `role_permissions` on every request with no cross-request cache, so a
 * right taken away here stops being honoured on the very next click, without a deployment.
 *
 * The guards (docs/admin/team-build-plan.md) are asked here, about the stored rows, on every write:
 *
 *   - the Super-Admin role is always everything — its rights, name and existence are fixed;
 *   - a standard role (`is_system`) keeps its name and cannot be deleted; its rights can change;
 *   - a role that accounts still hold cannot be deleted;
 *   - nobody but a Super-Admin adds a right to a role they hold themselves;
 *   - the last account that can edit roles never loses that right. There is no second door into
 *     this table — no console for the client, no seeder they can re-run — so a panel that allowed
 *     it would be a panel somebody locks permanently.
 *
 * Every change leaves one entry through AuditTrail, under the event names the Protokoll reads.
 */
class RollenController extends Controller
{
    public const SAVED_TOAST = 'Gespeichert.';

    public const CREATED_TOAST = 'Rolle angelegt.';

    public const DUPLICATED_TOAST = 'Rolle dupliziert.';

    public const DELETED_TOAST = 'Rolle gelöscht.';

    public const UNCHANGED_TOAST = 'Keine Änderungen.';

    /** The identifier of the role that is always everything. */
    public const SUPER_ADMIN = 'super-admin';

    public const OPEN_INVITATION_REFUSAL = 'Eine offene Einladung vergibt diese Rolle noch. Widerrufe sie zuerst unter Benutzer.';

    /** Handing a role a right one does not hold oneself — see beyondActor(). */
    public const BEYOND_REFUSAL = 'Du kannst nur Rechte vergeben, die du selbst hast.';

    /** What the refusal says. Named so the test asserts the sentence the admin actually reads. */
    public const LOCKOUT_REFUSAL = 'Das würde das letzte Konto aussperren, das Rollen und Rechte '
        .'ändern darf. Gib die Berechtigung zuerst einer anderen Rolle.';

    public const SUPER_ADMIN_RIGHTS = 'Super-Admin hat immer alle Rechte. Sie lassen sich nicht ändern.';

    public const SUPER_ADMIN_UPDATE = 'Die Rolle Super-Admin lässt sich nicht ändern.';

    public const SUPER_ADMIN_DELETE = 'Die Rolle Super-Admin lässt sich nicht löschen.';

    public const SYSTEM_RENAME = 'Eine Standardrolle lässt sich nicht umbenennen. Ihre Beschreibung kannst du ändern.';

    public const SYSTEM_DELETE = 'Eine Standardrolle lässt sich nicht löschen.';

    public const RAISE_OWN_REFUSAL = 'Du hast diese Rolle selbst. Neue Rechte gibt ihr nur eine andere Person, '
        .'die Rollen und Rechte verwaltet.';

    public const IN_USE_REFUSAL = 'Diese Rolle wird noch verwendet, etwa von einer offenen Einladung, '
        .'und lässt sich deshalb nicht löschen.';

    private const GUARD = 'admin';

    public function __construct(private readonly AdminNavigation $navigation) {}

    /** The refusal for deleting a role that accounts still hold, in the number it names. */
    public static function heldRefusal(int $accounts): string
    {
        return $accounts === 1
            ? 'Diese Rolle hat noch 1 Konto. Gib ihm zuerst eine andere Rolle.'
            : sprintf('Diese Rolle haben noch %s Konten. Gib ihnen zuerst eine andere Rolle.', GermanFormat::integer($accounts));
    }

    public function index(Request $request): Response
    {
        $admin = self::admin($request);

        // The route already refuses without `roles` × `view` (EnsureAdminMay); asked again here so
        // the data never depends on a middleware line staying where it is.
        abort_unless($admin->may(PermissionModule::Roles, PermissionAction::View), 403);

        $rows = DB::table('roles')
            ->where('guard_name', self::GUARD)
            ->orderByDesc('is_system')
            ->orderBy('id')
            ->get(['id', 'name', 'label_de', 'description_de', 'is_system']);

        $rights = self::rightsByRole();

        $counts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('COUNT(*) as users'))
            ->groupBy('role_id')
            ->pluck('users', 'role_id');

        $held = self::heldRoleIds($admin);
        $actorIsSuperAdmin = self::holdsSuperAdmin($admin);

        $roles = [];

        foreach ($rows as $row) {
            $id = (int) $row->id;

            $roles[] = [
                'id' => $id,
                'name' => (string) $row->name,
                // The identifier is `name`; this is what a human reads and may rename freely.
                'label' => self::labelOf($row),
                'description' => self::descriptionOf($row),
                'isSystem' => (bool) $row->is_system,
                'isSuperAdmin' => $row->name === self::SUPER_ADMIN,
                'users' => (int) ($counts[$id] ?? 0),
                'rights' => $rights[$id] ?? [],
                // This viewer holds the role and is not a Super-Admin: rights may go, not come.
                'raiseBlocked' => in_array($id, $held, true) && ! $actorIsSuperAdmin,
            ];
        }

        $selected = self::selection($roles, $request->integer('rolle'));

        return Inertia::render('Admin/Rollen/Index', [
            'roles' => $roles,
            'accounts' => DB::table('model_has_roles')
                ->where('model_type', (new AdminUser)->getMorphClass())
                ->distinct()
                ->count('model_id'),
            'modules' => self::modules(),
            'actions' => self::actions(),
            'selected' => $selected,
            // "Ansicht als Rolle": the rail the selected role would see, by the rail's own rules.
            'navigation' => $selected === null ? [] : $this->navigation->forRole($selected),
            // The rights this admin may hand to a role — their own; null for a Super-Admin, who holds
            // all of them. The page offers nothing beyond it; the server refuses it regardless.
            'grantable' => $actorIsSuperAdmin ? null : self::heldRights($admin),
            // What this admin may do here. The server refuses regardless (R-11); this only decides
            // which controls are drawn.
            'can' => [
                'create' => $admin->may(PermissionModule::Roles, PermissionAction::Create),
                'update' => $admin->may(PermissionModule::Roles, PermissionAction::Edit),
                'delete' => $admin->may(PermissionModule::Roles, PermissionAction::Delete),
            ],
        ]);
    }

    /** A new role, empty or with the rights of an existing one. */
    public function store(RoleStoreRequest $request): RedirectResponse
    {
        $admin = $request->admin();
        $label = $request->label();
        $description = $request->description();
        $copyFrom = $request->copyFrom();

        // Copying a role is handing out its rights: only the ones the copier holds.
        if ($copyFrom !== null && ($beyond = self::beyondActor($admin, self::rightsOf($copyFrom))) !== []) {
            throw ValidationException::withMessages(['copyFrom' => self::beyondRefusal($beyond)]);
        }

        $id = DB::transaction(static function () use ($admin, $label, $description, $copyFrom): int {
            $source = $copyFrom === null ? null : self::roleRow($copyFrom);
            $role = self::createRole(
                $label,
                $description,
                $source === null ? null : (int) $source->id,
                $source === null ? [] : self::rightsOf((int) $source->id),
            );

            AuditTrail::record($admin, 'role.created', [
                'role_id' => (int) $role->getKey(),
                'label' => $label,
                'copied_from_label' => $source === null ? null : self::labelOf($source),
            ], $role);

            return (int) $role->getKey();
        });

        // Straight to the new role, so the next thing the person sees is the grid they came to fill.
        return redirect()->route('admin.rollen.index', ['rolle' => $id])->with('toast', self::CREATED_TOAST);
    }

    /**
     * A role's name and description. The Super-Admin is not changed at all; a standard role keeps
     * its name, because the team knows it by that name, and may have its description changed.
     */
    public function update(RoleUpdateRequest $request, int $role): RedirectResponse
    {
        $row = self::roleRow($role);

        if (self::isSuperAdmin($row)) {
            throw ValidationException::withMessages(['label' => self::SUPER_ADMIN_UPDATE]);
        }

        $old = ['label' => self::labelOf($row), 'description' => self::descriptionOf($row)];
        $new = ['label' => $request->label(), 'description' => $request->description()];

        if ((bool) $row->is_system && $new['label'] !== $old['label']) {
            throw ValidationException::withMessages(['label' => self::SYSTEM_RENAME]);
        }

        if ($new === $old) {
            return back()->with('toast', self::UNCHANGED_TOAST);
        }

        $admin = $request->admin();

        DB::transaction(static function () use ($role, $old, $new, $admin): void {
            DB::table('roles')->where('id', $role)->update([
                'label_de' => $new['label'],
                'description_de' => $new['description'],
                'updated_at' => now(),
            ]);

            AuditTrail::record($admin, 'role.updated', [
                'role_id' => $role,
                'old' => $old,
                'new' => $new,
            ], Role::query()->find($role));
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    /** A copy of a role — its rights and description — under a free name ending in "(Kopie)". */
    public function duplicate(RoleDuplicateRequest $request, int $role): RedirectResponse
    {
        $source = self::roleRow($role);
        $admin = $request->admin();

        if (($beyond = self::beyondActor($admin, self::rightsOf($role))) !== []) {
            throw ValidationException::withMessages(['role' => self::beyondRefusal($beyond)]);
        }

        $id = DB::transaction(static function () use ($source, $admin): int {
            $from = self::labelOf($source);
            $label = self::copyLabel($from);

            $copy = self::createRole($label, self::descriptionOf($source), (int) $source->id, self::rightsOf((int) $source->id));

            AuditTrail::record($admin, 'role.duplicated', [
                'role_id' => (int) $copy->getKey(),
                'label' => $label,
                'copied_from_label' => $from,
            ], $copy);

            return (int) $copy->getKey();
        });

        return redirect()->route('admin.rollen.index', ['rolle' => $id])->with('toast', self::DUPLICATED_TOAST);
    }

    /**
     * Deletes a role nobody holds. A standard role and the Super-Admin are never deleted, and a
     * role an account holds is refused with the number of accounts — the person is told what to do
     * first rather than having accounts silently lose their role.
     */
    public function destroy(RoleDestroyRequest $request, int $role): RedirectResponse
    {
        $row = self::roleRow($role);

        if (self::isSuperAdmin($row)) {
            throw ValidationException::withMessages(['role' => self::SUPER_ADMIN_DELETE]);
        }

        if ((bool) $row->is_system) {
            throw ValidationException::withMessages(['role' => self::SYSTEM_DELETE]);
        }

        $admin = $request->admin();
        $subject = Role::query()->find($role);

        try {
            DB::transaction(static function () use ($role, $row, $admin, $subject): void {
                // Counted inside the transaction and under a lock, so an account given this role a
                // moment ago is counted rather than detached by the delete's cascade.
                $accounts = DB::table('model_has_roles')->where('role_id', $role)->lockForUpdate()->count();

                if ($accounts > 0) {
                    throw ValidationException::withMessages(['role' => self::heldRefusal($accounts)]);
                }

                // A withdrawn, accepted or expired invitation lets go of the role (the column nulls
                // out); only one that can still be accepted keeps it, because accepting it would
                // hand out a role that no longer exists.
                $open = DB::table('admin_invitations')
                    ->where('role_id', $role)
                    ->whereNull('accepted_at')
                    ->whereNull('revoked_at')
                    ->where('expires_at', '>', now())
                    ->lockForUpdate()
                    ->count();

                if ($open > 0) {
                    throw ValidationException::withMessages(['role' => self::OPEN_INVITATION_REFUSAL]);
                }

                DB::table('roles')->where('id', $role)->delete();

                AuditTrail::record($admin, 'role.deleted', [
                    'role_id' => $role,
                    'label' => self::labelOf($row),
                ], $subject);
            });
        } catch (QueryException $exception) {
            // Something else still points at this role — an open invitation, say — and the database
            // refused. Said in German and left intact, never forced.
            if (($exception->errorInfo[0] ?? null) !== '23000') {
                throw $exception;
            }

            throw ValidationException::withMessages(['role' => self::IN_USE_REFUSAL]);
        }

        return redirect()->route('admin.rollen.index')->with('toast', self::DELETED_TOAST);
    }

    /**
     * Allows or denies one cell.
     *
     * Written with `updateOrInsert` because a role created elsewhere may not have every cell, and
     * absence must never be read as "allowed" (see PermissionMatrix): the row is made the moment
     * somebody decides about it.
     */
    public function updatePermission(RolePermissionRequest $request, int $role): RedirectResponse
    {
        $row = self::roleRow($role);

        if (self::isSuperAdmin($row)) {
            throw ValidationException::withMessages(['allowed' => self::SUPER_ADMIN_RIGHTS]);
        }

        $module = $request->module();
        $action = $request->action();
        $allowed = $request->allowed();
        $admin = $request->admin();

        if ($allowed && self::raiseBlocked($admin, $role)) {
            throw ValidationException::withMessages(['allowed' => self::RAISE_OWN_REFUSAL]);
        }

        if ($allowed && ($beyond = self::beyondActor($admin, [$module->value.'.'.$action->value])) !== []) {
            throw ValidationException::withMessages(['allowed' => self::beyondRefusal($beyond)]);
        }

        // Kept on the entry: the Protokoll must still name the role after it has been renamed or deleted.
        $label = self::labelOf($row);

        DB::transaction(static function () use ($role, $label, $module, $action, $allowed, $admin): void {
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

            AuditTrail::record($admin, 'role_permission.updated', [
                'role_id' => $role,
                'label' => $label,
                'module' => $module->value,
                'action' => $action->value,
                'old' => $before === null ? null : (bool) $before,
                'allowed' => $allowed,
            ], Role::query()->find($role));
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    /**
     * A role's whole set of rights at once, after the page showed the difference and the person
     * confirmed it. Every real cell is written; the entry names what came and what went.
     */
    public function replacePermissions(RolePermissionsReplaceRequest $request, int $role): RedirectResponse
    {
        $row = self::roleRow($role);

        if (self::isSuperAdmin($row)) {
            throw ValidationException::withMessages(['rights' => self::SUPER_ADMIN_RIGHTS]);
        }

        $admin = $request->admin();
        $next = $request->rights();
        $before = self::rightsOf($role);

        $added = array_values(array_diff($next, $before));
        $removed = array_values(array_diff($before, $next));

        if ($added === [] && $removed === []) {
            return back()->with('toast', self::UNCHANGED_TOAST);
        }

        if ($added !== [] && self::raiseBlocked($admin, $role)) {
            throw ValidationException::withMessages(['rights' => self::RAISE_OWN_REFUSAL]);
        }

        if (($beyond = self::beyondActor($admin, $added)) !== []) {
            throw ValidationException::withMessages(['rights' => self::beyondRefusal($beyond)]);
        }

        DB::transaction(static function () use ($role, $row, $next, $added, $removed, $admin): void {
            self::writeMatrix($role, $next);

            // The same question as for one cell, asked after the write, rolled back on a no.
            if (self::wouldLockEveryoneOut()) {
                throw ValidationException::withMessages(['rights' => self::LOCKOUT_REFUSAL]);
            }

            AuditTrail::record($admin, 'role_permissions.replaced', [
                'role_id' => $role,
                'label' => self::labelOf($row),
                'added' => $added,
                'removed' => $removed,
            ], Role::query()->find($role));
        });

        return back()->with('toast', self::SAVED_TOAST);
    }

    /* ── Reading ──────────────────────────────────────────────────────────────────── */

    /**
     * The stored role, or a 404: an id that is not an admin role is not one to act on.
     */
    private static function roleRow(int $id): stdClass
    {
        /** @var stdClass|null $row */
        $row = DB::table('roles')
            ->where('id', $id)
            ->where('guard_name', self::GUARD)
            ->first(['id', 'name', 'label_de', 'description_de', 'is_system']);

        abort_if($row === null, 404);

        return $row;
    }

    private static function isSuperAdmin(stdClass $row): bool
    {
        return $row->name === self::SUPER_ADMIN;
    }

    private static function labelOf(stdClass $row): string
    {
        return is_string($row->label_de) && $row->label_de !== '' ? $row->label_de : (string) $row->name;
    }

    private static function descriptionOf(stdClass $row): ?string
    {
        return is_string($row->description_de) && $row->description_de !== '' ? $row->description_de : null;
    }

    /**
     * The allowed REAL cells of one role as `module.action`, in the grid's order. A stored cell for
     * an action the module does not have is not a right and is not read.
     *
     * @return list<string>
     */
    private static function rightsOf(int $role): array
    {
        return self::rightsByRole($role)[$role] ?? [];
    }

    /**
     * @return array<int, list<string>>
     */
    private static function rightsByRole(?int $only = null): array
    {
        $rows = DB::table('role_permissions')
            ->where('allowed', true)
            ->when($only !== null, static fn ($query) => $query->where('role_id', $only))
            ->get(['role_id', 'module', 'action']);

        $cells = [];

        foreach ($rows as $row) {
            $cells[(int) $row->role_id][] = $row->module.'.'.$row->action;
        }

        $real = PermissionModule::cells();

        return array_map(static fn (array $list): array => array_values(array_intersect($real, $list)), $cells);
    }

    /** @return list<int> */
    private static function heldRoleIds(AdminUser $admin): array
    {
        return DB::table('model_has_roles')
            ->where('model_type', $admin->getMorphClass())
            ->where('model_id', $admin->getKey())
            ->pluck('role_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    private static function holdsSuperAdmin(AdminUser $admin): bool
    {
        return DB::table('model_has_roles as mhr')
            ->join('roles as r', 'r.id', '=', 'mhr.role_id')
            ->where('mhr.model_type', $admin->getMorphClass())
            ->where('mhr.model_id', $admin->getKey())
            ->where('r.name', self::SUPER_ADMIN)
            ->where('r.guard_name', self::GUARD)
            ->exists();
    }

    /** Nobody raises their own rights — unless they are a Super-Admin, who already has them all. */
    private static function raiseBlocked(AdminUser $admin, int $role): bool
    {
        return in_array($role, self::heldRoleIds($admin), true) && ! self::holdsSuperAdmin($admin);
    }

    /**
     * The rights among `$cells` this admin does not hold themselves — what they may therefore not
     * hand to any role. Without this, somebody who may edit roles could widen any role they do not
     * hold (or copy the Super-Admin into a new one), invite a second address of their own with it,
     * and hold every right. A Super-Admin already holds everything.
     *
     * @param  list<string>  $cells
     * @return list<string>
     */
    private static function beyondActor(AdminUser $admin, array $cells): array
    {
        if (self::holdsSuperAdmin($admin)) {
            return [];
        }

        return array_values(array_diff($cells, self::heldRights($admin)));
    }

    /**
     * Every right this admin holds through any of their roles, in the grid's order.
     *
     * @return list<string>
     */
    private static function heldRights(AdminUser $admin): array
    {
        $held = [];

        foreach (self::heldRoleIds($admin) as $id) {
            array_push($held, ...self::rightsOf($id));
        }

        return array_values(array_intersect(PermissionModule::cells(), array_unique($held)));
    }

    /**
     * The refusal for handing out rights one does not hold, naming them the way the grid does.
     *
     * @param  list<string>  $cells
     */
    public static function beyondRefusal(array $cells): string
    {
        $labels = array_map(static function (string $cell): string {
            [$module, $action] = array_pad(explode('.', $cell, 2), 2, '');
            $m = PermissionModule::tryFrom($module);
            $a = PermissionAction::tryFrom($action);

            return '„'.($m?->labelDe() ?? $module).' '.GermanFormat::MIDDOT.' '.($a?->labelDe() ?? $action).'“';
        }, array_slice($cells, 0, 3));

        $more = count($cells) > 3 ? sprintf(' und %s weitere', GermanFormat::integer(count($cells) - 3)) : '';

        return self::BEYOND_REFUSAL.' Nicht dabei: '.implode(', ', $labels).$more.'.';
    }

    /** Whether no account that can still sign in would be able to edit roles. */
    private static function wouldLockEveryoneOut(): bool
    {
        return DB::table('role_permissions as rp')
            ->join('model_has_roles as mhr', 'mhr.role_id', '=', 'rp.role_id')
            // A suspended account is no way back in: only accounts that may sign in count.
            ->join('admin_users as au', 'au.id', '=', 'mhr.model_id')
            ->where('mhr.model_type', (new AdminUser)->getMorphClass())
            ->where('au.status', AdminUserStatus::Active->value)
            ->where('rp.module', PermissionModule::Roles->value)
            ->where('rp.action', PermissionAction::Edit->value)
            ->where('rp.allowed', true)
            ->doesntExist();
    }

    /**
     * The role in `?rolle=`, or — when it names none — the first role that is not the Super-Admin,
     * because that one is the same every time and rarely what anybody came to look at.
     *
     * @param  list<array{id: int, isSuperAdmin: bool}>  $roles
     */
    private static function selection(array $roles, int $wanted): ?int
    {
        foreach ($roles as $role) {
            if ($role['id'] === $wanted) {
                return $wanted;
            }
        }

        foreach ($roles as $role) {
            if (! $role['isSuperAdmin']) {
                return $role['id'];
            }
        }

        return $roles[0]['id'] ?? null;
    }

    /**
     * The rows of the grid: each module with only its real actions.
     *
     * @return list<array{module: string, label: string, actions: list<string>}>
     */
    private static function modules(): array
    {
        $modules = [];

        foreach (PermissionModule::cases() as $module) {
            $modules[] = [
                'module' => $module->value,
                'label' => $module->labelDe(),
                'actions' => array_map(static fn (PermissionAction $action): string => $action->value, $module->actions()),
            ];
        }

        return $modules;
    }

    /**
     * The columns of the grid, in order.
     *
     * @return list<array{action: string, label: string}>
     */
    private static function actions(): array
    {
        $actions = [];

        foreach (PermissionAction::cases() as $action) {
            $actions[] = ['action' => $action->value, 'label' => $action->labelDe()];
        }

        return $actions;
    }

    /* ── Writing ──────────────────────────────────────────────────────────────────── */

    /**
     * A new role with every real cell written, allowed exactly where `$rights` says.
     *
     * @param  list<string>  $rights
     */
    private static function createRole(string $label, ?string $description, ?int $clonedFrom, array $rights): Role
    {
        $role = new Role;
        $role->forceFill([
            'name' => self::uniqueName($label),
            'guard_name' => self::GUARD,
            'label_de' => $label,
            'description_de' => $description,
            'cloned_from_id' => $clonedFrom,
            'is_system' => false,
        ])->save();

        self::writeMatrix((int) $role->getKey(), $rights);

        return $role;
    }

    /**
     * Every real cell of one role, allowed where `$allowed` names it and denied everywhere else —
     * a missing row and a denied row must never be told apart by guessing.
     *
     * @param  list<string>  $allowed
     */
    private static function writeMatrix(int $role, array $allowed): void
    {
        $now = now();
        $rows = [];

        foreach (PermissionModule::cases() as $module) {
            foreach ($module->actions() as $action) {
                $rows[] = [
                    'role_id' => $role,
                    'module' => $module->value,
                    'action' => $action->value,
                    'allowed' => in_array($module->value.'.'.$action->value, $allowed, true),
                    'constraints' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('role_permissions')->upsert($rows, ['role_id', 'module', 'action'], ['allowed', 'updated_at']);
    }

    /**
     * The identifier for a new role: its label as a slug, made unique. It is never shown and never
     * changes afterwards, so a rename later breaks nothing.
     */
    private static function uniqueName(string $label): string
    {
        $slug = Str::slug($label, '-', 'de');
        $base = mb_substr($slug !== '' ? $slug : 'rolle', 0, 100);
        $name = $base;
        $n = 2;

        while (DB::table('roles')->where('name', $name)->where('guard_name', self::GUARD)->exists()) {
            $name = $base.'-'.$n++;
        }

        return $name;
    }

    /** "Katalog (Kopie)", then "Katalog (Kopie 2)" … — the first that is free, within the length a label may have. */
    private static function copyLabel(string $label): string
    {
        $n = 1;

        while (true) {
            $suffix = $n === 1 ? ' (Kopie)' : ' (Kopie '.$n.')';
            $candidate = rtrim(mb_substr($label, 0, RoleStoreRequest::LABEL_MAX - mb_strlen($suffix))).$suffix;

            if (! DB::table('roles')->where('guard_name', self::GUARD)->where('label_de', $candidate)->exists()) {
                return $candidate;
            }

            $n++;
        }
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
