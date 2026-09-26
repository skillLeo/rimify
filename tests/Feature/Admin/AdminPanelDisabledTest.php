<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;

/**
 * The panel, closed.
 *
 * A preview server is shown to people who are not developers, and an unfinished panel invites the
 * wrong conversation. Closing it has to mean closed: not a sign-in screen that refuses, which still
 * says there is something behind it, but the same 404 an unknown URL gets — and closed to someone
 * already holding a session, not only to someone typing a password.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['rimify.admin.enabled' => false]);
});

function disabledAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

it('answers every admin path with a 404, sign-in screen included', function (string $path): void {
    $this->get($path)->assertNotFound();
})->with([
    '/admin',
    '/admin/anmelden',
    '/admin/gutachten',
    '/admin/rollen',
    '/admin/wuchtgewichte',
    '/admin/rdks-preise',
    '/admin/benachrichtigungen',
]);

it('closes it to an account that is already signed in, not only to the password', function (): void {
    $this->actingAs(disabledAdmin(), 'admin')->get('/admin')->assertNotFound();
    $this->actingAs(disabledAdmin(), 'admin')->get('/admin/rollen')->assertNotFound();
});

it('refuses the writes too, so nothing can be changed through a form still open in a tab', function (): void {
    $this->actingAs(disabledAdmin(), 'admin')
        ->patch('/admin/rollen/1/rechte', ['module' => 'catalogue', 'action' => 'edit', 'allowed' => true])
        ->assertNotFound();
});

it('will not sign anybody in, however right their password is', function (): void {
    $this->post('/admin/anmelden', ['email' => 'super-admin@rimify.test', 'password' => 'rimify-dev-2026'])
        ->assertNotFound();

    expect(auth('admin')->check())->toBeFalse();
});

it('leaves the shop itself untouched — this closes the panel, not the business', function (): void {
    // The storefront needs a catalogue to render, so this one case pays for seeding it.
    $this->seed(CommerceSeeder::class);
    $this->seed(ContentSeeder::class);

    $this->get('/')->assertOk();
    $this->get('/felgen')->assertOk();
});

it('opens again the moment it is switched back on, with no route cache to rebuild', function (): void {
    config(['rimify.admin.enabled' => true]);

    $this->get('/admin/anmelden')->assertOk();
    $this->actingAs(disabledAdmin(), 'admin')->get('/admin')->assertOk();
});
