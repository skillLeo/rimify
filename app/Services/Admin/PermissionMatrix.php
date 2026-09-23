<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Support\Facades\DB;

/**
 * The module × action permission matrix, read for one admin.
 *
 * Spatie stores which roles an account holds; `role_permissions` is RIMIFY's own model of what a
 * role may do — a VERB ON A MODULE, never a role name in an if-statement. Policies ask this class
 * and nothing else, so the Super Admin can widen or narrow a role from the panel without a
 * deployment, and the server enforces the result on every mutation (R-11).
 *
 * One query per admin per instance, memoised on the instance. There is deliberately no
 * cross-request cache: a permission revoked a second ago must not still be honoured, and the read
 * is a single indexed join. The container scopes one instance to the request
 * (AuthServiceProvider), so the policies and the controllers of one request share one read.
 */
final class PermissionMatrix
{
    /**
     * The allowed cells per admin id, keyed `module:action`.
     *
     * @var array<int, array<string, true>>
     */
    private array $allowed = [];

    /** True when any role this admin holds allows this action on this module. */
    public function allows(AdminUser $user, PermissionModule $module, PermissionAction $action): bool
    {
        $id = (int) $user->getKey();

        $this->allowed[$id] ??= $this->load($user);

        return isset($this->allowed[$id][$module->value.':'.$action->value]);
    }

    /**
     * Every allowed cell of every role the admin holds, in one bound query (R-14).
     *
     * `model_has_roles` is spatie/laravel-permission's pivot; `role_permissions` is ours. A cell
     * that is absent and a cell that is denied read the same here — AccessSeeder writes every
     * cell, but a role created from the panel may not, and absence must never mean "allowed".
     *
     * @return array<string, true>
     */
    private function load(AdminUser $user): array
    {
        $rows = DB::table('role_permissions as rp')
            ->join('model_has_roles as mhr', 'mhr.role_id', '=', 'rp.role_id')
            ->where('mhr.model_type', $user->getMorphClass())
            ->where('mhr.model_id', $user->getKey())
            ->where('rp.allowed', true)
            ->get(['rp.module', 'rp.action']);

        $cells = [];

        foreach ($rows as $row) {
            $cells[(string) $row->module.':'.(string) $row->action] = true;
        }

        return $cells;
    }
}
