<?php

declare(strict_types=1);

use App\Domain\Storefront\PapersBook;
use App\Domain\Storefront\VehicleContext;
use App\Models\CatalogueGapEvent;
use App\Models\Vehicle;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;

/*
 * D-286 on the storefront, the operator's answer of 18.10.2026: a car without the figures of its papers. Every wheel its
 * Gutachten approves is said as approved — never „keine Freigabe“ on a size — with its tyres „noch nicht bestätigt“; the
 * listing asks once for the papers, the product page in its panel; nothing is sold until they are in, and the basket's
 * gate names the papers as the way on; with them the same size sells.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/** The demo catalogue's BMW 330i G20, its figures taken away, as a car typed from a Gutachten has none. */
function owingCar(): Vehicle
{
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $vehicle->forceFill(['axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'needs_review' => true])->save();

    return $vehicle;
}

/** @return array<string, string> */
function owingCookie(Vehicle $vehicle): array
{
    return [VehicleContext::COOKIE => (new VehicleContext($vehicle->id, true))->encode()];
}

/** @return array<string, mixed> the first card of the listing whose wheel is approved and whose tyres are open */
function owingCard(Vehicle $vehicle): array
{
    $cards = test()->withCookies(owingCookie($vehicle))->get('/felgen')->viewData('page')['props']['cards'];
    $card = collect($cards)->first(static fn (array $c): bool => ($c['fitment']['tyresOpen'] ?? false) === true);

    expect($card)->not->toBeNull('no card of the demo catalogue is approved for the G20 with its tyres open');

    return $card;
}

it('lists the wheels the documents approve as approved, the tyres open, and asks once for the papers', function (): void {
    $vehicle = owingCar();
    $props = $this->withCookies(owingCookie($vehicle))->get('/felgen')->assertOk()->viewData('page')['props'];
    $card = owingCard($vehicle);

    expect($props['owed'])->toBe(['8.1', '8.2', 'T'])
        ->and($card['fitment']['status'])->toBe('UNKNOWN')
        // Approved in the sizes it is listed with: none of them greyed as „keine Freigabe“ — spelled as the card's own
        // sizes are, strings; as the integers PHP makes of „18“, the tile matched none and greyed every whole inch.
        ->and($card['diametersFitting'])->not->toBe([])
        ->and($card['diametersFitting'])->each->toBeString()
        ->and(array_values(array_intersect($card['diameters'], $card['diametersFitting'])))->toBe($card['diametersFitting']);
});

it('answers the product page in finding 103’s shape, sells nothing until the papers are in, and sells with them', function (): void {
    $vehicle = owingCar();
    $cookies = owingCookie($vehicle);
    $slug = owingCard($vehicle)['slug'];
    $configs = $this->withCookies($cookies)->get('/felgen/'.$slug)->assertOk()->viewData('page')['props']['configs'];
    $config = collect($configs)->first(static fn (array $c): bool => ($c['verdict']['tyre']['owed'] ?? []) !== []);
    $verdict = $config['verdict'];

    expect($verdict['status'])->toBe('UNKNOWN')
        ->and($verdict['sellable'])->toBeFalse()
        ->and($verdict['wheelStatus'])->toBeIn(['PERMITTED', 'CONDITIONAL'])
        ->and($verdict['tyre']['owed'])->toBe(['8.1', '8.2', 'T'])
        ->and(end($verdict['tyre']['lines']))->toBe('Trag die Werte aus deiner Zulassungsbescheinigung Teil I ein, dann zeigen wir dir, welche Reifen du fahren darfst.')
        // The wheel's own verdict in full, its Auflagen with their detail.
        ->and($verdict['detail'])->not->toBeNull();

    // Not a document to buy: its Gutachten is held. Only a size we hold nothing for counts on the Übersicht's list.
    $open = static fn (array $v): bool => $v['status'] === 'UNKNOWN' && in_array($v['wheelStatus'], ['PERMITTED', 'CONDITIONAL'], true)
        && ($v['tyre']['status'] ?? null) === 'UNKNOWN' && $v['missing'] === [];
    $nothingHeld = collect($configs)->contains(static fn (array $c): bool => $c['verdict']['status'] === 'UNKNOWN' && ! $open($c['verdict']));

    expect(CatalogueGapEvent::query()->where('surface', 'pdp')->where('vehicle_id', $vehicle->id)->count())->toBe($nothingHeld ? 1 : 0);

    // Nothing is sold on an unconfirmed tyre, and the gate names the papers as the way on — never „schreib uns“.
    $this->withCookies($cookies)->from('/felgen/'.$slug)
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config['id'], 'quantity' => 4])
        ->assertSessionHasErrors(['wheelConfigId' => Basket::TYRES_AWAIT_PAPERS]);

    expect(session(Basket::SESSION_KEY))->toBeNull();

    // The papers entered — at a speed no table is needed for —: the same size is answered and sells.
    $papers = "{$vehicle->id}.1100.1100.200";
    $answered = collect($this->withCookies($cookies)->withUnencryptedCookie(PapersBook::COOKIE, $papers)->get('/felgen/'.$slug)->viewData('page')['props']['configs'])
        ->firstWhere('id', $config['id'])['verdict'];

    expect($answered['sellable'])->toBeTrue()
        ->and($answered['tyre']['owed'] ?? [])->toBe([]);

    // The listing with them: the card sells, its sizes spelled as the card's own, and nothing is asked any more.
    $listing = $this->withCookies($cookies)->withUnencryptedCookie(PapersBook::COOKIE, $papers)->get('/felgen')->viewData('page')['props'];
    $sold = collect($listing['cards'])->firstWhere('slug', $slug);

    expect($listing['owed'])->toBe([])
        ->and($sold['fitment']['status'])->toBeIn(['PERMITTED', 'CONDITIONAL'])
        ->and($sold['diametersFitting'])->not->toBe([])
        ->and($sold['diametersFitting'])->each->toBeString();

    $this->withCookies($cookies)->withUnencryptedCookie(PapersBook::COOKIE, $papers)->from('/felgen/'.$slug)
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config['id'], 'quantity' => 4])
        ->assertSessionHasNoErrors();
});
