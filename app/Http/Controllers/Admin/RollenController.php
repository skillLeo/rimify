<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Rollen & Rechte — the permission matrix, as a grid rather than a list of opaque strings.
 *
 * Roles are the columns and modules the rows, because that is how the question is actually asked:
 * "can the Buchhaltung export orders?" is read across, not looked up.
 */
class RollenController extends Controller
{
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
        ]);
    }
}
