<?php

declare(strict_types=1);

use App\Console\Commands\Smoke;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\WheelConfig;

/*
 * A test order gives its goods back (D-146): a paid order keeps its stock by design, so every release's smoke took a
 * wheel from the stock the client reviews — nine in two days on the preview, measured 03.10.2026. Only an order paid
 * with the test payment, and only once.
 */

function smokeTestOrder(WheelConfig $config, string $method, int $quantity): Order
{
    $order = Order::factory()->create();
    $order->forceFill(['payment_method' => $method, 'stock_reserved' => true])->save();
    OrderLine::factory()->create(['order_id' => $order->id, 'wheel_config_id' => $config->id, 'quantity' => $quantity]);

    return $order;
}

it('puts a test order’s goods back once, and says so in the Protokoll', function (): void {
    $config = WheelConfig::factory()->create(['stock_qty' => 11]);
    $order = smokeTestOrder($config, 'sandbox', 1);

    expect(Smoke::returnTestStock($order->order_number))->toBe(1)
        ->and($config->refresh()->stock_qty)->toBe(12)
        ->and((bool) $order->refresh()->getAttribute('stock_reserved'))->toBeFalse()
        // Its reservation went with it: a second call, or a later refund, puts nothing back again.
        ->and(Smoke::returnTestStock($order->order_number))->toBe(0)
        ->and($config->refresh()->stock_qty)->toBe(12);

    $entry = AuditLog::query()->where('description', 'order.test_stock_returned')->sole();
    expect($entry->actor_email)->toBe('Smoke-Test')
        ->and($entry->properties['order'])->toBe($order->order_number)
        ->and($entry->properties['quantity'])->toBe(1);
});

it('never touches an order paid with real money, or one it does not know', function (): void {
    $config = WheelConfig::factory()->create(['stock_qty' => 8]);
    $order = smokeTestOrder($config, 'card', 4);

    expect(Smoke::returnTestStock($order->order_number))->toBe(0)
        ->and(Smoke::returnTestStock('RMF-0000-0000'))->toBe(0)
        ->and($config->refresh()->stock_qty)->toBe(8)
        ->and((bool) $order->refresh()->getAttribute('stock_reserved'))->toBeTrue()
        ->and(AuditLog::query()->where('description', 'order.test_stock_returned')->exists())->toBeFalse();
});
