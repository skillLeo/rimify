<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Admin\RollenController;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Services\Admin\AdminNavigation;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;

/**
 * Rollen & Rechte — managing the roles themselves (BRIEF.md §2, team-build-plan.md).
 *
 * Every endpoint is tried by a role that may and one that may not; every guard in the build plan is
 * one test here; every write is checked for its audit entry under the event name and the property
 * keys the Protokoll reads. The grid only knows real cells, so an unreal one is refused by name.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function verwaltungAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function verwaltungRoleId(string $name): int
{
    return (int) DB::table('roles')->where('name', $name)->where('guard_name', 'admin')->value('id');
}

/** @return list<string> */
function verwaltungRights(int $role): array
{
    $cells = DB::table('role_permissions')
        ->where('role_id', $role)
        ->where('allowed', true)
        ->get(['module', 'action'])
        ->map(static fn (object $row): string => $row->module.'.'.$row->action)
        ->all();

    return array_values(array_intersect(PermissionModule::cells(), $cells));
}

/** @param  list<string>  $cells */
function verwaltungGrant(string $role, array $cells, bool $allowed = true): void
{
    foreach ($cells as $cell) {
        [$module, $action] = explode('.', $cell);

        DB::table('role_permissions')->updateOrInsert(
            ['role_id' => verwaltungRoleId($role), 'module' => $module, 'action' => $action],
            ['allowed' => $allowed],
        );
    }
}

/** A role of the client's own, held by nobody, straight into the tables. */
function verwaltungCustomRole(string $label = 'Lager', array $rights = []): int
{
    $role = new Role;
    $role->forceFill(['name' => 'eigene-'.mb_strtolower($label), 'guard_name' => 'admin', 'label_de' => $label, 'is_system' => false])->save();

    foreach (PermissionModule::cases() as $module) {
        foreach ($module->actions() as $action) {
            DB::table('role_permissions')->insert([
                'role_id' => $role->getKey(),
                'module' => $module->value,
                'action' => $action->value,
                'allowed' => in_array($module->value.'.'.$action->value, $rights, true),
            ]);
        }
    }

    return (int) $role->getKey();
}

function verwaltungEntry(string $event): ?AuditLog
{
    return AuditLog::query()->where('description', $event)->latest('id')->first();
}

/**
 * The next request's view of the matrix. The container scopes one PermissionMatrix per request, and
 * a test that changes a cell between two requests of the same account asks for a fresh one.
 */
function verwaltungNextRequest(): void
{
    app()->forgetScopedInstances();
}

describe('the actions each module really has', function (): void {
    it('names only real actions, and no module has all six by accident', function (): void {
        expect(PermissionModule::Orders->actions())->toBe([PermissionAction::View, PermissionAction::Edit, PermissionAction::Export])
            ->and(PermissionModule::AuditLog->actions())->toBe([PermissionAction::View, PermissionAction::Export])
            ->and(PermissionModule::Content->hasAction(PermissionAction::Export))->toBeFalse()
            ->and(PermissionModule::AuditLog->hasAction(PermissionAction::Delete))->toBeFalse()
            ->and(PermissionModule::Catalogue->actions())->toHaveCount(5)
            ->and(PermissionModule::cells())->toHaveCount(33);
    });

    it('seeds the Super-Admin with every real cell and not one row more', function (): void {
        $superAdmin = verwaltungRoleId('super-admin');

        expect(verwaltungRights($superAdmin))->toBe(PermissionModule::cells())
            ->and(DB::table('role_permissions')->where('role_id', $superAdmin)->count())->toBe(33);
    });

    it('removes a row an older seed left for an action the module does not have', function (): void {
        DB::table('role_permissions')->insert([
            'role_id' => verwaltungRoleId('content-editor'), 'module' => 'content', 'action' => 'export', 'allowed' => true,
        ]);

        $this->seed(AccessSeeder::class);

        expect(DB::table('role_permissions')->where('module', 'content')->where('action', 'export')->exists())->toBeFalse();
    });

    it('sends the page only real actions, and only real rights', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->get('/admin/rollen')
            ->assertOk()
            ->assertInertia(function (AssertableInertia $page): void {
                $props = $page->toArray()['props'];
                $protokoll = collect($props['modules'])->firstWhere('module', 'audit_log');

                expect($protokoll['actions'])->toBe(['view', 'export'])
                    ->and(array_column($props['actions'], 'action'))->toBe(PermissionAction::values());

                foreach ($props['roles'] as $role) {
                    expect(array_diff($role['rights'], PermissionModule::cells()))->toBe([]);
                }
            });
    });
});

