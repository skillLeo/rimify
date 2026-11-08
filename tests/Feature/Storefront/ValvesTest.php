<?php

declare(strict_types=1);

use App\Mail\OrderConfirmationMail;
use App\Models\BalanceWeightColour;
use App\Models\Order;
use App\Models\TpmsSensorPrice;
use App\Payments\Stripe\StripeGateway;
use App\Services\Admin\Orders\OrderDetail;
use App\Services\Commerce\OrderLinks;
use App\Support\GermanFormat;
use App\Support\MakeName;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The valves (the client's round of 08.11.2026, §1, D-443): „Is included for free for normal. If RDKS is selected, then there is no
 * 'normal' valve. If no tire is selected when customer only orders rims then we dont send valves.“ A Komplettrad without RDKS carries
 * „Ventile (inklusive)“ at 0,00 €; with RDKS none — the sensor carries the valve; a rim alone none. The warehouse reads it in the
 * basket, the checkout, the mail and the admin's order; the order freezes it.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class, AccessSeeder::class]);
    config([
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping.cost_cents' => null,
        'rimify.shipping.free_from_cents' => null,
        'rimify.komplettrad.mounting_per_wheel_cents' => 2_500,
    ]);
    $this->set = KomplettradFixture::permitted();
    $this->tyre = $this->set->tyre();
    $this->silver = BalanceWeightColour::default() ?? throw new RuntimeException('no standard colour');
    TpmsSensorPrice::factory()->ofMake(MakeName::key($this->set->vehicle->make), MakeName::normalise($this->set->vehicle->make))->create(['price_cents' => 4_900]);
});

/** @return list<string> the basket line's rows */
function valveRows(object $test, ?string $rdks, bool $tyre = true): array
{
    $test->withCookies($test->set->cookies())->from('/felgen')->post('/warenkorb', array_filter([
        'kind' => 'WHEEL', 'wheelConfigId' => $test->set->config->id, 'tyreVariantId' => $tyre ? $test->tyre->id : null, 'quantity' => 4,
        'weightColourId' => $tyre ? $test->silver->id : null, 'rdks' => $rdks,
    ], static fn (mixed $value): bool => $value !== null))->assertSessionHasNoErrors();

    $lines = $test->withCookies($test->set->cookies())->get('/warenkorb')->assertOk()->viewData('page')['props']['lines'];

    return collect($lines[0]['components'])->map(fn (array $r): string => $r['label'].' · '.$r['quantity'].' × '.$r['unitPrice'])->all();
}

it('puts „Ventile (inklusive)“ at 0,00 € on a Komplettrad without RDKS', function (): void {
    expect(valveRows($this, 'nein'))->toContain('Ventile (inklusive) · 4 × '.GermanFormat::money(0));
});

it('puts no valve on a Komplettrad with RDKS: the sensor carries it', function (): void {
    expect(implode(' | ', valveRows($this, 'ja')))->not->toContain('Ventil');
});

it('puts no valve on a rim sold alone', function (): void {
    expect(valveRows($this, null, tyre: false))->toBe(['Felge · 4 × '.collect($this->withCookies($this->set->cookies())->get('/warenkorb')->viewData('page')['props']['lines'][0]['components'])->first()['unitPrice']]);
});

it('says nothing of valves while RDKS is unanswered: the order waits for the answer anyway', function (): void {
    expect(implode(' | ', valveRows($this, null)))->not->toContain('Ventil');
});

it('freezes it with the order, and says it on the order page, in the mail, in the admin and beside the payment', function (): void {
    valveRows($this, 'nein');

    $this->withCookies($this->set->cookies())->from('/kasse')->post('/kasse', [
        'email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein',
    ])->assertSessionHasNoErrors();

    $order = Order::query()->with('lines')->latest('id')->firstOrFail();
    $set = $order->lines->firstWhere('kind.value', 'PACKAGE');
    $valves = collect($set->components)->firstWhere('key', 'valves');

    // By key and value: MySQL's JSON column orders an object's keys its own way.
    expect($valves)->toEqual(['key' => 'valves', 'label' => 'Ventile (inklusive)', 'quantity' => 4, 'unitPriceCents' => 0, 'lineTotalCents' => 0])
        ->and(collect($set->components)->sum('lineTotalCents'))->toBe($set->line_total_cents);

    $page = collect($this->get(OrderLinks::link($order))->assertOk()->viewData('page')['props']['lines']);
    expect(collect($page->firstWhere('kind', 'PACKAGE')['components'])->pluck('label'))->toContain('Ventile (inklusive)');

    expect((new OrderConfirmationMail($order, null))->render())->toContain('Ventile (inklusive): 4 × '.GermanFormat::money(0));

    $detail = app(OrderDetail::class)->for($order->fresh());
    expect(collect(collect($detail['lines'])->firstWhere('kind', 'PACKAGE')['components'])->pluck('label'))->toContain('Ventile (inklusive)');

    expect(collect(StripeGateway::lineMetadata($order))->contains(fn (string $row): bool => str_starts_with($row, 'Ventile (inklusive)')))->toBeTrue();
});
