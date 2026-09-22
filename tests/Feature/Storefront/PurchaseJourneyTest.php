<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Models\CatalogueGapEvent;
use App\Models\Vehicle;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * The whole journey, driven the way a customer drives it: choose a car, filter, configure, add to
 * the basket, reach checkout — without a single row written by hand.
 *
 * The journey is the gate because the parts passing individually has never been the problem. What
 * has failed before is the seams: a header that shows the wrong state, a filter that loses the
 * vehicle, a basket line whose verdict was computed once and never again.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/**
 * The cookie the storefront carries between requests.
 *
 * Passed through `withCookies()`, not `withUnencryptedCookies()`: `rmf_vehicle` is encrypted and
 * authenticated by the middleware, so a raw value would fail to decrypt and arrive as no vehicle
 * at all — which looks exactly like a header bug and is not one.
 */
function rimifyVehicleCookie(int $vehicleId, bool $booking = true): array
{
    return [VehicleContext::COOKIE => (new VehicleContext($vehicleId, $booking))->encode()];
}

it('walks from an empty session to a checkout with the vehicle intact', function (): void {
    // The BMW 330i G20 (5 × 112), a car the demo documents cover well.
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();

    // ── The visitor arrives with nothing ────────────────────────────────────────────────
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $p) => $p->where('headerMode', 'PLAIN')->where('vehicle', null));

    // ── They pick a variant, which writes the vehicle and opens the listing ─────────────
    $this->post('/fahrzeug', ['fahrzeug' => $vehicle->id])
        ->assertRedirect('/felgen')
        ->assertCookie(VehicleContext::COOKIE);

    // ── The listing now answers about THAT car, and the header shows the white box ──────
    $listing = $this->withCookies(rimifyVehicleCookie($vehicle->id))->get('/felgen');

    $listing->assertOk()->assertInertia(
        fn (AssertableInertia $p) => $p
            ->where('hasVehicle', true)
            // Inside the buying process: the white box, never the blue bar (R-08).
            ->where('headerMode', 'WHITE_BOX')
            ->where('vehicle.id', $vehicle->id)
            ->has('cards')
            ->has('facets.zoll')
    );

    $card = $listing->viewData('page')['props']['cards'][0];
    $model = WheelModel::query()->where('slug', $card['slug'])->firstOrFail();

    // ── A filter narrows the set and stays in the URL ───────────────────────────────────
    $this->withCookies(rimifyVehicleCookie($vehicle->id))
        ->get('/felgen?zoll=18')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $p) => $p->where('filters.zoll', ['18']));

    // ── The product page carries a verdict per configuration ────────────────────────────
    $product = $this->withCookies(rimifyVehicleCookie($vehicle->id))
        ->get('/felgen/'.$model->slug);

    $product->assertOk()->assertInertia(
        fn (AssertableInertia $p) => $p
            ->where('hasVehicle', true)
            ->has('configs.0.verdict.status')
            ->has('configs.0.verdict.label')
            ->has('configs.0.verdict.sellable')
    );

    $configs = $product->viewData('page')['props']['configs'];
    $sellable = collect($configs)->first(fn (array $c): bool => $c['verdict']['sellable'] === true);

    expect($sellable)->not->toBeNull('the seeded catalogue must offer at least one sellable size');

    // ── Into the basket, and back to the page the customer was on ───────────────────────
    $this->withCookies(rimifyVehicleCookie($vehicle->id))
        ->from('/felgen/'.$model->slug)
        ->post('/warenkorb', [
            'kind' => 'WHEEL',
            'wheelConfigId' => $sellable['id'],
            'quantity' => 4,
        ])
        ->assertRedirect('/felgen/'.$model->slug)
        ->assertSessionHas('toast');

    // ── The basket re-verifies every line on render ─────────────────────────────────────
    $this->withCookies(rimifyVehicleCookie($vehicle->id))
        ->get('/warenkorb')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $p) => $p
                ->has('lines', 1)
                ->where('lines.0.quantity', 4)
                ->has('lines.0.verdict.status')
                ->where('totals.count', 4)
        );

    // ── Checkout shows the same basket and suppresses the vehicle chrome ────────────────
    $this->withCookies(rimifyVehicleCookie($vehicle->id))
        ->get('/kasse')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $p) => $p
                ->has('lines', 1)
                // Edge case E5: no vehicle presentation at the point of paying.
                ->where('headerMode', 'SUPPRESSED')
        );
});

it('never shows the white box and the blue bar together', function (): void {
    $vehicle = Vehicle::query()->whereNotNull('max_speed_kmh')->firstOrFail();
    $cookies = rimifyVehicleCookie($vehicle->id);

    $booking = ['/felgen', '/warenkorb'];
    $outside = ['/faq', '/kontakt', '/rimify-check'];

    foreach ($booking as $path) {
        $this->withCookies($cookies)->get($path)->assertInertia(
            fn (AssertableInertia $p) => $p->where('headerMode', 'WHITE_BOX')
        );
    }

    foreach ($outside as $path) {
        $this->withCookies($cookies)->get($path)->assertInertia(
            fn (AssertableInertia $p) => $p->where('headerMode', 'BLUE_BAR')
        );
    }
});

