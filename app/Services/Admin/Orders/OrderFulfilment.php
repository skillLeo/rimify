<?php

declare(strict_types=1);

namespace App\Services\Admin\Orders;

use App\Enums\OrderStatus;
use App\Mail\OrderShippedMail;
use App\Models\AdminUser;
use App\Models\Order;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * „Versendet“ and „Zugestellt“ on an order (Verkauf › Bestellungen, D-103): the two steps after the money that the team
 * takes by hand. A review can only come from a delivered order, so delivery is a fact someone recorded, with its time —
 * never assumed from a shipping date. The moves are the state machine's (OrderStatus::next); the model refuses any
 * other. Both are written to the Protokoll.
 *
 * A partly refunded order keeps „Teilweise erstattet“: its money status is not the team's to undo. Sending and
 * delivering the rest only record their dates, once each (the admin audit's F-15).
 */
final class OrderFulfilment
{
    /** Whether „Versendet“ is a step this order can take now. */
    public static function canShip(Order $order): bool
    {
        if ($order->isDemo()) {
            return false;
        }

        return $order->status === OrderStatus::PartiallyRefunded
            ? $order->shipped_at === null
            : $order->status->canBecome(OrderStatus::Shipped);
    }

    /** Whether „Zugestellt“ is a step this order can take now. */
    public static function canDeliver(Order $order): bool
    {
        if ($order->isDemo()) {
            return false;
        }

        return $order->status === OrderStatus::PartiallyRefunded
            ? $order->shipped_at !== null && $order->delivered_at === null
            : $order->status === OrderStatus::Shipped;
    }

    /** @return bool|null whether the shipping mail went out — null where the order has no address to send it to */
    public function ship(Order $order, AdminUser $admin, ?string $tracking): ?bool
    {
        DB::transaction(function () use ($order, $admin, $tracking): void {
            $order->forceFill([
                'status' => self::keepsRefund($order) ? OrderStatus::PartiallyRefunded->value : OrderStatus::Shipped->value,
                'shipped_at' => now(),
                'tracking_code' => $tracking === null || $tracking === '' ? $order->tracking_code : $tracking,
            ])->save();

            AuditTrail::record($admin, 'order.shipped', ['order' => $order->order_number, 'tracking' => $order->tracking_code], $order);
        });

        return self::tellCustomer($order);
    }

    /**
     * The customer hears that the order is on its way, with the tracking number the team typed — it reached nobody
     * (the admin audit's F-14). Sent once the step is saved; a mail that cannot go out never undoes it: reported and
     * written to the Protokoll, as the confirmation's (OrderPaid).
     */
    private static function tellCustomer(Order $order): ?bool
    {
        $email = $order->customer?->email;

        if (! is_string($email) || $email === '') {
            return null;
        }

        try {
            Mail::to($email)->send(new OrderShippedMail($order));
            AuditTrail::system('System', 'order.shipping_mail_sent', ['order' => $order->order_number, 'tracking' => $order->tracking_code], $order);

            return true;
        } catch (Throwable $e) {
            report($e);
            AuditTrail::system('System', 'order.shipping_mail_failed', ['order' => $order->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);

            return false;
        }
    }

    public function deliver(Order $order, AdminUser $admin): void
    {
        DB::transaction(function () use ($order, $admin): void {
            $order->forceFill([
                'status' => self::keepsRefund($order) ? OrderStatus::PartiallyRefunded->value : OrderStatus::Completed->value,
                'delivered_at' => now(),
            ])->save();

            AuditTrail::record($admin, 'order.delivered', ['order' => $order->order_number], $order);
        });
    }

    private static function keepsRefund(Order $order): bool
    {
        return $order->status === OrderStatus::PartiallyRefunded;
    }
}
