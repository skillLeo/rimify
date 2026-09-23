<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\RolePermission;
use App\Services\Admin\PermissionMatrix;
use Database\Seeders\AccessSeeder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;

/**
 * R-11: permissions are enforced server-side, and the UI only hides. What a role may do is a cell
 * of the module × action matrix (`role_permissions`), never a role name in an if-statement, and
 * every denial is written to the audit trail (docs/BUILD.md V3).
 *
 * No Policy exists yet (komplettrad.md §6.1, commit 7), so this file is written against ONE
 * Gate-only ability it defines itself. The wiring it proves — matrix → AdminUser::may() → Gate →
 * the base Controller's authorize() → 403 → audit row — is exactly what every Policy will ride on.
 */
const PROBE_ABILITY = 'catalogue.edit';

const PROBE_PATH = '/admin/__rechte-probe';

const PROBE_ROUTE = 'admin.rechte.probe';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);

    // The Gate-only ability: exists in this test alone, reads the matrix like a Policy would.
    Gate::define(PROBE_ABILITY, static fn (AdminUser $user): bool => $user->may(
        PermissionModule::Catalogue,
        PermissionAction::Edit,
    ));

    // A probe behind the admin guard that authorises through the base Controller's trait, the
    // way every admin mutation will. Registered here so no production route is touched.
    Route::middleware(['web', 'auth:admin'])
        ->get(PROBE_PATH, static function (): string {
            $controller = new class extends Controller
            {
                public function __invoke(): string
                {
                    $this->authorize(PROBE_ABILITY);

                    return 'ok';
                }
            };

            return $controller();
        })
        ->name(PROBE_ROUTE);
});

/** The seeded account for a role, as AccessSeeder names it. */
function rechteAdmin(string $role): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return Builder<AuditLog> */
function deniedEntries(): Builder
{
    return AuditLog::query()->where('log_name', 'admin')->where('description', 'permission.denied');
}

it('gives every controller $this->authorize()', function (): void {
    expect(class_uses_recursive(Controller::class))->toContain(AuthorizesRequests::class);
});

it('reads the seeded matrix for the catalogue module', function (string $role, bool $mayEdit, bool $mayView): void {
    $admin = rechteAdmin($role);

    expect($admin->may(PermissionModule::Catalogue, PermissionAction::Edit))->toBe($mayEdit)
        ->and($admin->may(PermissionModule::Catalogue, PermissionAction::View))->toBe($mayView);
})->with([
    'super-admin' => ['super-admin', true, true],
    'catalogue-manager' => ['catalogue-manager', true, true],
    'compliance-editor' => ['compliance-editor', false, true],
    'order-manager' => ['order-manager', false, true],
    'support-agent' => ['support-agent', false, true],
    'content-editor' => ['content-editor', false, false],
    'accountant' => ['accountant', false, false],
]);

it('allows nothing to an account that holds no role', function (): void {
    $nobody = AdminUser::factory()->create();

    foreach (PermissionModule::cases() as $module) {
        foreach (PermissionAction::cases() as $action) {
            expect($nobody->may($module, $action))->toBeFalse();
        }
    }
});

it('counts a right held through any one of several roles', function (): void {
    $editor = rechteAdmin('content-editor');
    expect($editor->may(PermissionModule::Catalogue, PermissionAction::Edit))->toBeFalse();

    $editor->syncRoles(['content-editor', 'catalogue-manager']);

    expect((new PermissionMatrix)->allows($editor, PermissionModule::Catalogue, PermissionAction::Edit))->toBeTrue()
        ->and((new PermissionMatrix)->allows($editor, PermissionModule::Content, PermissionAction::Publish))->toBeTrue();
});

it('answers from the matrix, not from the role name: a revoked cell is revoked', function (): void {
    $manager = rechteAdmin('catalogue-manager');
    $role = Role::query()->where('name', 'catalogue-manager')->where('guard_name', 'admin')->firstOrFail();

    RolePermission::query()
        ->where('role_id', $role->getKey())
        ->where('module', PermissionModule::Catalogue->value)
        ->where('action', PermissionAction::Edit->value)
        ->update(['allowed' => false]);

    $matrix = new PermissionMatrix;

    expect($matrix->allows($manager, PermissionModule::Catalogue, PermissionAction::Edit))->toBeFalse()
        ->and($matrix->allows($manager, PermissionModule::Catalogue, PermissionAction::View))->toBeTrue();
});

