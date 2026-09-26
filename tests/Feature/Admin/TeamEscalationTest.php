<?php

declare(strict_types=1);

use App\Enums\PermissionModule;
use App\Http\Controllers\Admin\BenutzerController;
use App\Http\Controllers\Admin\RollenController;
use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;

/**
 * Nobody gets rights through the Team pages that they do not already hold.
 *
 * The attack this closes: somebody allowed to edit roles, but not a Super-Admin, invites a second
 * address of their own with an empty role — allowed, it holds nothing — then widens that role on
 * Rollen & Rechte, or copies the Super-Admin into a new role, and holds every right. Each step that
 * would hand out a right the actor lacks is refused on the server, whatever the page offers.
 *
 * And the Super-Admin role is more than its cells: an all-rights copy of it may not act on a
 * Super-Admin or hand the role out.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

/**
 * A role with exactly these cells and one active account holding it.
 *
 * @param  list<string>  $cells
 */
function eskalationAccount(string $role, array $cells): AdminUser
{
    $id = DB::table('roles')->insertGetId([
        'name' => $role,
        'guard_name' => 'admin',
        'label_de' => ucfirst($role),
        'is_system' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    foreach ($cells as $cell) {
        [$module, $action] = explode('.', $cell);

        DB::table('role_permissions')->insert([
            'role_id' => $id,
            'module' => $module,
            'action' => $action,
            'allowed' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    $user = AdminUser::factory()->create(['email' => $role.'@rimify.test', 'name' => ucfirst($role)]);
    $user->syncRoles([$role]);

    return $user;
}

/** Manages roles and sees the catalogue — and holds nothing else. */
function eskalationLead(): AdminUser
{
    return eskalationAccount('teamleitung', ['roles.view', 'roles.create', 'roles.edit', 'catalogue.view']);
}

/** A custom role nobody holds, with no rights. */
function eskalationEmptyRole(string $name = 'zweitkonto'): int
{
    return (int) DB::table('roles')->insertGetId([
        'name' => $name,
        'guard_name' => 'admin',
        'label_de' => ucfirst($name),
        'is_system' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

function eskalationAllowed(int $role, string $cell): bool
{
    [$module, $action] = explode('.', $cell);

    return (bool) DB::table('role_permissions')->where('role_id', $role)->where('module', $module)->where('action', $action)->value('allowed');
}

function eskalationRoleId(string $name): int
{
    return (int) DB::table('roles')->where('name', $name)->where('guard_name', 'admin')->value('id');
}

describe('handing a role rights', function (): void {
    it('refuses a single right the editor does not hold, and names it', function (): void {
        $role = eskalationEmptyRole();

        $this->actingAs(eskalationLead(), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$role}/rechte", ['module' => 'orders', 'action' => 'view', 'allowed' => true])
            ->assertSessionHasErrors(['allowed' => RollenController::BEYOND_REFUSAL.' Nicht dabei: „Bestellungen · Ansehen“.']);

        expect(eskalationAllowed($role, 'orders.view'))->toBeFalse();
    });

    it('still lets the editor hand out a right they hold', function (): void {
        $role = eskalationEmptyRole();

        $this->actingAs(eskalationLead(), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$role}/rechte", ['module' => 'catalogue', 'action' => 'view', 'allowed' => true])
            ->assertSessionHasNoErrors();

        expect(eskalationAllowed($role, 'catalogue.view'))->toBeTrue();
    });

    it('refuses a whole set that carries a right the editor does not hold, and writes none of it', function (): void {
        $role = eskalationEmptyRole();

        $this->actingAs(eskalationLead(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => ['catalogue.view', 'settings.edit', 'audit_log.view']])
            ->assertSessionHasErrors('rights');

        expect(eskalationAllowed($role, 'catalogue.view'))->toBeFalse()
            ->and(eskalationAllowed($role, 'settings.edit'))->toBeFalse();
    });

    it('refuses to copy the Super-Admin into a new role', function (): void {
        $lead = eskalationLead();
        $before = DB::table('roles')->count();

        $this->actingAs($lead, 'admin')->from('/admin/rollen')
            ->post('/admin/rollen', ['label' => 'Alles', 'copyFrom' => eskalationRoleId('super-admin')])
            ->assertSessionHasErrors('copyFrom');

        expect(DB::table('roles')->count())->toBe($before);
    });

    it('refuses to duplicate a role holding rights the editor lacks', function (): void {
        $lead = eskalationLead();
        $before = DB::table('roles')->count();

        $this->actingAs($lead, 'admin')->from('/admin/rollen')
            ->post('/admin/rollen/'.eskalationRoleId('accountant').'/duplizieren')
            ->assertSessionHasErrors('role');

        expect(DB::table('roles')->count())->toBe($before);
    });

    it('lets the Super-Admin hand out anything', function (): void {
        $role = eskalationEmptyRole();

        $this->actingAs(AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => ['settings.edit', 'audit_log.export']])
            ->assertSessionHasNoErrors();

        expect(eskalationAllowed($role, 'settings.edit'))->toBeTrue();
    });

    it('tells the page which rights the editor may hand out', function (): void {
        $this->actingAs(eskalationLead(), 'admin')->get('/admin/rollen')
            ->assertInertia(fn ($page) => $page->where('grantable', ['catalogue.view', 'roles.view', 'roles.create', 'roles.edit']));

        $this->actingAs(AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail(), 'admin')->get('/admin/rollen')
            ->assertInertia(fn ($page) => $page->where('grantable', null));
    });
});

describe('the Super-Admin role', function (): void {
    /** Every real right — but through a copy, not the Super-Admin role itself. */
    function eskalationCopy(): AdminUser
    {
        return eskalationAccount('allesdarf', PermissionModule::cells());
    }

    it('cannot be taken from the Super-Admin by an all-rights copy of it', function (): void {
        $super = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

        $this->actingAs(eskalationCopy(), 'admin')->from('/admin/benutzer')
            ->patch("/admin/benutzer/{$super->id}/rolle", ['role_id' => eskalationRoleId('support-agent')])
            ->assertSessionHasErrors(['role_id' => BenutzerController::OUT_OF_REACH]);

        expect($super->fresh()?->getRoleNames()->all())->toBe(['super-admin']);
    });

    it('cannot be suspended by an all-rights copy', function (): void {
        $super = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

        $this->actingAs(eskalationCopy(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$super->id}/sperren")
            ->assertSessionHasErrors(['account' => BenutzerController::OUT_OF_REACH]);

        expect($super->fresh()?->canSignIn())->toBeTrue();
    });

    it('is not handed out by an all-rights copy either', function (): void {
        $agent = AdminUser::query()->where('email', 'support-agent@rimify.test')->firstOrFail();

        $this->actingAs(eskalationCopy(), 'admin')->from('/admin/benutzer')
            ->patch("/admin/benutzer/{$agent->id}/rolle", ['role_id' => eskalationRoleId('super-admin')])
            ->assertSessionHasErrors('role_id');

        expect($agent->fresh()?->getRoleNames()->all())->toBe(['support-agent']);
    });
});
