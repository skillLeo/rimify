<?php

declare(strict_types=1);

namespace App\Payments\Stripe;

use Stripe\Invoice;

/**
 * An invoice Stripe has issued, as the shop's daily copy needs it (D-361) — read off the SDK's object here, in the
 * driver, so nothing outside app/Payments/Stripe names Stripe's own types (StripeOnlyInItsDriverTest).
 */
final readonly class IssuedInvoice
{
    public function __construct(
        public string $id,
        public ?string $number,
        public ?string $orderNumber,
        /** In cents. */
        public int $total,
        public string $currency,
        /** Unix seconds. */
        public int $created,
        public ?string $pdfUrl,
    ) {}

    public static function of(Invoice $invoice): self
    {
        $orderNumber = $invoice->metadata['order_number'] ?? null;
        $pdf = $invoice->invoice_pdf ?? null;

        return new self(
            id: (string) $invoice->id,
            number: is_string($invoice->number) ? $invoice->number : null,
            orderNumber: is_string($orderNumber) ? $orderNumber : null,
            total: (int) $invoice->total,
            currency: (string) $invoice->currency,
            created: (int) $invoice->created,
            pdfUrl: is_string($pdf) && $pdf !== '' ? $pdf : null,
        );
    }
}
