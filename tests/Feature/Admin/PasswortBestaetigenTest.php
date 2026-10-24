<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * „Passwort bestätigen“ says why it asks, for where the person is going (the admin audit's F-12): it told everyone
 * „Dieser Bereich verwaltet die Zugänge des Shops“ — a refund and the company data included.
 */

beforeEach(fn () => $this->seed(AccessSeeder::class));

it('names what the password guards, for each place that asks for it', function (?string $weiter, string $reason): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')->get('/admin/bestaetigen'.($weiter === null ? '' : '?weiter='.rawurlencode($weiter)))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Bestaetigen/Index')->where('reason', $reason));
})->with([
    'a refund, sent from the order' => ['/admin/bestellungen/12', 'Eine Erstattung lässt sich nicht zurücknehmen.'],
    'the Stripe keys' => ['/admin/einstellungen/zahlung', 'Hier stehen die Zugangsschlüssel des Shops.'],
    'the mail key' => ['/admin/einstellungen/e-mail', 'Hier stehen die Zugangsschlüssel des Shops.'],
    'the bucket key' => ['/admin/einstellungen/speicher', 'Hier stehen die Zugangsschlüssel des Shops.'],
    'the company data' => ['/admin/einstellungen/verkaeufer-versand', 'Hier stehen die Angaben zum Unternehmen für Impressum, Rechnungen und Versand.'],
    'the reset' => ['/admin/system/zuruecksetzen', 'Hier wird die Testumgebung zurückgesetzt.'],
    'the order list' => ['/admin/bestellungen', 'Dieser Bereich ist besonders geschützt.'],
    'no way back' => [null, 'Dieser Bereich ist besonders geschützt.'],
]);
