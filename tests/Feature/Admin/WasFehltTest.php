<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * System › Was fehlt (the operator's brief of 05.10.2026, §7): rimify:go-live-check in the admin — read only, the
 * settings right (GoLivePolicy), the client's items by default, each with the admin path where it is closed.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function wasFehltAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

it('shows every check with the client’s items chosen, and the count line', function (): void {
    $this->actingAs(wasFehltAdmin(), 'admin')
        ->get('/admin/system/was-fehlt')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/System/WasFehlt')
            ->where('owner', 'kunde')
            ->where('groups', ['Recht und Pflichtangaben', 'Recht am Rad', 'Zahlung', 'Betrieb und Sicherheit'])
            ->where('summary', fn (string $line): bool => preg_match('/^\d+ von \d+ erfüllt · \d+ bei uns · \d+ beim Kunden/', $line) === 1)
            ->where('checks', fn ($checks): bool => collect($checks)->contains(fn (array $c): bool => $c['id'] === 'impressum' && $c['owner'] === 'kunde' && $c['place'] === '/admin/einstellungen/verkaeufer-versand'))
            // A page request never asks its own server over HTTP: the command does.
            ->where('checks', fn ($checks): bool => collect($checks)->firstWhere('id', 'sicherungen')['state'] === 'nicht prüfbar'));
});

it('shows another side’s items when asked, and refuses a side that does not exist', function (): void {
    $admin = wasFehltAdmin();

    $this->actingAs($admin, 'admin')->get('/admin/system/was-fehlt?wer=wir')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('owner', 'wir'));
    $this->actingAs($admin, 'admin')->get('/admin/system/was-fehlt?wer=alle')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('owner', 'alle'));
    $this->actingAs($admin, 'admin')->get('/admin/system/was-fehlt?wer=jemand')->assertSessionHasErrors('wer');
});

it('is the settings right’s: anyone without it is refused on the server', function (): void {
    $this->actingAs(wasFehltAdmin('content-editor'), 'admin')->get('/admin/system/was-fehlt')->assertForbidden();
});

it('sends a visitor who is not signed in to the sign-in', function (): void {
    $this->get('/admin/system/was-fehlt')->assertRedirect();
});
