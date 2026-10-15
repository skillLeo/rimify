<?php

declare(strict_types=1);

use App\Enums\OrderLineKind;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Demo\AcceptanceSet;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;

/*
 * EIGENE-FUNDE 131 (S1): an order a real person places for the acceptance set's wheel is a real order. The acceptance
 * set's models are born demo and, off production, may be bought (AcceptanceSet::sellable) — so „has a line on a demo
 * model“ no longer means „seeded demonstration data“, and the order page must not open such an order to a stranger who
 * guesses its number. Only the seeded example catalogue's orders (CommerceSeeder) and orders born demo stay open.
 */
beforeEach(function (): void {
    CatalogueSeeder::$shopFixture = false;
    $this->seed(CommerceSeeder::class);
});

/** A seeded order whose wheels become the acceptance set's — what a real purchase of the acceptance wheel looks like. */
function orderOnAcceptanceWheel(): Order
{
    $order = Order::query()->where('is_demo', false)->orderBy('id')->firstOrFail();
    $configIds = OrderLine::query()->where('order_id', $order->id)->where('kind', OrderLineKind::Wheel->value)->pluck('wheel_config_id');
    $modelIds = WheelConfig::query()->whereIn('id', $configIds)->pluck('wheel_model_id')->unique();

    foreach ($modelIds as $id) {
        WheelModel::query()->whereKey($id)->update(['is_demo' => true, 'demo_ref' => AcceptanceSet::PREFIX.'wheel:test-'.$id]);
    }

    return $order->refresh();
}

it('opens an order for the acceptance set\'s wheel to nobody who merely knows its number', function (): void {
    $order = orderOnAcceptanceWheel();

    $this->get('/bestellung/'.$order->order_number)->assertNotFound();

    expect($order->isDemo())->toBeFalse();
});

it('opens it for its buyer through the signed link, as a real order with nothing hidden', function (): void {
    $order = orderOnAcceptanceWheel();

    $this->get(URL::signedRoute('bestellung.show', ['order' => $order->order_number]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('demo', false));
});

it('still shows the seeded example catalogue\'s orders as demonstration data', function (): void {
    $order = Order::query()->where('is_demo', false)->orderBy('id')->firstOrFail();

    expect($order->isDemo())->toBeTrue();
});
