<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Models\BalanceWeightColour;
use App\Models\TpmsSensorPrice;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use UnexpectedValueException;

/**
 * The one place a Komplettrad is priced from its components, so the basket and the order writer
 * can never disagree (docs/specs/komplettrad.md §4.6).
 *
 * Every figure is integer cents read from the catalogue and the configuration on every call —
 * nothing here is cached and nothing is read from a session. Where a component has no confirmed
 * price the answer is null, never 0: an unconfigured mounting fee (D-032) and a make without an
 * RDKS sensor price both fail closed, and the caller says so in a sentence rather than charging
 * a number nobody confirmed (CLAUDE.md §2).
 */
final readonly class KomplettradPricer
{
    /**
     * What one wheel of this line costs. A null tyre is a Felgen-only line: the rim alone, with
     * no mounting and no weights. A Komplettrad without a colour is priced for display but is
     * never complete — the colour is the customer's choice and its absence is refused upstream.
     */
    public function perWheel(WheelConfig $config, ?TyreVariant $tyre, ?BalanceWeightColour $colour): KomplettradPrice
    {
        $isSet = $tyre !== null;
        $currency = $this->currencyOf($config->getAttribute('currency'));

        if ($tyre !== null && $this->currencyOf($tyre->getAttribute('currency')) !== $currency) {
            throw new UnexpectedValueException(sprintf(
                'Cannot price a Komplettrad across currencies: wheel config [%d] is in %s, tyre variant [%d] is not.',
                $config->getKey(),
                $currency,
                $tyre->getKey(),
            ));
        }

        if ($isSet && $colour !== null && $this->currencyOf($colour->getAttribute('currency')) !== $currency) {
            throw new UnexpectedValueException(sprintf(
                'Cannot price a Komplettrad across currencies: wheel config [%d] is in %s, weight colour [%d] is not.',
                $config->getKey(),
                $currency,
                $colour->getKey(),
            ));
        }

        return new KomplettradPrice(
            wheelCents: $config->price_cents,
            tyreCents: $isSet ? $tyre->price_cents : 0,
            mountingCents: $isSet ? $this->mountingPerWheelCents() : null,
            weightsCents: $isSet && $colour !== null ? $colour->surcharge_cents : 0,
            isSet: $isSet,
            weightsPriced: ! $isSet || $colour !== null,
            currency: $currency,
        );
    }

    /**
     * The active RDKS sensor price for this car make, per sensor (D-030), or null when the make is
     * empty, unknown or has no active row. Null is the whole answer: the checkout offers no sensor
     * for that make and says why. Both the basket total and the order writer read the row through
     * here, so a price change between the two is one they can see (§5.3).
     */
    public function sensorFor(?string $make): ?TpmsSensorPrice
    {
        return TpmsSensorPrice::forMake($make);
    }

    /**
     * The configured mounting-and-balancing fee per wheel, or null while the client has not named
     * one (D-032). Anything but a non-negative integer is unconfigured, never a guess.
     */
    private function mountingPerWheelCents(): ?int
    {
        $fee = config('rimify.komplettrad.mounting_per_wheel_cents');

        return is_int($fee) && $fee >= 0 ? $fee : null;
    }

    private function currencyOf(mixed $value): string
    {
        return is_string($value) && $value !== '' ? $value : 'EUR';
    }
}
