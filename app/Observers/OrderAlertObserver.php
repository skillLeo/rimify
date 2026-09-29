<?php

declare(strict_types=1);

namespace App\Observers;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Admin\AdminAlerts;
use App\Support\GermanFormat;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * Tells the team when an order turns Bezahlt — the moment there is work to do on it.
 *
 * Only a change into Bezahlt counts, never an order created as paid: demo data and imports write
 * finished orders, and nobody needs a bell for those. After commit, so a payment the webhook rolls
 * back never rings.
 */
class OrderAlertObserver implements ShouldHandleEventsAfterCommit
{
    public function __construct(private readonly AdminAlerts $alerts) {}

    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status') || $order->status !== OrderStatus::Paid) {
            return;
        }

        $detail = GermanFormat::money($order->total_cents);

        if (is_string($order->vehicle_label) && $order->vehicle_label !== '') {
            $detail .= ' · '.$order->vehicle_label;
        }

        $this->alerts->send(
            'order_paid',
            "Bestellung {$order->order_number} ist bezahlt.",
            $detail,
            ['route' => 'admin.bestellungen.show', 'params' => ['order' => $order->id]],
        );
    }
}
