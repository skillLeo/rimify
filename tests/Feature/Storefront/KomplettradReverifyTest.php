<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Models\BalanceWeightColour;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\TyreVariant;
use App\Models\WheelModel;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/**
 * docs/specs/komplettrad.md §4.5 and §9.2: a Komplettrad is re-verified on EVERY render — the tyre,
 * the colour and the verdict are re-read, never trusted from the session — and a line that has
 * become unsellable is marked with a full sentence and blocks the checkout without being dropped.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
    config(['rimify.shipping.cost_cents' => null, 'rimify.shipping.free_from_cents' => null]);
});

/**
 * A permitted set on a real (non-demo) wheel, with its permitted tyre and the default colour: the
 * demo gate would otherwise answer before the re-verification could.
 *
 * @return array{0: KomplettradFixture, 1: TyreVariant, 2: BalanceWeightColour}
 */
function reverifiedSet(): array
{
    $set = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($set->config->wheel_model_id)->update(['is_demo' => false]);
    $colour = BalanceWeightColour::default();

    if ($colour === null) {
        throw new RuntimeException('KomplettradOptionsSeeder must leave an active default colour.');
    }

    return [$set, $set->tyre(), $colour];
}

/**
 * A complete, valid checkout form. The RDKS question is answered (`nein`) because every basket
 * here holds a Komplettrad and the form must carry an answer (§5.3); what these cases test stands
 * earlier in the refusal order than the RDKS refusals (§4.9).
 *
 * @return array<string, mixed>
 */
function reverifyKasseForm(): array
{
    return [
        'email' => 'kunde@beispiel.de',
        'phone' => '',
        'name' => 'Erika Mustermann',
        'street' => 'Hauptstraße',
        'houseNumber' => '12',
        'zip' => '50667',
        'city' => 'Köln',
        'billingSame' => true,
        'shipping' => 'standard',
        'rdks' => 'nein',
    ];
}

/** @return array<string, int> */
function reverifyRowCounts(): array
{
    return [
        'orders' => Order::query()->count(),
        'order_lines' => OrderLine::query()->count(),
        'order_line_fitments' => OrderLineFitment::query()->count(),
    ];
}

it('keeps a Komplettrad whose vehicle was cleared, marks it, and blocks the checkout', function (): void {
    [$set, $tyre, $colour] = reverifiedSet();

    // No vehicle cookie: the customer cleared the car, not the basket.
    $this->withSession([Basket::SESSION_KEY => $set->sessionLine($tyre, $colour->id)])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.isSet', true)
            ->where('lines.0.tyre.id', $tyre->id)
            ->where('lines.0.verdict', null)
            ->where('lines.0.blockReasons', [Basket::LINE_VEHICLE_MISSING])
        );

    $this->get('/kasse')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('orderRefusal', Basket::BLOCKED_REFUSAL)
        );

    $before = reverifyRowCounts();

    $this->from('/kasse')
        ->post('/kasse', reverifyKasseForm())
        ->assertRedirect('/kasse')
        ->assertSessionHasErrors(['order' => Basket::BLOCKED_REFUSAL]);

    expect(reverifyRowCounts())->toBe($before);
});

it('marks a Komplettrad whose tyre has gone out of stock and keeps it in the basket', function (): void {
    [$set, $tyre, $colour] = reverifiedSet();
    $tyre->update(['stock_qty' => 2]);

    $this->withCookies($set->cookies())
        ->withSession([Basket::SESSION_KEY => $set->sessionLine($tyre, $colour->id)])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.inStock', false)
            ->where('lines.0.tyre.inStock', false)
            ->where('lines.0.verdict.sellable', true)
            ->where('lines.0.blockReasons', [KomplettradRefusal::OutOfStock->sentenceDe()])
        );

    $this->get('/kasse')->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::BLOCKED_REFUSAL));
});

it('marks a Komplettrad whose colour was deactivated and no longer offers that colour', function (): void {
    [$set, $tyre, $colour] = reverifiedSet();
    $colour->update(['active' => false]);

    $this->withCookies($set->cookies())
        ->withSession([Basket::SESSION_KEY => $set->sessionLine($tyre, $colour->id)])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.weights', null)
            ->where('lines.0.priceOpen', true)
            ->where('lines.0.blockReasons', [Basket::LINE_COLOUR_GONE])
            // The deactivated colour is no longer a tile; the other seeded colour still is.
            ->has('lines.0.weightOptions', 1)
            ->where('lines.0.weightOptions.0.name', 'Schwarz')
        );

    $this->get('/kasse')->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::BLOCKED_REFUSAL));
});

