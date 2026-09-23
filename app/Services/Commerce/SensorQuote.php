<?php

declare(strict_types=1);

namespace App\Services\Commerce;

/**
 * What one RDKS sensor costs for one car, and where that figure came from
 * (docs/specs/komplettrad.md §13, D-030).
 *
 * The client asked for a default price with per-make exceptions on top: a Porsche sensor costs
 * several times a Volkswagen one, but most makes are the ordinary price and nobody wants to type a
 * row for each of them. So the quote answers from the make's own row where there is one, and from
 * the default otherwise — and says which, because the two behave differently afterwards.
 *
 * `priceId` is the id of the per-make row, or null when the default answered. It is what
 * `order_lines.tpms_sensor_price_id` freezes and what `Basket::tpmsQuoteChanged()` compares: a
 * customer quoted the default and then billed from a newly-entered Porsche row would be billed a
 * figure they never saw, so that counts as a changed quote exactly like a changed number does.
 */
final readonly class SensorQuote
{
    public function __construct(
        /** Per sensor, never per set. Always ≥ 1 — a free sensor is not a price we can state. */
        public int $priceCents,
        public string $currency,
        /** The make as the bill will spell it: the admin's spelling from the row, else the vehicle's. */
        public string $makeLabelDe,
        /** The per-make row this came from, or null when the default answered for this make. */
        public ?int $priceId,
    ) {}

    /** Whether the default answered, rather than a row entered for this make. */
    public function fromDefault(): bool
    {
        return $this->priceId === null;
    }
}
