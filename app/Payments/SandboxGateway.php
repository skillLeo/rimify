<?php

declare(strict_types=1);

namespace App\Payments;

use App\Models\Dispute;
use App\Models\Order;
use App\Models\PaymentEvent;
use Illuminate\Support\Facades\URL;

/**
 * A payment that is not one: the review's test orders (the review release §1) run checkout, snapshot and
 * Verkauf end to end, and the customer chooses the outcome on a page that says what it is — bezahlt, abgelehnt,
 * abgebrochen. No money moves and no provider is asked; a refund of a test order is only written down.
 *
 * Only where the review is on (Payments::gateway): the live shop never gets it.
 */
final class SandboxGateway implements PaymentGateway
{
    /** How long the test payment page stays valid for its order. */
    public const MINUTES = 30;

    public function method(): string
    {
        return 'sandbox';
    }

    public function start(Order $order): string
    {
        return URL::temporarySignedRoute('kasse.testzahlung', now()->addMinutes(self::MINUTES), ['order' => $order->order_number]);
    }

    public function authorize(Order $order): PaymentIntentHandle
    {
        return new PaymentIntentHandle('sandbox_'.$order->order_number, null, $order->total_cents, 'EUR', 'requires_payment_method');
    }

    public function capture(Order $order): void {}

    public function refund(Order $order, int $amountCents, string $reason, string $idempotencyKey): RefundResult
    {
        return new RefundResult('sandbox_refund_'.substr(hash('sha256', $idempotencyKey), 0, 16), 'succeeded', $amountCents);
    }

    public function status(Order $order): ?string
    {
        return null;
    }

    public function cancel(Order $order): bool
    {
        return true;
    }

    public function handleWebhook(string $payload, ?string $signature): WebhookReceipt
    {
        throw new WebhookRejected('The sandbox receives no webhooks.');
    }

    public function translate(PaymentEvent $event): ?PaymentSignal
    {
        return null;
    }

    public function account(): PaymentAccount
    {
        return PaymentAccount::failed('Die Testzahlung hat kein Konto.');
    }

    /** A test order has no chargeback to answer; the evidence is kept on the shop's side only. */
    public function submitEvidence(Dispute $dispute, string $text, array $files): void {}
}
