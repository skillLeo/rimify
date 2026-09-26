<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\AuditLog;
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