describe('the page', function (): void {
    it('lists the roles under their German names and selects the first that is not the Super-Admin', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->get('/admin/rollen')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Rollen/Index')
                ->has('roles', 7)
                ->where('roles.0.label', 'Super-Admin')
                ->where('roles.0.isSuperAdmin', true)
                ->where('roles.1.label', 'Katalog')
                ->where('selected', verwaltungRoleId('catalogue-manager'))
                ->where('accounts', 7)
                ->where('can', ['create' => true, 'update' => true, 'delete' => true]));
    });

    it('selects the role named in the address, and falls back when it names none', function (): void {
        $accountant = verwaltungRoleId('accountant');

        $this->actingAs(verwaltungAdmin(), 'admin')->get('/admin/rollen?rolle='.$accountant)
            ->assertInertia(fn (AssertableInertia $page) => $page->where('selected', $accountant));

        $this->actingAs(verwaltungAdmin(), 'admin')->get('/admin/rollen?rolle=99999')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('selected', verwaltungRoleId('catalogue-manager')));
    });

    it('ships the navigation the selected role would see', function (): void {
        $role = verwaltungRoleId('compliance-editor');

        $this->actingAs(verwaltungAdmin(), 'admin')->get('/admin/rollen?rolle='.$role)
            ->assertInertia(fn (AssertableInertia $page) => $page->where('navigation', app(AdminNavigation::class)->forRole($role)));
    });

    it('marks the roles this viewer holds, where only a Super-Admin may add rights', function (): void {
        verwaltungGrant('catalogue-manager', ['roles.view', 'roles.edit']);

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->get('/admin/rollen')
            ->assertInertia(function (AssertableInertia $page): void {
                $roles = collect($page->toArray()['props']['roles'])->keyBy('name');

                expect($roles['catalogue-manager']['raiseBlocked'])->toBeTrue()
                    ->and($roles['accountant']['raiseBlocked'])->toBeFalse();
            });

        $this->actingAs(verwaltungAdmin(), 'admin')->get('/admin/rollen')
            ->assertInertia(function (AssertableInertia $page): void {
                expect(collect($page->toArray()['props']['roles'])->pluck('raiseBlocked')->unique()->all())->toBe([false]);
            });
    });

    it('lets a reader look without offering a single write', function (): void {
        verwaltungGrant('support-agent', ['roles.view']);

        $this->actingAs(verwaltungAdmin('support-agent'), 'admin')->get('/admin/rollen')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('can', ['create' => false, 'update' => false, 'delete' => false])
                ->has('roles', 7));
    });
});

describe('Ansicht als Rolle', function (): void {
    it('is the tree an account holding only that role gets in the rail, without the counts', function (string $name): void {
        $mine = app(AdminNavigation::class)->for(verwaltungAdmin($name));
        $asRole = app(AdminNavigation::class)->forRole(verwaltungRoleId($name));

        $withoutCounts = array_map(static fn (array $group): array => [
            ...$group,
            'pages' => array_map(static fn (array $page): array => [...$page, 'count' => null, 'countTone' => 'neutral'], $group['pages']),
        ], $mine);

        expect($asRole)->toBe($withoutCounts);
    })->with(['super-admin', 'catalogue-manager', 'compliance-editor', 'accountant']);

    it('follows the role\'s own cells: a view taken away is a group gone', function (): void {
        $manager = verwaltungRoleId('catalogue-manager');

        // The catalogue manager's catalogue page today is Einstellungen › Zubehörpreise.
        expect(array_column(app(AdminNavigation::class)->forRole($manager), 'key'))->toContain('einstellungen');

        verwaltungGrant('catalogue-manager', ['catalogue.view'], false);

        expect(array_column(app(AdminNavigation::class)->forRole($manager), 'key'))->not->toContain('einstellungen')
            ->and(app(AdminNavigation::class)->forRole($manager)[0]['key'])->toBe('uebersicht');
    });
});

