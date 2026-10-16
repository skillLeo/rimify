<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * What follows a confirmed payment, once (OrderPayments::paid calls it only when the order moved to paid, so a
 * replayed webhook never repeats it): the §14 invoice is issued and the confirmation mail goes out with it, the AGB
 * and the Widerrufsbelehrung in its text (§ 312f BGB).
 *
 * Neither may undo the payment: a failure is reported and audited, and the order stays paid — the invoice can be
 * issued again from the admin, the mail resent. A flagged order (its amount did not match) gets neither until a
 * person has looked.
 */
final class OrderPaid
{
    public function __construct(private readonly Invoices $invoices) {}

    public function handle(Order $order): void
    {
        $order = $order->fresh() ?? $order;

        if ($order->payment_flag !== null) {
            return;
        }

        // A demo order — a test purchase in the acceptance set — never counts in a real figure, and an invoice is one:
        // it would take the next number of the §14 series. The confirmation goes out and says why there is none (D-239).
        $invoice = null;

        if (! $order->isDemo()) {
            try {
                $invoice = $this->invoices->issueFor($order);
            } catch (Throwable $e) {
                report($e);
                AuditTrail::system('System', 'invoice.failed', ['order' => $order->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);

                return;
            }
        }

        $email = $order->customer?->email;

        if (! is_string($email) || $email === '') {
            return;
        }

        try {
            Mail::to($email)->send(new OrderConfirmationMail($order, $invoice));
            AuditTrail::system('System', 'order.confirmation_sent', ['order' => $order->order_number, 'invoice' => $invoice?->number], $order);
        } catch (Throwable $e) {
            report($e);
            AuditTrail::system('System', 'order.confirmation_failed', ['order' => $order->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);
        }
    }
}
