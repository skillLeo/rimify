<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Support\EditStamp;
use App\Support\Seller;
use Database\Seeders\AccessSeeder;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/*
 * The admin audit's F-25 (ADMIN-AUDIT.md): the same record in two tabs — or with two people — must never have the
 * later save silently undo the earlier one. Each form that rewrites several fields at once gets the stamp of the
 * state it was opened on and sends it back with its save (EditStamp); a save against an older state is refused in a
 * sentence and writes nothing. Before, tab B put back what tab A had just changed.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function stampAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** A visit as the Super-Admin, behind the password confirmed a moment ago. */
function stampVisit(): TestCase
{
    return test()->actingAs(stampAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()]);
}

/** The stamp the page was opened with. */
function stampOf(TestResponse $response): string
{
    $stamp = $response->viewData('page')['props']['stamp'] ?? null;
    expect($stamp)->toBeString()->not->toBe('');

    return (string) $stamp;
}

/** @return array{seller: array<string, mixed>, shipping: array<string, mixed>} */
function stampSeller(array $seller = []): array
{
    return [
        'seller' => [
            'name' => 'Prüfwerk Räder GmbH', 'legal_form' => 'GmbH', 'street' => 'Mühlenstraße 12a', 'zip' => '01067', 'city' => 'Dresden',
            'managing_director' => 'Jürgen Größmann', 'register_court' => 'Amtsgericht Dresden', 'register_number' => 'HRB 12345',
            'vat_id' => 'DE123456789', 'tax_number' => '', 'email' => 'info@pruefwerk.test', 'phone' => '', 'placeholder' => false,
            'not_applicable' => ['managing_director' => false, 'register' => false, 'vat_id' => false, 'phone' => true],
            ...$seller,
        ],
        'shipping' => ['cost' => '4,90', 'free_from' => '500,00', 'min_days' => '3', 'max_days' => '5', 'placeholder' => false],
    ];
}

it('refuses Verkäufer & Versand saved in a second tab after the first one, and keeps the first one\'s change', function (): void {
    $url = '/admin/einstellungen/verkaeufer-versand';
    stampVisit()->from($url)->put($url, stampSeller())->assertSessionHasNoErrors();

    // Both tabs open on the same state.
    $tabA = stampOf(stampVisit()->get($url));
    $tabB = stampOf(stampVisit()->get($url));
    expect($tabA)->toBe($tabB);

    stampVisit()->from($url)->withHeader(EditStamp::HEADER, $tabA)->put($url, stampSeller(['city' => 'Dresden-Neustadt']))->assertSessionHasNoErrors();

    // Tab B still holds the old city beside its own change: refused, nothing written.
    stampVisit()->from($url)->withHeader(EditStamp::HEADER, $tabB)->put($url, stampSeller(['street' => 'Mühlenstraße 14']))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(Seller::stored()->city)->toBe('Dresden-Neustadt')->and(Seller::stored()->street)->toBe('Mühlenstraße 12a');

    // Opened again, the page carries the new state, and its save goes through.
    $fresh = stampOf(stampVisit()->get($url));
    expect($fresh)->not->toBe($tabB);
    stampVisit()->from($url)->withHeader(EditStamp::HEADER, $fresh)->put($url, stampSeller(['city' => 'Dresden-Neustadt', 'street' => 'Mühlenstraße 14']))
        ->assertSessionHasNoErrors();
    expect(Seller::stored()->street)->toBe('Mühlenstraße 14');
});