describe('creating a role', function (): void {
    it('makes an empty role with every real cell written as denied, and opens it', function (): void {
        $response = $this->actingAs(verwaltungAdmin(), 'admin')
            ->post('/admin/rollen', ['label' => 'Lager', 'description' => 'Wareneingang', 'copyFrom' => null]);

        $role = DB::table('roles')->where('label_de', 'Lager')->first();

        expect($role)->not->toBeNull()
            ->and($role->name)->toBe('lager')
            ->and((bool) $role->is_system)->toBeFalse()
            ->and($role->description_de)->toBe('Wareneingang')
            ->and(DB::table('role_permissions')->where('role_id', $role->id)->count())->toBe(33)
            ->and(verwaltungRights((int) $role->id))->toBe([]);

        $response->assertRedirect('/admin/rollen?rolle='.$role->id)
            ->assertSessionHas('toast', RollenController::CREATED_TOAST);

        $entry = verwaltungEntry('role.created');

        expect($entry?->properties->all())->toEqual(['role_id' => (int) $role->id, 'label' => 'Lager', 'copied_from_label' => null])
            ->and((int) $entry?->subject_id)->toBe((int) $role->id)
            ->and($entry?->actor_email)->toBe('super-admin@rimify.test');
    });

    it('starts with the rights of the role it copies, and remembers where it came from', function (): void {
        $source = verwaltungRoleId('catalogue-manager');

        $this->actingAs(verwaltungAdmin(), 'admin')
            ->post('/admin/rollen', ['label' => 'Einkauf', 'copyFrom' => $source])
            ->assertSessionHasNoErrors();

        $role = DB::table('roles')->where('label_de', 'Einkauf')->first();

        expect(verwaltungRights((int) $role->id))->toBe(verwaltungRights($source))
            ->and((int) $role->cloned_from_id)->toBe($source)
            ->and(verwaltungEntry('role.created')?->properties['copied_from_label'])->toBe('Katalog');
    });

    it('never makes a second Super-Admin out of the name', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->post('/admin/rollen', ['label' => 'Super Admin'])->assertSessionHasNoErrors();

        $role = DB::table('roles')->where('label_de', 'Super Admin')->first();

        expect($role->name)->toBe('super-admin-2');

        // An ordinary role: its rights can be changed like any other's.
        $this->actingAs(verwaltungAdmin(), 'admin')
            ->patch("/admin/rollen/{$role->id}/rechte", ['module' => 'orders', 'action' => 'view', 'allowed' => true])
            ->assertSessionHasNoErrors();
    });

    it('asks for a name, and a free one', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->post('/admin/rollen', ['label' => ''])
            ->assertSessionHasErrors(['label' => 'Gib der Rolle eine Bezeichnung.']);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->post('/admin/rollen', ['label' => 'Buchhaltung'])
            ->assertSessionHasErrors(['label' => 'Eine Rolle mit dieser Bezeichnung gibt es schon.']);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->post('/admin/rollen', ['label' => 'Lager', 'copyFrom' => 99999])
            ->assertSessionHasErrors(['copyFrom' => 'Diese Rolle gibt es nicht mehr.']);
    });

    it('refuses a role without roles × create, and makes nothing', function (): void {
        verwaltungGrant('catalogue-manager', ['roles.view', 'roles.edit']);

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')
            ->post('/admin/rollen', ['label' => 'Lager'])
            ->assertForbidden();

        expect(DB::table('roles')->where('label_de', 'Lager')->exists())->toBeFalse();
    });
});

