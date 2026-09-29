<?php

declare(strict_types=1);

namespace App\Payments;

/**
 * What a provider's event means for an order, in the shop's words — the driver translates its own vocabulary
 * (Stripe's `payment_intent.succeeded`, `charge.dispute.created`, …) into this, and OrderPayments acts on it.
 * Nothing outside a driver reads a provider's event.
 */
final readonly class PaymentSignal
{
    public const PROCESSING = 'processing';

    public const SUCCEEDED = 'succeeded';

    public const FAILED = 'failed';

    public const CANCELED = 'canceled';

    public const REFUNDED = 'refunded';

    public const DISPUTE_OPENED = 'dispute_opened';

    public const DISPUTE_CLOSED = 'dispute_closed';

    /**
     * @param  array{id: string, charge: string|null, reason: string, amountCents: int, currency: string, status: string, dueBy: int|null, outcome: string|null}|null  $dispute
     */
    public function __construct(
        public string $kind,
        public ?string $paymentId,
        public ?int $orderId = null,
        public ?int $amountCents = null,
        public ?string $currency = null,
        public ?int $refundedCents = null,
        public ?string $message = null,
        public ?array $dispute = null,
    ) {}
}