it('offers the two-variant chooser for 1860 AAS rather than picking one', function (): void {
    $response = $this->from('/felgen-suchen')
        ->post('/fahrzeug/schluesselnummern', ['hsn' => '1860', 'tsn' => 'AAS']);

    // Never a redirect to the listing: choosing for the customer here computes the legal
    // requirement from the wrong car (R-01).
    $response->assertRedirect('/felgen-suchen');

    $lookup = session('lookup');

    expect($lookup['status'])->toBe('ambiguous')
        ->and($lookup['distinction']['required'])->toBeTrue()
        ->and($lookup['distinction']['rows'])->toHaveCount(2)
        // What separates them must be named, and it is exactly what the verdict turns on.
        ->and($lookup['distinction']['attributes'])->not->toBeEmpty();

    // And it must actually REACH the page. A live run caught this: the outcome sat in the session
    // and was never shared, so the chooser rendered nowhere while every server-side assertion
    // passed. Asserting on the Inertia prop is what makes that impossible to reintroduce.
    $response->assertRedirect('/felgen-suchen');

    $this->followingRedirects()
        ->post('/fahrzeug/schluesselnummern', ['hsn' => '1860', 'tsn' => 'AAS'])
        ->assertInertia(
            fn (AssertableInertia $p) => $p
                ->where('lookup.status', 'ambiguous')
                ->has('lookup.distinction.rows', 2)
        );
});

it('resolves an unambiguous key number straight to the listing', function (): void {
    $this->post('/fahrzeug/schluesselnummern', ['hsn' => '0005', 'tsn' => '582'])
        ->assertRedirect('/felgen')
        ->assertCookie(VehicleContext::COOKIE);
});

it('keeps what was typed and offers three ways forward when nothing matches', function (): void {
    $this->from('/felgen-suchen')
        ->post('/fahrzeug/schluesselnummern', ['hsn' => '9999', 'tsn' => 'ZZZ'])
        ->assertRedirect('/felgen-suchen')
        ->assertSessionHasInput('hsn', '9999')
        ->assertSessionHasInput('tsn', 'ZZZ');

    expect(session('lookup')['status'])->toBe('not_found');

    // The miss is also the most valuable signal this business has about what to buy next.
    expect(
        CatalogueGapEvent::query()
            ->where('hsn', '9999')
            ->where('reason_code', 'VEHICLE_NOT_FOUND')
            ->exists()
    )->toBeTrue();
});

it('keeps the leading zeros of an HSN through the lookup', function (): void {
    // `0005` is not the number five. An integer cast anywhere on this path destroys it.
    $this->post('/fahrzeug/schluesselnummern', ['hsn' => '0005', 'tsn' => '674'])
        ->assertRedirect('/felgen');

    $this->from('/felgen-suchen')
        ->post('/fahrzeug/schluesselnummern', ['hsn' => '5', 'tsn' => '674'])
        ->assertSessionHasErrors('hsn');
});

it('upper-cases a lower-case TSN rather than refusing it', function (): void {
    $this->post('/fahrzeug/schluesselnummern', ['hsn' => '1860', 'tsn' => 'aas'])
        ->assertSessionHasNoErrors();

    expect(session('lookup')['tsn'])->toBe('AAS');
});

it('merges a repeated add into one line instead of two', function (): void {
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $cookies = rimifyVehicleCookie($vehicle->id);

    // A configuration the engine permits on this car: the basket refuses any other on the server,
    // whatever the page showed, so the first row of the catalogue is not necessarily addable.
    $card = $this->withCookies($cookies)->get('/felgen')->viewData('page')['props']['cards'][0];
    $configs = $this->withCookies($cookies)->get('/felgen/'.$card['slug'])->viewData('page')['props']['configs'];
    $config = collect($configs)->firstOrFail(fn (array $c): bool => $c['verdict']['sellable'] === true);

    foreach ([4, 4] as $quantity) {
        $this->withCookies($cookies)->post('/warenkorb', [
            'kind' => 'WHEEL',
            'wheelConfigId' => $config['id'],
            'quantity' => $quantity,
        ]);
    }

    $this->withCookies($cookies)
        ->get('/warenkorb')
        ->assertInertia(
            fn (AssertableInertia $p) => $p->has('lines', 1)->where('lines.0.quantity', 8)
        );
});

it('removes a line when the stepper reaches zero', function (): void {
    $config = WheelModel::query()->firstOrFail()->configs()->firstOrFail();

    $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'quantity' => 2]);

    $this->patch('/warenkorb/wheel:'.$config->id, ['quantity' => 0]);

    $this->get('/warenkorb')->assertInertia(fn (AssertableInertia $p) => $p->has('lines', 0));
});

it('clears the vehicle without clearing the basket', function (): void {
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $cookies = rimifyVehicleCookie($vehicle->id);

    // A configuration the engine permits on this car, so the basket takes it.
    $card = $this->withCookies($cookies)->get('/felgen')->viewData('page')['props']['cards'][0];
    $configs = $this->withCookies($cookies)->get('/felgen/'.$card['slug'])->viewData('page')['props']['configs'];
    $config = collect($configs)->firstOrFail(fn (array $c): bool => $c['verdict']['sellable'] === true);

    $this->withCookies($cookies)
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config['id'], 'quantity' => 4]);

    $this->delete('/fahrzeug')
        ->assertRedirect('/felgen-suchen')
        ->assertCookieExpired(VehicleContext::COOKIE);

    // `withCookies()` is sticky for the whole test instance, so the browser's discarded cookie is
    // simulated by clearing it here — otherwise the next request would still carry the vehicle and
    // the assertion below would be testing nothing.
    $this->defaultCookies = [];

    // The basket survives: the customer changed their mind about the car, not about the wheels,
    // and an emptied basket would read as the site losing their work.
    $this->get('/warenkorb')->assertInertia(
        fn (AssertableInertia $p) => $p
            ->has('lines', 1)
            // With no vehicle there is no claim to make, in either direction.
            ->where('lines.0.verdict', null)
    );
});

it('rejects a quantity outside the sane range', function (): void {
    $config = WheelModel::query()->firstOrFail()->configs()->firstOrFail();

    $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'quantity' => 0])
        ->assertSessionHasErrors('quantity');

    $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'quantity' => 1000])
        ->assertSessionHasErrors('quantity');
});