describe('renaming a role', function (): void {
    it('renames a role of the client\'s own and records before and after', function (): void {
        $role = verwaltungCustomRole('Lager');

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$role}", ['label' => 'Wareneingang', 'description' => 'Annahme und Prüfung'])
            ->assertRedirect('/admin/rollen')
            ->assertSessionHas('toast', RollenController::SAVED_TOAST);

        expect(DB::table('roles')->where('id', $role)->value('label_de'))->toBe('Wareneingang');

        expect(verwaltungEntry('role.updated')?->properties->all())->toEqual([
            'role_id' => $role,
            'old' => ['label' => 'Lager', 'description' => null],
            'new' => ['label' => 'Wareneingang', 'description' => 'Annahme und Prüfung'],
        ]);
    });

    it('refuses a name saved from a dialog opened before the last save of it, and keeps that save (the admin audit\'s F-25)', function (): void {
        $role = verwaltungCustomRole('Lager');
        $stale = collect($this->actingAs(verwaltungAdmin(), 'admin')->get("/admin/rollen?rolle={$role}")->viewData('page')['props']['roles'])->firstWhere('id', $role)['nameStamp'] ?? null;
        expect($stale)->toBeString()->not->toBe('');

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$role}", ['label' => 'Lager', 'description' => 'Wareneingang und Versand'])->assertSessionHasNoErrors();
        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')->withHeader(EditStamp::HEADER, $stale)
            ->patch("/admin/rollen/{$role}", ['label' => 'Lager Nord', 'description' => null])
            ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

        expect((array) DB::table('roles')->where('id', $role)->first(['label_de', 'description_de']))->toBe(['label_de' => 'Lager', 'description_de' => 'Wareneingang und Versand']);
    });

    it('keeps a standard role\'s name, and lets its description change', function (): void {
        $role = verwaltungRoleId('accountant');

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$role}", ['label' => 'Finanzen', 'description' => 'Buchhaltung'])
            ->assertSessionHasErrors(['label' => RollenController::SYSTEM_RENAME]);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$role}", ['label' => 'Buchhaltung', 'description' => 'Rechnungen und Export'])
            ->assertSessionHasNoErrors();

        expect(DB::table('roles')->where('id', $role)->value('label_de'))->toBe('Buchhaltung')
            ->and(DB::table('roles')->where('id', $role)->value('description_de'))->toBe('Rechnungen und Export');
    });

    it('does not change the Super-Admin at all', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch('/admin/rollen/'.verwaltungRoleId('super-admin'), ['label' => 'Super-Admin', 'description' => 'Chef'])
            ->assertSessionHasErrors(['label' => RollenController::SUPER_ADMIN_UPDATE]);

        expect(DB::table('roles')->where('name', 'super-admin')->value('description_de'))->toBe('Inhaber');
    });

    it('writes nothing when nothing changed', function (): void {
        $role = verwaltungCustomRole('Lager');

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$role}", ['label' => 'Lager', 'description' => null])
            ->assertSessionHas('toast', RollenController::UNCHANGED_TOAST);

        expect(verwaltungEntry('role.updated'))->toBeNull();
    });

    it('refuses a role without roles × edit, and answers an unknown role with a 404', function (): void {
        $role = verwaltungCustomRole('Lager');
        verwaltungGrant('support-agent', ['roles.view']);

        $this->actingAs(verwaltungAdmin('support-agent'), 'admin')
            ->patch("/admin/rollen/{$role}", ['label' => 'Wareneingang'])
            ->assertForbidden();

        $this->actingAs(verwaltungAdmin(), 'admin')
            ->patch('/admin/rollen/99999', ['label' => 'Wareneingang'])
            ->assertNotFound();

        expect(DB::table('roles')->where('id', $role)->value('label_de'))->toBe('Lager');
    });
});

describe('duplicating a role', function (): void {
    it('copies rights and description under a free name, and opens the copy', function (): void {
        $source = verwaltungRoleId('catalogue-manager');

        $first = $this->actingAs(verwaltungAdmin(), 'admin')->post("/admin/rollen/{$source}/duplizieren");
        $second = $this->actingAs(verwaltungAdmin(), 'admin')->post("/admin/rollen/{$source}/duplizieren");

        $copy = DB::table('roles')->where('label_de', 'Katalog (Kopie)')->first();
        $again = DB::table('roles')->where('label_de', 'Katalog (Kopie 2)')->first();

        expect($copy)->not->toBeNull()
            ->and($again)->not->toBeNull()
            ->and(verwaltungRights((int) $copy->id))->toBe(verwaltungRights($source))
            ->and($copy->description_de)->toBe('Einkauf und Produktleitung')
            ->and((bool) $copy->is_system)->toBeFalse()
            ->and((int) $copy->cloned_from_id)->toBe($source);

        $first->assertRedirect('/admin/rollen?rolle='.$copy->id)->assertSessionHas('toast', RollenController::DUPLICATED_TOAST);
        $second->assertRedirect('/admin/rollen?rolle='.$again->id);

        expect(verwaltungEntry('role.duplicated')?->properties->all())->toEqual([
            'role_id' => (int) $again->id,
            'label' => 'Katalog (Kopie 2)',
            'copied_from_label' => 'Katalog',
        ]);
    });

    it('refuses a role without roles × create', function (): void {
        verwaltungGrant('support-agent', ['roles.view', 'roles.edit']);

        $this->actingAs(verwaltungAdmin('support-agent'), 'admin')
            ->post('/admin/rollen/'.verwaltungRoleId('accountant').'/duplizieren')
            ->assertForbidden();

        expect(DB::table('roles')->where('label_de', 'Buchhaltung (Kopie)')->exists())->toBeFalse();
    });
});

