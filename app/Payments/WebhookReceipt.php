<?php

declare(strict_types=1);

namespace App\Payments;

use App\Models\PaymentEvent;

/** A webhook received: its stored row, and whether it was new (a repeated delivery is not processed again). */
final readonly class WebhookReceipt
{
    public function __construct(
        public PaymentEvent $event,
        public bool $new,
    ) {}
}
