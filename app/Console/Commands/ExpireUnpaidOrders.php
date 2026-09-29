<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Payments\Payments;
use App\Services\Commerce\OrderPayments;
use Illuminate\Console\Command;

/**
 * An order unpaid 24 hours after it was written expires (Block G): its payment is stopped at the provider first,
 * so it can no longer be paid, then the order becomes „abgelaufen“ and its stock goes back on the shelf. An order
 * whose payment is already on its way (Zahlung läuft — SEPA, Klarna) is never expired: the provider decides it.
 * Scheduled every ten minutes (routes/console.php).
 */
final class ExpireUnpaidOrders extends Command
{
    protected $signature = 'orders:expire';

    protected $description = 'Expire orders unpaid 24 hours after they were placed, and release their stock';

    public function handle(OrderPayments $payments): int
    {
        $expired = 0;
        $kept = 0;

        Order::query()
            ->whereIn('status', [OrderStatus::PendingPayment->value, OrderStatus::Failed->value])
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->each(function (Order $order) use ($payments, &$expired, &$kept): void {
                $gateway = Payments::for((string) $order->getAttribute('payment_method'));

                // A payment the provider will not stop has moved on (it succeeded a moment ago): its webhook decides.
                if ($gateway !== null && ! $gateway->cancel($order)) {
                    $kept++;

                    return;
                }

                if ($payments->move($order, OrderStatus::Expired, 'System', null, [], ['reason' => 'unbezahlt nach '.OrderPayments::HOURS_TO_PAY.' Stunden'])) {
                    $expired++;
                }
            });

        $this->info("Abgelaufen: {$expired}; bei der Zahlung geblieben: {$kept}.");

        return self::SUCCESS;
    }
}
