<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\OrderLine;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Services\Commerce\OrderPayments;
use App\Services\Commerce\OrderRefused;

/*
 * Nothing is counted (his admin items 7 and 10, D-299, D-301): writing an order reads each rim and each tyre under a lock
 * and stops where one is no longer available — a tyre also where it is not offered, its EU label not on record (D-303).
 * Nothing is taken off a shelf, so a dead order puts nothing back. This replaced D-146's return of a smoke test's stock:
 * there is none to return.
 */

function availabilityOrder(WheelConfig $config, int $quantity, ?TyreVariant $tyre = null): Order
{
    $order = Order::factory()->create();
    OrderLine::factory()->create(['order_id' => $order->id, 'wheel_config_id' => $config->id, 'tyre_variant_id' => $tyre?->id, 'quantity' => $quantity]);

    return $order;
}

it('takes nothing off a shelf for a Komplettrad, and a dead order puts nothing back @admin-210', function (): void {
    $config = WheelConfig::factory()->create(['stock_qty' => 11]);
    $tyre = TyreVariant::factory()->create(['stock_qty' => 11]);
    $order = availabilityOrder($config, 4, $tyre);

    app(OrderPayments::class)->reserve($order);

    expect((bool) $order->refresh()->stock_reserved)->toBeTrue()
        ->and($tyre->refresh()->stock_qty)->toBe(11)
        ->and($config->refresh()->stock_qty)->toBe(11);

    app(OrderPayments::class)->release($order);

    expect((bool) $order->refresh()->stock_reserved)->toBeFalse()
        ->and($tyre->refresh()->stock_qty)->toBe(11);
});

it('stops the order on a tyre marked not available, whatever its old count @admin-210', function (): void {
    $order = availabilityOrder(WheelConfig::factory()->create(), 4, TyreVariant::factory()->create(['stock_qty' => 40, 'available' => false]));

    expect(fn () => app(OrderPayments::class)->reserve($order))->toThrow(OrderRefused::class, OrderPayments::TYRE_NOT_AVAILABLE);
    expect((bool) $order->refresh()->stock_reserved)->toBeFalse();
});

it('stops the order on a real tyre whose EU label is not on record (D-303) @admin-210', function (): void {
    $order = availabilityOrder(WheelConfig::factory()->create(), 4, TyreVariant::factory()->unlabelled()->create());

    expect(fn () => app(OrderPayments::class)->reserve($order))->toThrow(OrderRefused::class, OrderPayments::TYRE_NOT_AVAILABLE);
});

it('stops the order on a rim size marked not available (D-299)', function (): void {
    $order = availabilityOrder(WheelConfig::factory()->outOfStock()->create(), 4);

    expect(fn () => app(OrderPayments::class)->reserve($order))->toThrow(OrderRefused::class, OrderPayments::NOT_AVAILABLE);
});