describe('deleting a role', function (): void {
    it('deletes a role nobody holds, with its cells, and records it', function (): void {
        $role = verwaltungCustomRole('Lager', ['orders.view']);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen?rolle='.$role)
            ->delete("/admin/rollen/{$role}")
            ->assertRedirect('/admin/rollen')
            ->assertSessionHas('toast', RollenController::DELETED_TOAST);

        expect(DB::table('roles')->where('id', $role)->exists())->toBeFalse()
            ->and(DB::table('role_permissions')->where('role_id', $role)->exists())->toBeFalse()
            ->and(verwaltungEntry('role.deleted')?->properties->all())->toEqual(['role_id' => $role, 'label' => 'Lager']);
    });

    it('refuses a role accounts still hold, and says how many', function (): void {
        $role = verwaltungCustomRole('Lager');
        verwaltungAdmin('support-agent')->assignRole('eigene-lager');

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->delete("/admin/rollen/{$role}")
            ->assertSessionHasErrors(['role' => 'Diese Rolle hat noch 1 Konto. Gib ihm zuerst eine andere Rolle.']);

        verwaltungAdmin('accountant')->assignRole('eigene-lager');

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->delete("/admin/rollen/{$role}")
            ->assertSessionHasErrors(['role' => 'Diese Rolle haben noch 2 Konten. Gib ihnen zuerst eine andere Rolle.']);

        expect(DB::table('roles')->where('id', $role)->exists())->toBeTrue()
            ->and(DB::table('model_has_roles')->where('role_id', $role)->count())->toBe(2)
            ->and(verwaltungEntry('role.deleted'))->toBeNull();
    });

    it('never deletes a standard role or the Super-Admin', function (): void {
        // Nobody holds it any more, so the only reason left is that it is a standard role.
        verwaltungAdmin('accountant')->syncRoles([]);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->delete('/admin/rollen/'.verwaltungRoleId('accountant'))
            ->assertSessionHasErrors(['role' => RollenController::SYSTEM_DELETE]);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->delete('/admin/rollen/'.verwaltungRoleId('super-admin'))
            ->assertSessionHasErrors(['role' => RollenController::SUPER_ADMIN_DELETE]);

        expect(DB::table('roles')->whereIn('name', ['accountant', 'super-admin'])->count())->toBe(2);
    });

    it('refuses a role without roles × delete', function (): void {
        $role = verwaltungCustomRole('Lager');
        verwaltungGrant('catalogue-manager', ['roles.view', 'roles.create', 'roles.edit']);

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')
            ->delete("/admin/rollen/{$role}")
            ->assertForbidden();

        expect(DB::table('roles')->where('id', $role)->exists())->toBeTrue();
    });
});

