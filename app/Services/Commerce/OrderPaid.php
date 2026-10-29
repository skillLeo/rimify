<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Jobs\IssueStripeInvoice;
use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use App\Payments\Stripe\StripeInvoices;
use App\Services\Admin\AuditTrail;
use App\Support\MailDelivery;
use App\Support\OwnInvoices;
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
    public function __construct(private readonly Invoices $invoices, private readonly StripeInvoices $stripeInvoices) {}

    public function handle(Order $order): void
    {
        $order = $order->fresh() ?? $order;

        if ($order->payment_flag !== null) {
            return;
        }

        // A demo order — a test purchase in the acceptance set — never counts in a real figure, and an invoice is one:
        // it would take the next number of the §14 series. The confirmation goes out and says why there is none (D-239).
        // With the shop's own invoices off (D-348) none is issued at all: Stripe issues it.
        $invoice = null;

        if (! $order->isDemo() && OwnInvoices::enabled()) {
            try {
                $invoice = $this->invoices->issueFor($order);
            } catch (Throwable $e) {
                report($e);
                AuditTrail::system('System', 'invoice.failed', ['order' => $order->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);

                return;
            }
        }

        // Stripe issues it where the order was paid through Stripe (his admin item 17, D-361) — before the mail, so the mail
        // links it, and never a link to one that does not exist yet: a failure is retried, and the mail goes without.
        if (! $order->isDemo() && ! OwnInvoices::enabled() && StripeInvoices::applies($order)) {
            try {
                $order = $this->stripeInvoices->issue($order);
            } catch (Throwable $e) {
                report($e);
                AuditTrail::system('System', 'stripe_invoice.failed', ['order' => $order->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);
                IssueStripeInvoice::dispatch($order->id)->delay(now()->addMinutes(2));
            }
        }

        $email = $order->customer?->email;

        if (! is_string($email) || $email === '') {
            return;
        }

        try {
            Mail::to($email)->send(new OrderConfirmationMail($order, $invoice));
            // „Verschickt“ only where the mail left the server: the confirmation page tells the customer it is in their
            // inbox on this entry alone. A shop whose mailer writes to the log — the preview — records that (D-347).
            AuditTrail::system('System', MailDelivery::real() ? 'order.confirmation_sent' : 'order.confirmation_not_mailed', ['order' => $order->order_number, 'invoice' => $invoice?->number], $order);
        } catch (Throwable $e) {
            report($e);
            AuditTrail::system('System', 'order.confirmation_failed', ['order' => $order->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);
        }
    }
}
