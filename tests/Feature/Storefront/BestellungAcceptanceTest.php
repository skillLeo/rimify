<?php

declare(strict_types=1);

use App\Enums\OrderLineKind;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Commerce\OrderLinks;
use App\Services\Demo\AcceptanceSet;
use App\Services\Demo\DemoPurge;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia;

/*
 * EIGENE-FUNDE 131 (S1, D-238). The order page opened demonstration data to anyone holding the number, and an order a
 * real person placed for the acceptance set's wheel counted as demonstration data. The rule is provenance now, never
 * content (the operator's rule of 15.10.2026): a seeded order opens by number; an order that came through the
 * checkout requires its proof — always, in every environment, whatever it contains.
 */
beforeEach(function (): void {
    CatalogueSeeder::$shopFixture = false;
    $this->seed(CommerceSeeder::class);
});

/** An order as the checkout writes it, with one wheel line on the acceptance set's wheel when asked. */
function checkoutOrder(bool $acceptanceWheel): Order
{
    $order = Order::factory()->create();

    if ($acceptanceWheel) {
        $config = WheelConfig::query()->orderBy('id')->firstOrFail();
        WheelModel::query()->whereKey($config->wheel_model_id)->update(['is_demo' => true, 'demo_ref' => AcceptanceSet::PREFIX.'wheel:test']);
        OrderLine::factory()->create(['order_id' => $order->id, 'kind' => OrderLineKind::Wheel->value, 'wheel_config_id' => $config->id]);
    }

    return $order->refresh();
}

it('opens an order that came through the checkout to nobody who merely knows its number, whatever it contains', function (bool $acceptanceWheel): void {
    $order = checkoutOrder($acceptanceWheel);

    expect($order->origin)->toBe(Order::ORIGIN_CHECKOUT)
        ->and($order->seeded())->toBeFalse();

    $this->get('/bestellung/'.$order->order_number)->assertNotFound();
    $this->getJson('/bestellung/'.$order->order_number.'/status')->assertNotFound();
})->with(['a real wheel' => [false], 'the acceptance set\'s wheel' => [true]]);

it('opens it through its signed link — and an order with a demo line says it is demonstration data', function (): void {
    $order = checkoutOrder(acceptanceWheel: true);

    $this->get(OrderLinks::link($order))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('demo', true));
});

it('opens an order a seeder wrote by its number', function (): void {
    $order = Order::query()->orderBy('id')->firstOrFail();

    expect($order->seeded())->toBeTrue();

    $this->get('/bestellung/'.$order->order_number)->assertOk();
});

it('opens a seeded demo order by number only while the demo data is there — afterwards its number answers 404', function (): void {
    $order = Order::factory()->seeded()->create(['is_demo' => true, 'demo_ref' => 'demo:order:verschwindet']);

    $this->get('/bestellung/'.$order->order_number)->assertOk();

    app(DemoPurge::class)->run('Test', null, catalogue: false);

    $this->get('/bestellung/'.$order->order_number)->assertNotFound();
});

it('never lets an order become a seeded one after the fact', function (): void {
    $order = checkoutOrder(acceptanceWheel: false);

    expect(fn () => Order::query()->whereKey($order->id)->update(['origin' => Order::ORIGIN_SEEDED]))
        ->toThrow(QueryException::class, 'origin is fixed at insert');
});
