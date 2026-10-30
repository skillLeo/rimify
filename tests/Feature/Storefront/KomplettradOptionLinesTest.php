<?php

declare(strict_types=1);

use App\Mail\OrderConfirmationMail;
use App\Models\BalanceWeightColour;
use App\Models\Order;
use App\Models\TpmsSensorPrice;
use App\Payments\Stripe\StripeGateway;
use App\Services\Admin\Orders\OrderDetail;
use App\Services\Commerce\OrderLinks;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use App\Support\MakeName;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The client's #15, answered (29.10.2026, D-355): „The selection of the RDKS-Sensoren must be done by a user and should not
 * be auto selected. In the cart, the RDKS-Sensoren must be also shown alongside the weights, wheels and so on.“ No paid
 * option is chosen for the visitor (§ 312a Abs. 3 BGB); every row is its own line — in the basket, the checkout, the
 * order page, the mail, the admin and beside the payment in Stripe —, each total right to the cent.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class, AccessSeeder::class]);
    config([
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping.cost_cents' => null,
        'rimify.shipping.free_from_cents' => null,
        // Montage und Auswuchten priced, as Einstellungen › Zubehörpreise holds it: a set with an open price is not sold.
        'rimify.komplettrad.mounting_per_wheel_cents' => 2_500,
    ]);
    $this->set = KomplettradFixture::permitted();
    $this->tyre = $this->set->tyre();
    $this->black = BalanceWeightColour::query()->where('name_de', 'Schwarz')->firstOrFail();
    $this->silver = BalanceWeightColour::default() ?? throw new RuntimeException('no standard colour');
    TpmsSensorPrice::factory()->ofMake(MakeName::key($this->set->vehicle->make), MakeName::normalise($this->set->vehicle->make))->create(['price_cents' => 4_900]);
});

/** Adds the set to the basket as the product page does; null leaves the question unanswered. */
function optionsAdd(object $test, ?int $colourId, ?string $rdks): TestResponse
{
    return $test->withCookies($test->set->cookies())->from('/felgen')->post('/warenkorb', array_filter([
        'kind' => 'WHEEL', 'wheelConfigId' => $test->set->config->id, 'tyreVariantId' => $test->tyre->id, 'quantity' => 4,
        'weightColourId' => $colourId, 'rdks' => $rdks,
    ], static fn (mixed $value): bool => $value !== null));
}

/** @return array<string, mixed> the basket page's props */
function optionsBasket(object $test): array
{
    return $test->withCookies($test->set->cookies())->get('/warenkorb')->assertOk()->viewData('page')['props'];
}

it('chooses nothing paid for the visitor: no RDKS answer, no colour, and a surcharge only when picked @kunde-15', function (): void {
    $slug = $this->set->config->wheelModel->slug;

    $this->withCookies($this->set->cookies())->get('/felgen/'.$slug)->assertInertia(fn (AssertableInertia $page) => $page
        ->where('komplettradOptions.tpms.choice', null));

    // The standard colour costs nothing: a set added without a pick takes it — no payment beyond the price.
    optionsAdd($this, null, null)->assertSessionHasNoErrors();
    expect(collect(session(Basket::SESSION_KEY))->first()['weightColourId'])->toBe($this->silver->id)
        ->and(session(Basket::SESSION_TPMS))->toBeNull();

    // Once it costs something, it is never put in unasked.
    session()->forget(Basket::SESSION_KEY);
    $this->silver->forceFill(['surcharge_cents' => 300])->save();
    optionsAdd($this, null, null)->assertSessionHasErrors(['tyreVariantId' => Basket::WEIGHT_COLOUR_MISSING]);
    expect(session(Basket::SESSION_KEY, []))->toBe([]);

    optionsAdd($this, $this->silver->id, null)->assertSessionHasNoErrors();
});

