<?php

declare(strict_types=1);

namespace App\Services\Commerce;

/**
 * What one wheel of a line costs, component by component, in integer cents.
 *
 * Per WHEEL, never per set: the caller multiplies by the line quantity, exactly as the basket
 * already does with `wheel_configs.price_cents` (docs/specs/komplettrad.md §4.6). A Felgen-only
 * line is the rim alone — `tyreCents` and `weightsCents` are 0 and there is no mounting to price.
 *
 * A component whose price nobody has confirmed is not a component that costs nothing. The mounting
 * fee is null while `rimify.komplettrad.mounting_per_wheel_cents` is unconfigured (D-032), and a
 * Komplettrad priced without a Wuchtgewichte colour has no weights price at all. Both leave
 * `complete()` false: the sum of the known components may be shown as such, but it is never the
 * price of the Komplettrad and never billed (CLAUDE.md §2).
 */
final readonly class KomplettradPrice
{
    public function __construct(
        public int $wheelCents,
        /** 0 for a Felgen-only line. */
        public int $tyreCents,
        /** Null while the mounting fee is unconfigured, and null on a Felgen-only line, which has no mounting. */
        public ?int $mountingCents,
        /** The colour's surcharge per wheel, 0 by default (D-031); 0 for a Felgen-only line. */
        public int $weightsCents,
        public bool $isSet,
        /** False only for a Komplettrad priced without a colour: its weights have no price, not a price of 0. */
        public bool $weightsPriced,
        /** ISO 4217, upper case. EUR throughout; a mismatch between components is refused by the pricer. */
        public string $currency = 'EUR',
    ) {}

    /** Sum of the KNOWN components. An unconfigured mounting fee is left out, never guessed. */
    public function knownPerWheelCents(): int
    {
        return $this->wheelCents + $this->tyreCents + ($this->mountingCents ?? 0) + $this->weightsCents;
    }

    /** False while a component of a Komplettrad has no price yet. A Felgen-only line is always complete. */
    public function complete(): bool
    {
        if (! $this->isSet) {
            return true;
        }

        return $this->mountingCents !== null && $this->weightsPriced;
    }
}
