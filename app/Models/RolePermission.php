<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use Illuminate\Database\Eloquent\Model;

/**
 * One cell of the module × action permission grid.
 *
 * Spatie stores the roles; this is RIMIFY's own model of what a role may do, so the panel renders
 * a grid with a pending-change diff instead of a list of opaque permission strings. Permissions
 * are enforced server-side on every mutation via Policies — the UI only hides (R-11).
 *
 * @property PermissionModule $module
 * @property PermissionAction $action
 * @property array<string, mixed>|null $constraints
 */
class RolePermission extends Model
{
    protected $fillable = ['role_id', 'module', 'action', 'allowed', 'constraints'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'module' => PermissionModule::class,
            'action' => PermissionAction::class,
            'allowed' => 'boolean',
            'constraints' => 'array',
        ];
    }
}
