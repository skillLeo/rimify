<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * The seven starting roles, the permission matrix behind them, and one signed-in-able account per
 * role so the panel can be reviewed as each of them.
 *
 * A permission here is a VERB ON A MODULE, never a role name in an if-statement. That distinction
 * is the whole reason the Super Admin can later let a Content Editor publish FAQ entries but not
 * legal pages without a developer and without a deployment — `role_permissions.constraints` narrows
 * within a module, and nothing in the application asks "is this user a Content Editor".
 *
 * The roles are templates, not a fixed taxonomy: every one of them can be renamed, cloned,
 * restricted or deleted from the panel.
 */
class AccessSeeder extends Seeder
{
    private const GUARD = 'admin';

    /** Everything a module can be asked to do, for the roles that may do all of it. */
    private const ALL = ['view', 'create', 'edit', 'delete', 'publish', 'export'];

    private const READ = ['view'];

    private const READ_EXPORT = ['view', 'export'];

    private const WRITE = ['view', 'create', 'edit'];

    /**
     * role name => [German label, the person holding it, module => permitted actions]
     *
     * A module absent from a role's map is not merely hidden from that role — nothing in the panel
     * queries it, and the nav item is never rendered rather than rendered and disabled.
     *
     * @var array<string, array{label: string, who: string, person: string, modules: array<string, list<string>>}>
     */
    private const ROLES = [
        'super-admin' => [
            'label' => 'Super Admin',
            'who' => 'Inhaber',
            'person' => 'Sabine Roth',
            'modules' => [], // Filled with every module × every action in run().
        ],
        'catalogue-manager' => [
            'label' => 'Katalog-Manager',
            'who' => 'Einkauf und Produktleitung',
            'person' => 'Tobias Lenz',
            'modules' => [
                'catalogue' => self::ALL,
                'media' => self::WRITE,
                'vehicles' => self::READ,
                'approvals' => self::READ,
                'reports' => self::READ,
            ],
        ],
        'compliance-editor' => [
            'label' => 'Compliance Editor',
            'who' => 'Verantwortung für die Gutachten',
            'person' => 'Dr. Mirjam Halbach',
            'modules' => [
                // Owns the approval documents and the fitment rows — and touches no price.
                'approvals' => self::ALL,
                'vehicles' => ['view', 'create', 'edit'],
                'imports' => ['view', 'create'],
                'catalogue' => self::READ,
                'reports' => self::READ,
                'audit_log' => self::READ,
            ],
        ],
        'order-manager' => [
            'label' => 'Bestell-Manager',
            'who' => 'Versand und Abwicklung',
            'person' => 'Kerem Yildiz',
            'modules' => [
                'orders' => ['view', 'edit', 'export'],
                'customers' => ['view', 'edit'],
                'reports' => self::READ_EXPORT,
                'catalogue' => self::READ,
            ],
        ],
        'content-editor' => [
            'label' => 'Content Editor',
            'who' => 'Marketing',
            'person' => 'Lea Brandt',
            'modules' => [
                'content' => self::ALL,
                'media' => self::WRITE,
            ],
        ],
        'support-agent' => [
            'label' => 'Support Agent',
            'who' => 'Kundenbetreuung',
            'person' => 'Nils Fuchs',
            'modules' => [
                'orders' => self::READ,
                'customers' => self::READ,
                'catalogue' => self::READ,
                'approvals' => self::READ,
            ],
        ],
        'accountant' => [
            'label' => 'Buchhaltung',
            'who' => 'Buchhaltung',
            'person' => 'Regine Ostermann',
            'modules' => [
                // Read and export. No write access anywhere, including its own reports.
                'orders' => self::READ_EXPORT,
                'reports' => self::READ_EXPORT,
                'customers' => self::READ,
            ],
        ],
    ];

    public function run(): void
    {
        foreach (self::ROLES as $slug => $spec) {
            // firstOrCreate rather than Role::findOrCreate: the latter is declared as returning
            // the package's Role *contract*, which has no `id` and no `forceFill`.
            $role = Role::query()->firstOrCreate(['name' => $slug, 'guard_name' => self::GUARD]);

            // `name` stays the identifier policies and the audit trail refer to; the label is what
            // a human reads and is renameable without breaking a single permission check.
            $role->forceFill([
                'label_de' => $spec['label'],
                'description_de' => $spec['who'],
                'is_system' => true,
            ])->save();

            $this->seedMatrix($role, $slug === 'super-admin' ? $this->everything() : $spec['modules']);
            $this->seedUser($role, $slug, $spec['person']);
        }
    }

    /** @return array<string, list<string>> */
    private function everything(): array
    {
        $all = [];

        foreach (PermissionModule::values() as $module) {
            $all[$module] = PermissionAction::values();
        }

        return $all;
    }

    /**
     * Every cell of the grid is written, allowed or not.
     *
     * A missing row and a denied row are not the same thing: the panel renders a matrix of
     * switches, and an absent row would render as an empty cell that nobody can reason about.
     *
     * @param  array<string, list<string>>  $modules
     */
    private function seedMatrix(Role $role, array $modules): void
    {
        $now = now();
        $rows = [];

        foreach (PermissionModule::values() as $module) {
            foreach (PermissionAction::values() as $action) {
                $rows[] = [
                    'role_id' => $role->id,
                    'module' => $module,
                    'action' => $action,
                    'allowed' => in_array($action, $modules[$module] ?? [], true),
                    'constraints' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // One upsert for the role's 72 cells rather than 72 select-then-write pairs. The matrix is
        // rewritten wholesale on every run, which is correct: it is derived from the template above
        // and a cell that has drifted should be corrected, not preserved.
        RolePermission::query()->upsert(
            $rows,
            ['role_id', 'module', 'action'],
            ['allowed', 'constraints', 'updated_at'],
        );
    }

    /**
     * One account per role, all sharing a development password that is printed in the handover and
     * must be rotated before launch. Super Admin carries a confirmed TOTP secret because two-factor
     * is mandatory for that role and the login flow has to be reviewable with it switched on.
     */
    private function seedUser(Role $role, string $slug, string $person): void
    {
        $user = AdminUser::updateOrCreate(
            ['email' => sprintf('%s@rimify.test', $slug)],
            [
                'name' => $person,
                'password' => Hash::make('rimify-dev-2026'),
                'status' => AdminUserStatus::Active->value,
                'totp_secret' => $slug === 'super-admin' ? 'JBSWY3DPEHPK3PXP' : null,
                'totp_confirmed_at' => $slug === 'super-admin' ? now() : null,
            ],
        );

        // syncRoles rather than assignRole: re-running the seeder must not leave a user carrying
        // a role they were moved out of.
        $user->syncRoles([$role]);
    }
}