it('reads the matrix once per instance and never across instances', function (): void {
    $manager = rechteAdmin('catalogue-manager');
    $matrix = new PermissionMatrix;

    DB::enableQueryLog();
    $matrix->allows($manager, PermissionModule::Catalogue, PermissionAction::Edit);
    $matrix->allows($manager, PermissionModule::Media, PermissionAction::Create);
    $matrix->allows($manager, PermissionModule::Orders, PermissionAction::View);
    $queries = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($queries)->toBe(1);

    $role = Role::query()->where('name', 'catalogue-manager')->where('guard_name', 'admin')->firstOrFail();
    RolePermission::query()->where('role_id', $role->getKey())->update(['allowed' => false]);

    // The instance that already read is memoised; a fresh one — the next request — sees the revoke.
    expect($matrix->allows($manager, PermissionModule::Catalogue, PermissionAction::Edit))->toBeTrue()
        ->and((new PermissionMatrix)->allows($manager, PermissionModule::Catalogue, PermissionAction::Edit))->toBeFalse();
});

it('shares one matrix instance within a request and resolves it through may()', function (): void {
    expect(app(PermissionMatrix::class))->toBe(app(PermissionMatrix::class));

    $manager = rechteAdmin('catalogue-manager');

    DB::enableQueryLog();
    $manager->may(PermissionModule::Catalogue, PermissionAction::Edit);
    $manager->may(PermissionModule::Catalogue, PermissionAction::Delete);
    $queries = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($queries)->toBe(1);
});

it('logs a denial as evidence and leaves an allowed check unlogged', function (): void {
    $editor = rechteAdmin('content-editor');

    expect(Gate::forUser($editor)->allows(PROBE_ABILITY))->toBeFalse();

    $entry = deniedEntries()->sole();

    expect($entry->causer_type)->toBe(AdminUser::class)
        ->and((int) $entry->causer_id)->toBe((int) $editor->getKey())
        ->and($entry->actor_email)->toBe('content-editor@rimify.test')
        ->and($entry->properties->get('ability'))->toBe(PROBE_ABILITY)
        // Outside a routed request there is no route to name; the column says so rather than lying.
        ->and($entry->properties->get('route'))->toBeNull();

    expect(Gate::forUser(rechteAdmin('catalogue-manager'))->allows(PROBE_ABILITY))->toBeTrue()
        ->and(deniedEntries()->count())->toBe(1);
});

it('does not change the decision and does not log a guest', function (): void {
    expect(Gate::forUser(null)->allows(PROBE_ABILITY))->toBeFalse()
        ->and(deniedEntries()->exists())->toBeFalse();
});

it('refuses a denied role at the URL with a 403 and logs the attempt with its route', function (): void {
    $this->actingAs(rechteAdmin('content-editor'), 'admin')
        ->get(PROBE_PATH)
        ->assertForbidden()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Fehler/Index')
            ->where('status', 403)
        );

    $entry = deniedEntries()->sole();

    expect($entry->properties->get('ability'))->toBe(PROBE_ABILITY)
        ->and($entry->properties->get('route'))->toBe(PROBE_ROUTE)
        ->and($entry->actor_email)->toBe('content-editor@rimify.test')
        ->and($entry->ip_address)->not->toBeNull();
});

it('lets an allowed role through the same URL and writes nothing', function (): void {
    $this->actingAs(rechteAdmin('catalogue-manager'), 'admin')
        ->get(PROBE_PATH)
        ->assertOk()
        ->assertSee('ok');

    expect(deniedEntries()->exists())->toBeFalse();
});

it('enforces read-only roles on a write: view is not edit', function (): void {
    $agent = rechteAdmin('support-agent');
    expect($agent->may(PermissionModule::Catalogue, PermissionAction::View))->toBeTrue();

    $this->actingAs($agent, 'admin')
        ->get(PROBE_PATH)
        ->assertForbidden();

    expect(deniedEntries()->count())->toBe(1);
});

it('sends a guest to the sign-in screen before any permission is asked', function (): void {
    $this->get(PROBE_PATH)->assertRedirect('/admin/anmelden');

    expect(deniedEntries()->exists())->toBeFalse();
});