describe('one cell', function (): void {
    it('refuses a cell whose module does not have that action, in German', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch('/admin/rollen/'.verwaltungRoleId('accountant').'/rechte', ['module' => 'audit_log', 'action' => 'delete', 'allowed' => true])
            ->assertSessionHasErrors(['action' => '„Löschen“ gibt es im Bereich „Protokoll“ nicht.']);

        expect(DB::table('role_permissions')->where('module', 'audit_log')->where('action', 'delete')->exists())->toBeFalse();
    });

    it('does not change the Super-Admin\'s rights', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch('/admin/rollen/'.verwaltungRoleId('super-admin').'/rechte', ['module' => 'orders', 'action' => 'view', 'allowed' => false])
            ->assertSessionHasErrors(['allowed' => RollenController::SUPER_ADMIN_RIGHTS]);

        expect(verwaltungRights(verwaltungRoleId('super-admin')))->toContain('orders.view');
    });

    it('lets nobody add a right to a role they hold, but lets them take one away', function (): void {
        verwaltungGrant('catalogue-manager', ['roles.view', 'roles.edit']);
        $own = verwaltungRoleId('catalogue-manager');

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$own}/rechte", ['module' => 'audit_log', 'action' => 'export', 'allowed' => true])
            ->assertSessionHasErrors(['allowed' => RollenController::RAISE_OWN_REFUSAL]);

        expect(verwaltungRights($own))->not->toContain('audit_log.export');

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->from('/admin/rollen')
            ->patch("/admin/rollen/{$own}/rechte", ['module' => 'vehicles', 'action' => 'view', 'allowed' => false])
            ->assertSessionHasNoErrors();

        // Another role they do not hold is theirs to widen — with rights they hold themselves…
        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->from('/admin/rollen')
            ->patch('/admin/rollen/'.verwaltungRoleId('accountant').'/rechte', ['module' => 'catalogue', 'action' => 'view', 'allowed' => true])
            ->assertSessionHasNoErrors();

        // …and never with one they no longer have: the one they just gave up stays out of reach.
        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->from('/admin/rollen')
            ->patch('/admin/rollen/'.verwaltungRoleId('accountant').'/rechte', ['module' => 'vehicles', 'action' => 'view', 'allowed' => true])
            ->assertSessionHasErrors('allowed');

        expect(verwaltungRights($own))->not->toContain('vehicles.view')
            ->and(verwaltungRights(verwaltungRoleId('accountant')))->toContain('catalogue.view')
            ->and(verwaltungRights(verwaltungRoleId('accountant')))->not->toContain('vehicles.view');
    });

    it('lets a Super-Admin widen a role they also hold', function (): void {
        verwaltungAdmin()->syncRoles(['super-admin', 'accountant']);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->patch('/admin/rollen/'.verwaltungRoleId('accountant').'/rechte', ['module' => 'vehicles', 'action' => 'view', 'allowed' => true])
            ->assertSessionHasNoErrors();

        expect(verwaltungRights(verwaltungRoleId('accountant')))->toContain('vehicles.view');
    });

    it('names the role as the entry\'s subject', function (): void {
        $role = verwaltungRoleId('accountant');

        $this->actingAs(verwaltungAdmin(), 'admin')
            ->patch("/admin/rollen/{$role}/rechte", ['module' => 'vehicles', 'action' => 'view', 'allowed' => true]);

        $entry = verwaltungEntry('role_permission.updated');

        expect((int) $entry?->subject_id)->toBe($role)
            // The label is kept on the entry, so the Protokoll still names the role once it is renamed or gone.
            ->and($entry?->properties->all())->toEqual(['role_id' => $role, 'label' => 'Buchhaltung', 'module' => 'vehicles', 'action' => 'view', 'old' => false, 'allowed' => true]);
    });
});