it('marks a Komplettrad whose document was superseded, with the sentence for the verdict the engine now gives', function (): void {
    [$set, $tyre, $colour] = reverifiedSet();
    $set->supersedeDocument();

    $status = app(FitmentResolver::class)->resolve($set->vehicle->id, $set->config->id)->status;
    expect($status->isSellable())->toBeFalse();

    // UNKNOWN is not NOT_PERMITTED (R-07): whichever the engine answers, its own sentence is shown.
    $expected = $status === VerdictStatus::NotPermitted
        ? KomplettradRefusal::VerdictNotPermitted
        : KomplettradRefusal::VerdictUnknown;

    $this->withCookies($set->cookies())
        ->withSession([Basket::SESSION_KEY => $set->sessionLine($tyre, $colour->id)])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.verdict.sellable', false)
            ->where('lines.0.verdict.status', $status->value)
            ->where('lines.0.blockReasons', [$expected->sentenceDe()])
        );

    $this->get('/kasse')->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::BLOCKED_REFUSAL));
});

it('marks a Komplettrad whose tyre was deleted and still names it as a set', function (): void {
    [$set, $tyre, $colour] = reverifiedSet();
    $tyre->delete();

    $this->withCookies($set->cookies())
        ->withSession([Basket::SESSION_KEY => $set->sessionLine($tyre, $colour->id)])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.isSet', true)
            ->where('lines.0.setLabel', 'Komplettrad')
            ->where('lines.0.tyre', null)
            ->where('lines.0.blockReasons', [Basket::LINE_TYRE_GONE])
        );

    $this->get('/kasse')->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::BLOCKED_REFUSAL));
});

it('refuses the order while the mounting fee is unconfigured and leaves the fee out of every figure', function (): void {
    [$set, $tyre, $colour] = reverifiedSet();
    config(['rimify.komplettrad.mounting_per_wheel_cents' => null]);
    $known = ($set->config->price_cents + $tyre->price_cents) * 4;

    $this->withCookies($set->cookies())
        ->withSession([Basket::SESSION_KEY => $set->sessionLine($tyre, $colour->id)])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('totals.mountingConfigured', false)
            ->where('totals.subtotalCents', $known)
            ->where('lines.0.blockReasons', [])
            ->where('lines.0.priceOpen', true)
            ->where('lines.0.lineTotalCents', $known)
            ->where('lines.0.mounting.configured', false)
            ->where('lines.0.mounting.unitPriceCents', null)
            ->where('lines.0.mounting.unitPrice', Basket::OPEN_PRICE)
            ->where('lines.0.components.2.label', 'Montage und Auswuchten')
            ->where('lines.0.components.2.open', true)
            ->where('lines.0.components.2.unitPrice', Basket::OPEN_PRICE)
            ->where('lines.0.components.2.lineTotal', null)
        );

    $this->get('/kasse')->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::MOUNTING_REFUSAL));

    $before = reverifyRowCounts();

    $this->from('/kasse')
        ->post('/kasse', reverifyKasseForm())
        ->assertSessionHasErrors(['order' => Basket::MOUNTING_REFUSAL]);

    expect(reverifyRowCounts())->toBe($before);

    // Once the client names the fee it is in the figures, and the next refusal in line is shipping.
    config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);

    $this->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('totals.mountingConfigured', true)
            ->where('lines.0.priceOpen', false)
            ->where('lines.0.lineTotalCents', $known + 1_900 * 4)
            ->where('lines.0.mounting.configured', true)
            ->where('lines.0.mounting.unitPriceCents', 1_900)
            ->where('lines.0.components.2.open', false)
        );

    $this->get('/kasse')->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::SHIPPING_REFUSAL));
});

it('catches a demo tyre in the demo gate even when the wheel is real', function (): void {
    [$set, $tyre, $colour] = reverifiedSet();
    $tyre->update(['is_demo' => true]);
    config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);

    $this->withCookies($set->cookies())
        ->withSession([Basket::SESSION_KEY => $set->sessionLine($tyre, $colour->id)])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.demo', true)
            ->where('lines.0.blockReasons', [])
        );

    $this->get('/kasse')->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::DEMO_REFUSAL));
});