it('prices each row to the cent: without any option, with RDKS only, and with every option @kunde-15', function (): void {
    $this->black->forceFill(['surcharge_cents' => 250])->save();

    // Without any option: the free standard colour, no sensors.
    optionsAdd($this, $this->silver->id, 'nein')->assertSessionHasNoErrors();
    $none = optionsBasket($this);
    $line = $none['lines'][0];
    $rows = collect($line['components']);

    expect($rows->pluck('label')->all())->toBe(['Felge', 'Reifen', 'Montage und Auswuchten', 'Wuchtgewichte (Silber)'])
        ->and($rows->every(fn (array $row): bool => $row['quantity'] === 4 && $row['lineTotalCents'] === 4 * $row['unitPriceCents']))->toBeTrue()
        ->and($rows->sum('lineTotalCents'))->toBe($line['lineTotalCents'])
        ->and($none['totals']['tpms']['choice'])->toBe('nein');
    $base = (int) $none['totals']['subtotalCents'];

    // RDKS only: four sensors at 49,00 € — 196,00 € more, to the cent. (The same set again would be eight: a fresh basket.)
    session()->forget(Basket::SESSION_KEY);
    optionsAdd($this, $this->silver->id, 'ja');
    $rdks = optionsBasket($this);
    expect((int) $rdks['totals']['subtotalCents'])->toBe($base + 4 * 4_900)
        ->and($rdks['totals']['tpms']['totalCents'])->toBe(19_600)
        ->and($rdks['totals']['tpms']['quantity'])->toBe(4);

    // Every option: black weights (+2,50 € a wheel) and the sensors.
    session()->forget(Basket::SESSION_KEY);
    optionsAdd($this, $this->black->id, 'ja');
    $all = optionsBasket($this);
    $weights = collect($all['lines'][0]['components'])->firstWhere('key', 'weights');

    expect($weights['label'])->toBe('Wuchtgewichte (Schwarz)')
        ->and($weights['lineTotalCents'])->toBe(4 * 250)
        ->and((int) $all['totals']['subtotalCents'])->toBe($base + 4 * 250 + 4 * 4_900);
});

it('shows a rim sold alone with no option block: its one row, no RDKS question', function (): void {
    $this->withCookies($this->set->cookies())->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $this->set->config->id, 'quantity' => 4])
        ->assertSessionHasNoErrors();
    $basket = optionsBasket($this);

    expect(collect($basket['lines'][0]['components'])->pluck('label')->all())->toBe(['Felge'])
        ->and($basket['totals']['tpms']['applicable'] ?? false)->toBeFalse();
});

it('keeps every row in the order: its page, its mail, the admin and Stripe each list them @kunde-15', function (): void {
    $this->black->forceFill(['surcharge_cents' => 250])->save();
    optionsAdd($this, $this->black->id, 'ja')->assertSessionHasNoErrors();

    $this->withCookies($this->set->cookies())->from('/kasse')->post('/kasse', [
        'email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'ja',
    ])->assertSessionHasNoErrors();

    $order = Order::query()->with('lines')->latest('id')->firstOrFail();
    $set = $order->lines->firstWhere('kind.value', 'PACKAGE');
    $sensors = $order->lines->firstWhere('kind.value', 'ACCESSORY');
    $rows = collect($set->components);

    expect($rows->pluck('label')->all())->toBe(['Felge', 'Reifen', 'Montage und Auswuchten', 'Wuchtgewichte (Schwarz)'])
        ->and($rows->sum('lineTotalCents'))->toBe($set->line_total_cents)
        ->and($sensors->quantity)->toBe(4)
        ->and($sensors->line_total_cents)->toBe(19_600)
        ->and($order->lines->sum('line_total_cents'))->toBe($order->subtotal_cents);

    $weights = 'Wuchtgewichte (Schwarz)';
    [$each, $four] = [GermanFormat::money(250), GermanFormat::money(1_000)];

    // The order page: the set's four rows under it, the sensors their own line.
    $lines = collect($this->get(OrderLinks::link($order))->assertOk()->viewData('page')['props']['lines']);
    expect(collect($lines->firstWhere('kind', 'PACKAGE')['components'])->firstWhere('label', $weights))->toBe(['label' => $weights, 'quantity' => 4, 'unitPrice' => $each, 'lineTotal' => $four])
        ->and($lines->firstWhere('kind', 'ACCESSORY')['lineTotal'])->toBe(GermanFormat::money(19_600));

    // The mail.
    $mail = (new OrderConfirmationMail($order, null))->render();
    expect($mail)->toContain('Reifen: 4 ×')->toContain($weights.': 4 × '.$each.' = '.$four)->toContain('RDKS-Sensoren');

    // The admin.
    $detail = app(OrderDetail::class)->for($order->fresh());
    expect(collect($detail['lines'])->firstWhere('kind', 'PACKAGE')['components'])->toHaveCount(4);

    // Beside the payment in Stripe: each row its own entry, the sensors and the weights among them.
    $meta = StripeGateway::lineMetadata($order);
    expect($meta)->toHaveKey('pos_1')
        ->and(array_values($meta))->toContain($weights.' · 4 × '.$each.' = '.$four)
        ->and(collect($meta)->contains(fn (string $row): bool => str_starts_with($row, 'RDKS-Sensoren')))->toBeTrue();
});
