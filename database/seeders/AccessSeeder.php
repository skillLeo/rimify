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
 * is the whole reason the Super-Admin can later let the Inhalte publish FAQ entries but not legal
 * pages without a developer and without a deployment — `role_permissions.constraints` narrows
 * within a module, and nothing in the application asks "is this user in the Inhalte role".
 *
 * These are the standard roles (`is_system`): the panel keeps their names and never deletes them,
 * but their rights can be widened or narrowed, and any of them can be duplicated into a role of the
 * client's own. The Super-Admin alone is fixed: it is always every right there is.
 */
class AccessSeeder extends Seeder
{
    private const GUARD = 'admin';

    /**
     * Everything a module can be asked to do, for the roles that may do all of it. Only the actions
     * the module really has are written (PermissionModule::actions()), so ALL on the Inhalte means
     * everything but *Exportieren*, which the Inhalte do not have.
     */
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
     * The labels are the brief's German names (BRIEF.md §2). A database seeded before them is moved
     * over by the migration `2026_09_26_000200_german_role_labels`, which leaves alone any label the
     * client renamed.
     *
     * @var array<string, array{label: string, who: string, person: string, modules: array<string, list<string>>}>
     */
    private const ROLES = [
        'super-admin' => [
            'label' => 'Super-Admin',
            'who' => 'Inhaber',
            'person' => 'Sabine Roth',
            'modules' => [], // Filled with every real cell in run().
        ],
        'catalogue-manager' => [
            'label' => 'Katalog',
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
            'label' => 'Gutachten',
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
            'label' => 'Bestellungen',
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
            'label' => 'Inhalte',
            'who' => 'Marketing',
            'person' => 'Lea Brandt',
            'modules' => [
                'content' => self::ALL,
                'media' => self::WRITE,
            ],
        ],
        'support-agent' => [
            'label' => 'Support',
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

    /**
     * Every real cell of the grid: the Super-Admin is always everything there is.
     *
     * @return array<string, list<string>>
     */
    private function everything(): array
    {
        $all = [];

        foreach (PermissionModule::cases() as $module) {
            $all[$module->value] = array_map(static fn (PermissionAction $action): string => $action->value, $module->actions());
        }

        return $all;
    }

    /**
     * Every real cell of the grid is written, allowed or not; nothing else is.
     *
     * A missing row and a denied row are not the same thing: the panel renders a matrix of
     * switches, and an absent row would render as an empty cell that nobody can reason about. A
     * cell for an action the module does not have (PermissionModule::actions()) is no right at all,
     * so a row left over from an older seed is removed rather than kept as a promise.
     *
     * @param  array<string, list<string>>  $modules
     */
    private function seedMatrix(Role $role, array $modules): void
    {
        $now = now();
        $rows = [];

        foreach (PermissionModule::cases() as $module) {
            foreach ($module->actions() as $action) {
                $rows[] = [
                    'role_id' => $role->id,
                    'module' => $module->value,
                    'action' => $action->value,
                    'allowed' => in_array($action->value, $modules[$module->value] ?? [], true),
                    'constraints' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // One upsert for the role's real cells rather than a select-then-write pair each. The matrix
        // is rewritten wholesale on every run, which is correct: it is derived from the template
        // above and a cell that has drifted should be corrected, not preserved.
        RolePermission::query()->upsert(
            $rows,
            ['role_id', 'module', 'action'],
            ['allowed', 'constraints', 'updated_at'],
        );

        foreach (PermissionModule::cases() as $module) {
            RolePermission::query()
                ->where('role_id', $role->id)
                ->where('module', $module->value)
                ->whereNotIn('action', array_map(static fn (PermissionAction $action): string => $action->value, $module->actions()))
                ->delete();
        }
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
