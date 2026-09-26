<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Admin\RollenController;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Services\Admin\PermissionMatrix;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;

/**
 * Rollen & Rechte — changing the matrix from the panel.
 *
 * A permission is a VERB ON A MODULE and this screen is where it is granted or taken away, so the
 * three things that matter are: it actually takes effect (PermissionMatrix has no cross-request
 * cache, so the very next request must honour it), only somebody holding `roles × edit` may do it,
 * and nobody can take the last such right away — there is no second door back into this table.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function rolesAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function roleId(string $name): int
{
    return (int) DB::table('roles')->where('name', $name)->where('guard_name', 'admin')->value('id');
}

function cell(string $role, PermissionModule $module, PermissionAction $action): ?bool
{
    $value = DB::table('role_permissions')
        ->where('role_id', roleId($role))
        ->where('module', $module->value)
        ->where('action', $action->value)
        ->value('allowed');

    return $value === null ? null : (bool) $value;
}

it('grants a right, and the next request honours it', function (): void {
    $accountant = rolesAdmin('accountant');

    // Before: the Buchhaltung cannot edit the catalogue, and the panel agrees.
    expect(app(PermissionMatrix::class)->allows($accountant, PermissionModule::Catalogue, PermissionAction::Edit))
        ->toBeFalse();

    $this->actingAs(rolesAdmin(), 'admin')
        ->patch('/admin/rollen/'.roleId('accountant').'/rechte', [
            'module' => 'catalogue',
            'action' => 'edit',
            'allowed' => true,
        ])
        ->assertRedirect();

    expect(cell('accountant', PermissionModule::Catalogue, PermissionAction::Edit))->toBeTrue();

    /*
     * A fresh matrix, because that is what the next request builds: the container scopes one
     * instance per request and it memoises within that request on purpose, so asking the same
     * instance again would only prove the memo works. What matters is that nothing is cached
     * ACROSS requests — a right granted a second ago is honoured on the very next click.
     */
    expect((new PermissionMatrix)->allows($accountant, PermissionModule::Catalogue, PermissionAction::Edit))
        ->toBeTrue();
});

it('takes a right away again', function (): void {
    $this->actingAs(rolesAdmin(), 'admin')
        ->patch('/admin/rollen/'.roleId('catalogue-manager').'/rechte', [
            'module' => 'catalogue',
            'action' => 'edit',
            'allowed' => false,
        ])
        ->assertRedirect();

    expect(cell('catalogue-manager', PermissionModule::Catalogue, PermissionAction::Edit))->toBeFalse();
});

it('writes the cell even where the role never had a row for it, so absence is never "allowed"', function (): void {
    $role = roleId('support-agent');

    DB::table('role_permissions')
        ->where('role_id', $role)
        ->where('module', 'imports')
        ->where('action', 'export')
        ->delete();

    expect(cell('support-agent', PermissionModule::Imports, PermissionAction::Export))->toBeNull();

    $this->actingAs(rolesAdmin(), 'admin')
        ->patch("/admin/rollen/{$role}/rechte", ['module' => 'imports', 'action' => 'export', 'allowed' => false])
        ->assertRedirect();

    expect(cell('support-agent', PermissionModule::Imports, PermissionAction::Export))->toBeFalse();
});

it('refuses a role that may not edit roles, and changes nothing', function (): void {
    $before = cell('accountant', PermissionModule::Catalogue, PermissionAction::Edit);

    $this->actingAs(rolesAdmin('accountant'), 'admin')
        ->patch('/admin/rollen/'.roleId('accountant').'/rechte', [
            'module' => 'catalogue',
            'action' => 'edit',
            'allowed' => true,
        ])
        ->assertForbidden();

    expect(cell('accountant', PermissionModule::Catalogue, PermissionAction::Edit))->toBe($before);
});

it('refuses a module or an action that is not one of ours', function (): void {
    $role = roleId('accountant');

    $this->actingAs(rolesAdmin(), 'admin')
        ->from('/admin/rollen')
        ->patch("/admin/rollen/{$role}/rechte", ['module' => 'erfundenes', 'action' => 'edit', 'allowed' => true])
        ->assertSessionHasErrors('module');

    $this->actingAs(rolesAdmin(), 'admin')
        ->from('/admin/rollen')
        ->patch("/admin/rollen/{$role}/rechte", ['module' => 'catalogue', 'action' => 'erfunden', 'allowed' => true])
        ->assertSessionHasErrors('action');
});

it('answers a role that does not exist with a 404', function (): void {
    $this->actingAs(rolesAdmin(), 'admin')
        ->patch('/admin/rollen/99999/rechte', ['module' => 'catalogue', 'action' => 'edit', 'allowed' => true])
        ->assertNotFound();
});

it('will not let the last account that can edit roles have it taken away', function (): void {
    $superAdmin = roleId('super-admin');

    // Every other role that can edit roles goes first, so the Super Admin is genuinely the last.
    DB::table('role_permissions')
        ->where('module', PermissionModule::Roles->value)
        ->where('action', PermissionAction::Edit->value)
        ->where('role_id', '!=', $superAdmin)
        ->update(['allowed' => false]);

    $this->actingAs(rolesAdmin(), 'admin')
        ->from('/admin/rollen')
        ->patch("/admin/rollen/{$superAdmin}/rechte", [
            'module' => 'roles',
            'action' => 'edit',
            'allowed' => false,
        ])
        ->assertSessionHasErrors(['allowed' => RollenController::LOCKOUT_REFUSAL]);

    // Rolled all the way back: the right is still there, and the panel is still reachable.
    expect(cell('super-admin', PermissionModule::Roles, PermissionAction::Edit))->toBeTrue();
});

it('allows it while another role can still edit roles, because nobody is locked out', function (): void {
    $superAdmin = roleId('super-admin');
    $accountant = roleId('accountant');

    // A second way in, held by a real account.
    DB::table('role_permissions')->updateOrInsert(
        ['role_id' => $accountant, 'module' => 'roles', 'action' => 'edit'],
        ['allowed' => true],
    );

    $this->actingAs(rolesAdmin(), 'admin')
        ->patch("/admin/rollen/{$superAdmin}/rechte", [
            'module' => 'roles',
            'action' => 'edit',
            'allowed' => false,
        ])
        ->assertRedirect();

    expect(cell('super-admin', PermissionModule::Roles, PermissionAction::Edit))->toBeFalse();
});

it('leaves an audit entry naming the cell and what it was before', function (): void {
    $admin = rolesAdmin();

    $this->actingAs($admin, 'admin')->patch('/admin/rollen/'.roleId('accountant').'/rechte', [
        'module' => 'catalogue',
        'action' => 'edit',
        'allowed' => true,
    ]);

    $entry = AuditLog::query()->where('description', 'role_permission.updated')->latest('id')->first();

    expect($entry)->not->toBeNull()
        ->and($entry?->properties['module'])->toBe('catalogue')
        ->and($entry?->properties['action'])->toBe('edit')
        ->and($entry?->properties['old'])->toBeFalse()
        ->and($entry?->properties['allowed'])->toBeTrue()
        ->and($entry?->actor_email)->toBe($admin->email);
});

it('tells the page whether this admin may edit, so a reader is not shown controls that would fail', function (): void {
    $this->actingAs(rolesAdmin(), 'admin')->get('/admin/rollen')
        ->assertInertia(fn ($page) => $page->where('can.update', true));

    $this->actingAs(rolesAdmin('accountant'), 'admin')->get('/admin/rollen')
        ->assertInertia(fn ($page) => $page->where('can.update', false));
});