describe('replacing a role\'s rights', function (): void {
    it('writes the whole set and records what came and what went', function (): void {
        $role = verwaltungRoleId('accountant');
        // Before: orders view+export, reports view+export, customers view.
        $next = ['catalogue.view', 'orders.view', 'customers.view', 'reports.view'];

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => ['reports.view', 'orders.view', 'catalogue.view', 'customers.view']])
            ->assertRedirect('/admin/rollen')
            ->assertSessionHas('toast', RollenController::SAVED_TOAST);

        expect(verwaltungRights($role))->toBe($next)
            ->and(DB::table('role_permissions')->where('role_id', $role)->where('module', 'orders')->where('action', 'export')->value('allowed'))->toEqual(0);

        $entry = verwaltungEntry('role_permissions.replaced');

        expect($entry?->properties->all())->toEqual([
            'role_id' => $role,
            'label' => 'Buchhaltung',
            'added' => ['catalogue.view'],
            'removed' => ['orders.export', 'reports.export'],
        ])->and((int) $entry?->subject_id)->toBe($role);
    });

    it('takes an empty set as "no rights at all"', function (): void {
        $role = verwaltungCustomRole('Lager', ['orders.view']);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => []])
            ->assertSessionHasNoErrors();

        expect(verwaltungRights($role))->toBe([]);
    });

    it('refuses an unreal or unknown right by name and writes nothing', function (): void {
        $role = verwaltungRoleId('accountant');
        $before = verwaltungRights($role);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => ['orders.view', 'orders.publish']])
            ->assertSessionHasErrors(['rights.1' => '„Veröffentlichen“ gibt es im Bereich „Bestellungen“ nicht.']);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => ['erfunden.view']])
            ->assertSessionHasErrors(['rights.0' => 'Dieses Recht gibt es nicht.']);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", [])
            ->assertSessionHasErrors(['rights' => 'Die Rechte fehlen.']);

        expect(verwaltungRights($role))->toBe($before);
    });

    it('does not change the Super-Admin\'s rights', function (): void {
        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->put('/admin/rollen/'.verwaltungRoleId('super-admin').'/rechte', ['rights' => ['orders.view']])
            ->assertSessionHasErrors(['rights' => RollenController::SUPER_ADMIN_RIGHTS]);

        expect(verwaltungRights(verwaltungRoleId('super-admin')))->toBe(PermissionModule::cells());
    });

    it('lets nobody widen a role they hold, but lets them narrow it', function (): void {
        verwaltungGrant('catalogue-manager', ['roles.view', 'roles.edit']);
        $own = verwaltungRoleId('catalogue-manager');
        $before = verwaltungRights($own);

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$own}/rechte", ['rights' => [...$before, 'orders.view']])
            ->assertSessionHasErrors(['rights' => RollenController::RAISE_OWN_REFUSAL]);

        expect(verwaltungRights($own))->toBe($before);

        $narrower = array_values(array_diff($before, ['vehicles.view']));

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$own}/rechte", ['rights' => $narrower])
            ->assertSessionHasNoErrors();

        expect(verwaltungRights($own))->toBe($narrower);
    });

    it('will not take the last way in to this page away', function (): void {
        verwaltungGrant('catalogue-manager', ['roles.view', 'roles.edit']);
        verwaltungAdmin()->syncRoles([]);
        $own = verwaltungRoleId('catalogue-manager');
        $before = verwaltungRights($own);

        $this->actingAs(verwaltungAdmin('catalogue-manager'), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$own}/rechte", ['rights' => array_values(array_diff($before, ['roles.edit']))])
            ->assertSessionHasErrors(['rights' => RollenController::LOCKOUT_REFUSAL]);

        expect(verwaltungRights($own))->toBe($before)
            ->and(verwaltungEntry('role_permissions.replaced'))->toBeNull();
    });

    it('writes nothing when nothing changes', function (): void {
        $role = verwaltungRoleId('accountant');

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => verwaltungRights($role)])
            ->assertSessionHas('toast', RollenController::UNCHANGED_TOAST);

        expect(verwaltungEntry('role_permissions.replaced'))->toBeNull();
    });

    it('refuses a role without roles × edit, and answers an unknown role with a 404', function (): void {
        verwaltungGrant('support-agent', ['roles.view']);
        $role = verwaltungRoleId('accountant');
        $before = verwaltungRights($role);

        $this->actingAs(verwaltungAdmin('support-agent'), 'admin')
            ->put("/admin/rollen/{$role}/rechte", ['rights' => []])
            ->assertForbidden();

        verwaltungNextRequest();

        $this->actingAs(verwaltungAdmin(), 'admin')
            ->put('/admin/rollen/99999/rechte', ['rights' => []])
            ->assertNotFound();

        expect(verwaltungRights($role))->toBe($before);
    });
});

describe('the German labels migration', function (): void {
    it('renames only the roles still carrying their seeded label, and back', function (): void {
        $migration = require database_path('migrations/commerce/2026_09_26_000200_german_role_labels.php');

        DB::table('roles')->where('name', 'catalogue-manager')->update(['label_de' => 'Katalog-Manager']);
        DB::table('roles')->where('name', 'support-agent')->update(['label_de' => 'Kundendienst']);
        // Case is a choice too: the client wrote this on purpose.
        DB::table('roles')->where('name', 'content-editor')->update(['label_de' => 'content editor']);

        $migration->up();

        $labels = fn (): array => DB::table('roles')->where('guard_name', 'admin')->pluck('label_de', 'name')->all();

        expect($labels())->toMatchArray([
            'super-admin' => 'Super-Admin',
            'catalogue-manager' => 'Katalog',
            'support-agent' => 'Kundendienst',
            'content-editor' => 'content editor',
            'accountant' => 'Buchhaltung',
        ]);

        $migration->down();

        expect($labels())->toMatchArray([
            'super-admin' => 'Super Admin',
            'catalogue-manager' => 'Katalog-Manager',
            'compliance-editor' => 'Compliance Editor',
            'support-agent' => 'Kundendienst',
            'content-editor' => 'content editor',
            'accountant' => 'Buchhaltung',
        ]);
    });
});

