<?php

declare(strict_types=1);

namespace App\Services\Admin\Orders;

use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\Order;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * „Versendet“ and „Zugestellt“ on an order (Verkauf › Bestellungen, D-103): the two steps after the money that the team
 * takes by hand. A review can only come from a delivered order, so delivery is a fact someone recorded, with its time —
 * never assumed from a shipping date. The moves are the state machine's (OrderStatus::next); the model refuses any
 * other. Both are written to the Protokoll.
 */
final class OrderFulfilment
{
    /** Whether „Versendet“ is a step this order can take now. */
    public static function canShip(Order $order): bool
    {
        return ! $order->isDemo() && $order->status->canBecome(OrderStatus::Shipped);
    }

    /** Whether „Zugestellt“ is a step this order can take now. */
    public static function canDeliver(Order $order): bool
    {
        return ! $order->isDemo() && $order->status === OrderStatus::Shipped;
    }

    public function ship(Order $order, AdminUser $admin, ?string $tracking): void
    {
        DB::transaction(function () use ($order, $admin, $tracking): void {
            $order->forceFill([
                'status' => OrderStatus::Shipped->value,
                'shipped_at' => now(),
                'tracking_code' => $tracking === null || $tracking === '' ? $order->tracking_code : $tracking,
            ])->save();

            AuditTrail::record($admin, 'order.shipped', ['order' => $order->order_number, 'tracking' => $order->tracking_code], $order);
        });
    }

    public function deliver(Order $order, AdminUser $admin): void
    {
        DB::transaction(function () use ($order, $admin): void {
            $order->forceFill([
                'status' => OrderStatus::Completed->value,
                'delivered_at' => now(),
            ])->save();

            AuditTrail::record($admin, 'order.delivered', ['order' => $order->order_number], $order);
        });
    }
}
