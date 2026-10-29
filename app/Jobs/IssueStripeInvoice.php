<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Order;
use App\Payments\Stripe\StripeInvoices;
use App\Services\Admin\AuditTrail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Stripe's invoice for a paid order, tried again where the first attempt failed (D-361): from wherever it stopped — the
 * service keeps the draft's id and every step's idempotency key —, never a second invoice. After the last try the order
 * says so in the Protokoll, where the team sees it.
 */
final class IssueStripeInvoice implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(public readonly int $orderId) {}

    /** @return list<int> */
    public function backoff(): array
    {
        return [120, 600, 1800, 7200];
    }

    public function handle(StripeInvoices $invoices): void
    {
        $order = Order::query()->find($this->orderId);

        if ($order === null) {
            return;
        }

        $invoices->issue($order);
    }

    public function failed(Throwable $e): void
    {
        $order = Order::query()->find($this->orderId);

        AuditTrail::system('System', 'stripe_invoice.gave_up', ['order' => $order?->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);
    }
}
