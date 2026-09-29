<?php

declare(strict_types=1);

namespace App\Payments;

use SensitiveParameter;

/**
 * The provider's payment for one order, as the checkout needs it: its id, the secret the browser confirms it with
 * (null for the sandbox), the amount it is for — which the server set from the order, never the browser.
 */
final readonly class PaymentIntentHandle
{
    public function __construct(
        public string $id,
        #[SensitiveParameter] public ?string $clientSecret,
        public int $amountCents,
        public string $currency,
        public string $status,
    ) {}
}
