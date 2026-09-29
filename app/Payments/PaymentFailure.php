<?php

declare(strict_types=1);

namespace App\Payments;

use RuntimeException;

/**
 * The provider refused or could not be reached. `providerMessage` is its own text, for the admin and the log; the
 * customer is told a German sentence (`customerMessage`), never the provider's English.
 */
final class PaymentFailure extends RuntimeException
{
    public function __construct(public readonly string $providerMessage, public readonly string $customerMessage = 'Die Zahlung konnte gerade nicht vorbereitet werden. Es wurde nichts abgebucht – versuch es gleich noch einmal.')
    {
        parent::__construct($providerMessage);
    }
}
