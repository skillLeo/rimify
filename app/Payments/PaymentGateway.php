<?php

declare(strict_types=1);

namespace App\Payments;

use App\Models\Dispute;
use App\Models\Order;
use App\Models\PaymentEvent;

/**
 * How an order is paid: one driver per provider behind this one contract, chosen by `rimify.payments.driver`
 * (Payments::gateway). Until a provider is configured the shop takes no orders; where the review is on, the
 * SandboxGateway lets a test order run the whole way without money moving. Nothing outside a driver knows its
 * provider: the checkout, the webhook route, the refund on the order page and the expiry run all speak this.
 *
 * An order becomes paid only by the provider's signed webhook (handleWebhook → ProcessPaymentEvent), never by a
 * browser arriving at the return address.
 */
interface PaymentGateway
{
    /** The value an order's `payment_method` carries: `sandbox`, `stripe`, … */
    public function method(): string;

    /**
     * Where the browser goes to pay this order — the sandbox's own page — or null where the checkout page confirms
     * the payment itself with the handle from authorize() (Stripe's Payment Element).
     */
    public function start(Order $order): ?string;

    /**
     * The provider's payment for this order at its total, created once: a second call for the same order (a
     * double click, a reload) returns the same payment, never a second one.
     *
     * @throws PaymentFailure
     */
    public function authorize(Order $order): PaymentIntentHandle;

    /** Takes an authorised payment where the provider holds it for capture; nothing where it captures itself. */
    public function capture(Order $order): void;

    /** @throws PaymentFailure */
    public function refund(Order $order, int $amountCents, string $reason, string $idempotencyKey): RefundResult;

    /** The provider's own word for the payment's state (`succeeded`, `processing`, …), or null without one. */
    public function status(Order $order): ?string;

    /** Stops an unpaid payment so it can no longer be paid (the 24-hour expiry). False where it had already moved on. */
    public function cancel(Order $order): bool;

    /**
     * A webhook as it arrived: its signature verified, stored raw under the provider's event id (a repeat is a
     * no-op), its work queued. Throws on a bad signature — nothing is stored then.
     *
     * @throws WebhookRejected
     */
    public function handleWebhook(string $payload, ?string $signature): WebhookReceipt;

    /** What a stored event means for an order, in the shop's words — or null for an event the shop does not act on. */
    public function translate(PaymentEvent $event): ?PaymentSignal;

    /** „Verbindung testen“: the account behind the keys, or the provider's own error. */
    public function account(): PaymentAccount;

    /**
     * Answers a chargeback with the shop's evidence and submits it: the explanation, and files by the field the
     * provider files them under (`receipt`, `shipping_documentation`, `uncategorized_file`).
     *
     * @param  list<array{field: string, path: string, name: string}>  $files  local paths on the private disk
     *
     * @throws PaymentFailure
     */
    public function submitEvidence(Dispute $dispute, string $text, array $files): void;
}
