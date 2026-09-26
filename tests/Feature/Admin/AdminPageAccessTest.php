<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Services\Admin\AdminErrorPage;
use App\Services\Admin\AuditDescriber;
use Database\Seeders\AccessSeeder;

/**
 * Every admin page refuses a role that may not view its area — however the URL was reached.
 *
 * The rail never offers such a page, which is exactly why this has to be tested on its own: a
 * pasted link, a bookmark or a role changed mid-session never goes through the rail. A list of
 * customer e-mail addresses once answered 200 to any signed-in role because its controller
 * checked nothing; the route now carries the permission itself (EnsureAdminMay).
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

/** @return array<string, array{string, PermissionModule}> */
function adminPageAccessRoutes(): array
{
    return [
        'gutachten' => ['/admin/gutachten', PermissionModule::Approvals],
        'benachrichtigungen' => ['/admin/benachrichtigungen', PermissionModule::Approvals],
        'rollen' => ['/admin/rollen', PermissionModule::Roles],
        'benutzer' => ['/admin/benutzer', PermissionModule::Roles],
        'protokoll' => ['/admin/protokoll', PermissionModule::AuditLog],
        'wuchtgewichte' => ['/admin/wuchtgewichte', PermissionModule::Catalogue],
        'rdks-preise' => ['/admin/rdks-preise', PermissionModule::Catalogue],
    ];
}

it('opens each page for a role that may view its area and refuses every other role', function (string $role): void {
    $admin = AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();

    foreach (adminPageAccessRoutes() as [$path, $module]) {
        $expected = $admin->may($module, PermissionAction::View) ? 200 : 403;

        $this->actingAs($admin, 'admin')->get($path)->assertStatus($expected);
    }
})->with(['super-admin', 'catalogue-manager', 'compliance-editor', 'order-manager', 'content-editor', 'support-agent', 'accountant']);

it('keeps the customer addresses from a role outside the Gutachten area', function (): void {
    $editor = AdminUser::query()->where('email', 'content-editor@rimify.test')->firstOrFail();

    expect($editor->may(PermissionModule::Approvals, PermissionAction::View))->toBeFalse();

    $this->actingAs($editor, 'admin')->get('/admin/benachrichtigungen')->assertForbidden();
});

it('records a refused page as evidence', function (): void {
    $editor = AdminUser::query()->where('email', 'content-editor@rimify.test')->firstOrFail();

    $this->actingAs($editor, 'admin')->get('/admin/gutachten')->assertForbidden();

    $entry = AuditLog::query()->where('description', 'permission.denied')->latest('id')->first();

    expect($entry)->not->toBeNull()
        ->and($entry?->actor_email)->toBe($editor->email)
        ->and($entry?->properties['ability'] ?? null)->toBe('approvals.view')
        ->and($entry?->properties['route'] ?? null)->toBe('admin.gutachten.index');
});

it('sends somebody who is not signed in to the sign-in screen, not to a refusal', function (): void {
    foreach (adminPageAccessRoutes() as [$path]) {
        $this->get($path)->assertRedirect('/admin/anmelden');
    }
});

describe('answering a failure inside the admin', function (): void {
    it('refuses inside the admin frame and names the area the page belongs to', function (): void {
        $editor = AdminUser::query()->where('email', 'content-editor@rimify.test')->firstOrFail();

        $this->actingAs($editor, 'admin')->get('/admin/gutachten')
            ->assertForbidden()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Fehler/Index')
                ->where('status', 403)
                ->where('area', 'Gutachten')
                ->has('admin.nav'));
    });

    it('answers an address that does not exist inside the admin frame, for somebody signed in', function (): void {
        $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

        $this->actingAs($admin, 'admin')->get('/admin/gibt-es-nicht')
            ->assertNotFound()
            ->assertInertia(fn ($page) => $page->component('Admin/Fehler/Index')->where('status', 404)->has('admin.nav'));
    });

    it('sends a save that was throttled back to its form, input kept, with one German sentence', function (): void {
        $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($admin, 'admin')->from('/admin/profil')->put('/admin/profil/passwort', ['current_password' => 'falsch']);
        }

        $this->actingAs($admin, 'admin')->from('/admin/profil')
            ->put('/admin/profil/passwort', ['current_password' => 'falsch', 'password' => 'geheim-und-lang-genug'])
            ->assertRedirect('/admin/profil')
            ->assertSessionHas('toast', AdminErrorPage::TOO_MANY);

        // A password is never kept for the form to show again.
        expect(session()->getOldInput('password'))->toBeNull();
    });

    it('sends somebody already signed in from the sign-in page into the admin, not to the shop', function (): void {
        $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

        $this->actingAs($admin, 'admin')->get('/admin/anmelden')->assertRedirect('/admin');
    });
});

it('writes a refused page into the Protokoll as a sentence a person can read', function (): void {
    $editor = AdminUser::query()->where('email', 'content-editor@rimify.test')->firstOrFail();

    $this->actingAs($editor, 'admin')->get('/admin/gutachten')->assertForbidden();

    $entry = AuditLog::query()->where('description', 'permission.denied')->latest('id')->firstOrFail();

    expect(app(AuditDescriber::class)->describe($entry)['sentence'])
        ->toBe('Der Versuch, die Seite „Gutachten“ zu öffnen, wurde abgelehnt, weil die Berechtigung dafür fehlte.');
});
