<?php

declare(strict_types=1);

namespace App\Payments;

/** What the provider answered to a refund: its id, its state (`succeeded`, `pending`, …) and the amount it took. */
final readonly class RefundResult
{
    public function __construct(
        public string $id,
        public string $status,
        public int $amountCents,
    ) {}
}
