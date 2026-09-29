<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Mail\RefundMail;
use App\Models\AdminUser;
use App\Models\Order;
use App\Models\Refund;
use App\Payments\PaymentFailure;
use App\Payments\Payments;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * A refund from the order page (Block G §5): full or partial, with a reason, and only through the provider's API —
 * never marked by hand. What the provider took is written back at once (erstattet or teilweise erstattet; the
 * webhook's `charge.refunded` later finds nothing new), documented by a credit note in its own series, mailed to the
 * customer with it, and audited with who asked.
 *
 * A second press sends the same idempotency key, so the provider answers with the refund it already made, and the
 * unique provider id refuses a second row.
 */
final class RefundOrder
{
    public const NOT_PAID = 'Erstatten lässt sich nur eine bezahlte Bestellung.';

    public const NOTHING_LEFT = 'Diese Bestellung ist schon ganz erstattet.';

    public const TOO_MUCH = 'Höchstens %s lassen sich noch erstatten.';

    public const NO_PROVIDER = 'Die Zahlungsart dieser Bestellung ist gerade nicht in Kraft. Es wurde nichts erstattet – bitte nicht von Hand im Zahlungsdienst erstatten, sonst fehlt die Gutschrift.';

    public function __construct(private readonly OrderPayments $payments, private readonly Invoices $invoices) {}

    /**
     * How much can still be refunded, in cents — 0 for an order that was never paid.
     */
    public static function refundable(Order $order): int
    {
        return $order->status->isPaid() ? max(0, $order->total_cents - $order->refunded_cents) : 0;
    }

    /** @throws RefundRefused */
    public function __invoke(Order $order, int $amountCents, string $reason, AdminUser $by): Refund
    {
        $order = $order->fresh() ?? $order;
        $left = self::refundable($order);

        if (! $order->status->isPaid()) {
            throw new RefundRefused(self::NOT_PAID);
        }

        if ($left === 0) {
            throw new RefundRefused(self::NOTHING_LEFT);
        }

        if ($amountCents > $left) {
            throw new RefundRefused(sprintf(self::TOO_MUCH, GermanFormat::money($left)));
        }

        $gateway = Payments::for((string) $order->getAttribute('payment_method'));

        if ($gateway === null) {
            throw new RefundRefused(self::NO_PROVIDER);
        }

        $attempt = Refund::query()->where('order_id', $order->id)->count() + 1;
        $key = sprintf('rmf-refund-%s-%d-%d', $order->order_number, $attempt, $amountCents);

        try {
            $result = $gateway->refund($order, $amountCents, $reason, $key);
        } catch (PaymentFailure $e) {
            AuditTrail::record($by, 'order.refund_refused', ['order' => $order->order_number, 'amount_cents' => $amountCents, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);

            throw new RefundRefused($e->customerMessage);
        }

        try {
            $refund = Refund::query()->create([
                'order_id' => $order->id,
                'provider' => (string) $order->getAttribute('payment_method'),
                'provider_refund_id' => $result->id,
                'amount_cents' => $result->amountCents,
                'currency' => (string) ($order->getAttribute('currency') ?? 'EUR'),
                'reason' => mb_substr($reason, 0, 500),
                'status' => in_array($result->status, ['pending', 'succeeded', 'failed', 'canceled', 'requires_action'], true) ? $result->status : 'pending',
                'requested_by' => $by->id,
            ]);
        } catch (UniqueConstraintViolationException) {
            // The same press twice: the provider answered with the refund it had already made.
            return Refund::query()->where('provider_refund_id', $result->id)->firstOrFail();
        }

        AuditTrail::record($by, 'order.refunded', [
            'order' => $order->order_number,
            'amount_cents' => $refund->amount_cents,
            'status' => $refund->status,
            'refund' => $refund->provider_refund_id,
            'reason' => $refund->reason,
        ], $order);

        if ($refund->status !== 'succeeded') {
            return $refund;
        }

        $this->payments->refunded($order, $order->refunded_cents + $refund->amount_cents, $by->email, null);

        try {
            $note = $this->invoices->creditNote($order, $refund);
            $refund->forceFill(['credit_note_id' => $note->id])->save();
            $email = $order->customer?->email;

            if (is_string($email) && $email !== '') {
                Mail::to($email)->send(new RefundMail($order->fresh() ?? $order, $refund, $note));
            }
        } catch (Throwable $e) {
            // The money went back; the paper can be issued again. Said in the Protokoll, never undone.
            report($e);
            AuditTrail::system('System', 'order.refund_paper_failed', ['order' => $order->order_number, 'error' => mb_substr($e->getMessage(), 0, 250)], $order);
        }

        return $refund;
    }
}