describe('deleting a role once named in an invitation', function (): void {
    /** An invitation row for the role, in the given state. */
    function verwaltungInvitation(int $role, array $state): void
    {
        DB::table('admin_invitations')->insert([
            'email' => 'lager'.uniqid().'@example.test',
            'role_id' => $role,
            'token_hash' => hash('sha256', uniqid('', true)),
            'expires_at' => now()->addDays(7),
            'created_at' => now(),
            'updated_at' => now(),
            ...$state,
        ]);
    }

    it('deletes it when every invitation naming it is closed, and the invitation lets go of it', function (): void {
        $role = verwaltungCustomRole('Lager');
        verwaltungInvitation($role, ['revoked_at' => now()]);
        verwaltungInvitation($role, ['expires_at' => now()->subDay()]);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->delete("/admin/rollen/{$role}")
            ->assertSessionHasNoErrors();

        expect(DB::table('roles')->where('id', $role)->exists())->toBeFalse()
            ->and(DB::table('admin_invitations')->count())->toBe(2)
            ->and(DB::table('admin_invitations')->whereNotNull('role_id')->count())->toBe(0);
    });

    it('refuses while an invitation that can still be accepted hands it out, and says what to do', function (): void {
        $role = verwaltungCustomRole('Lager');
        verwaltungInvitation($role, []);

        $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
            ->delete("/admin/rollen/{$role}")
            ->assertSessionHasErrors(['role' => RollenController::OPEN_INVITATION_REFUSAL]);

        expect(DB::table('roles')->where('id', $role)->exists())->toBeTrue();
    });
});

it('refuses rights saved from a matrix opened before the last change, and keeps that change (the admin audit\'s F-25)', function (): void {
    $role = verwaltungRoleId('accountant');
    $stale = $this->actingAs(verwaltungAdmin(), 'admin')->get("/admin/rollen?rolle={$role}")->viewData('page')['props']['stamp'];

    // Another tab sets the role's rights; this tab still shows the old ones and adds to them.
    $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')
        ->put("/admin/rollen/{$role}/rechte", ['rights' => ['orders.view', 'reports.view']])->assertSessionHasNoErrors();
    $this->actingAs(verwaltungAdmin(), 'admin')->from('/admin/rollen')->withHeader(EditStamp::HEADER, $stale)
        ->put("/admin/rollen/{$role}/rechte", ['rights' => ['orders.view', 'orders.export', 'reports.view', 'reports.export']])
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(verwaltungRights($role))->toEqualCanonicalizing(['orders.view', 'reports.view']);
});
it('offers only rights the shop checks, and lets go of the stored ones that never did anything (the admin audit\'s F-21)', function (): void {
    $unreal = ['catalogue.export', 'vehicles.delete', 'vehicles.export', 'approvals.delete', 'approvals.export', 'customers.edit', 'customers.delete', 'customers.export', 'media.view', 'media.edit'];

    expect(array_intersect($unreal, PermissionModule::cells()))->toBe([]);

    $modules = array_column($this->actingAs(verwaltungAdmin(), 'admin')->get('/admin/rollen')->assertOk()->viewData('page')['props']['modules'], 'module');
    expect($modules)->not->toContain('media')->toContain('catalogue');

    // A cell an older matrix wrote is gone after the migration; a real one stays.
    $role = verwaltungRoleId('accountant');
    DB::table('role_permissions')->insert(['role_id' => $role, 'module' => 'customers', 'action' => 'delete', 'allowed' => true, 'created_at' => now(), 'updated_at' => now()]);
    (require database_path('migrations/2026_10_24_000100_drop_unreal_role_cells.php'))->up();

    expect(DB::table('role_permissions')->where('role_id', $role)->where('module', 'customers')->where('action', 'delete')->exists())->toBeFalse()
        ->and(DB::table('role_permissions')->where('role_id', $role)->where('module', 'customers')->where('action', 'view')->exists())->toBeTrue();
});
