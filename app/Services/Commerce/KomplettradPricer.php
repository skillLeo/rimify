<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Models\BalanceWeightColour;
use App\Models\TpmsSensorPrice;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Support\MakeName;
use UnexpectedValueException;

/**
 * The one place a Komplettrad is priced from its components, so the basket and the order writer
 * can never disagree (docs/specs/komplettrad.md §4.6).
 *
 * Every figure is integer cents read from the catalogue and the admin's own settings on every call
 * — nothing here is read from a session. Where a component has no confirmed price the answer is
 * null, never 0: an unset mounting fee (D-032) and a make with neither its own sensor row nor a
 * default (D-030) both fail closed, and the caller says so in a sentence rather than charging a
 * number nobody confirmed (CLAUDE.md §2).
 */
final readonly class KomplettradPricer
{
    public function __construct(private KomplettradSettings $settings) {}

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
     * What one RDKS sensor costs for this car make (D-030): the make's own row where the admin
     * entered one, the default price otherwise, and null when there is neither — or when there is
     * no usable make at all. Null is the whole answer: the checkout offers no sensor and says why.
     *
     * Both the basket total and the order writer read it through here, so a price that moves
     * between the quote and the submission is one they can see (§5.3).
     */
    public function sensorFor(?string $make): ?SensorQuote
    {
        $row = TpmsSensorPrice::forMake($make);

        if ($row !== null) {
            return new SensorQuote(
                priceCents: $row->price_cents,
                currency: $this->currencyOf($row->getAttribute('currency')),
                makeLabelDe: $row->make_label_de,
                priceId: (int) $row->getKey(),
            );
        }

        $default = $this->settings->tpmsDefaultCents();

        // A default of zero would say the sensors are free, which is not a price anybody set; it is
        // refused at the admin field and read as unset here too.
        if ($default === null || $default < 1 || $make === null || MakeName::key($make) === '') {
            return null;
        }

        return new SensorQuote(
            priceCents: $default,
            // The default is stated in the shop's own currency; there is no row to carry another.
            currency: 'EUR',
            // No admin spelling exists for this make, so the vehicle's own is what the bill says.
            makeLabelDe: MakeName::normalise($make),
            priceId: null,
        );
    }

    /**
     * The mounting-and-balancing fee per wheel the admin set, or null while nobody has named one
     * (D-032). Anything but a non-negative integer is unset, never a guess.
     */
    private function mountingPerWheelCents(): ?int
    {
        return $this->settings->mountingPerWheelCents();
    }

    private function currencyOf(mixed $value): string
    {
        return is_string($value) && $value !== '' ? $value : 'EUR';
    }
}
