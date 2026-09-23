<?php

declare(strict_types=1);

use App\Models\BalanceWeightColour;
use App\Models\TpmsSensorPrice;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Services\Commerce\KomplettradPrice;
use App\Services\Commerce\KomplettradPricer;
use App\Services\Commerce\KomplettradSettings;
use App\Services\Commerce\SensorQuote;

/*
 * One helper prices a Komplettrad from its components, for the basket and the order writer alike
 * (docs/specs/komplettrad.md §4.6, §2.7). Everything is integer cents; a component with no
 * confirmed price — the mounting fee while D-032 is open, the RDKS sensor for a make the admin has
 * not entered — is null and leaves the price incomplete. Nothing is guessed and nothing is a
 * silent 0,00 € (CLAUDE.md §2).
 */

beforeEach(function (): void {
    config([
        'rimify.komplettrad.mounting_per_wheel_cents' => null,
        // No default sensor price unless a case sets one: every answer below has to come from a row.
        'rimify.komplettrad.tpms_default_price_cents' => null,
    ]);
});

function pricer(): KomplettradPricer
{
    return app(KomplettradPricer::class);
}

function pricedWheel(int $cents = 89_900): WheelConfig
{
    return WheelConfig::factory()->create(['price_cents' => $cents, 'currency' => 'EUR']);
}

function pricedTyre(int $cents = 14_900): TyreVariant
{
    return TyreVariant::factory()->create(['price_cents' => $cents, 'currency' => 'EUR']);
}

describe('the configuration', function (): void {
    it('ships the mounting fee as null until the client names one (D-032)', function (): void {
        // The value the application boots with, before this file's beforeEach overrides it.
        $config = require base_path('config/rimify.php');

        expect($config)->toHaveKey('komplettrad')
            ->and($config['komplettrad'])->toHaveKey('mounting_per_wheel_cents')
            ->and($config['komplettrad']['mounting_per_wheel_cents'])->toBeNull();
    });
});

describe('a Felgen-only line', function (): void {
    it('is the rim alone, complete even while the mounting fee is unconfigured', function (): void {
        $price = pricer()->perWheel(pricedWheel(89_900), null, null);

        expect($price)->toBeInstanceOf(KomplettradPrice::class)
            ->and($price->wheelCents)->toBe(89_900)
            ->and($price->tyreCents)->toBe(0)
            ->and($price->mountingCents)->toBeNull()
            ->and($price->weightsCents)->toBe(0)
            ->and($price->isSet)->toBeFalse()
            ->and($price->weightsPriced)->toBeTrue()
            ->and($price->currency)->toBe('EUR')
            ->and($price->knownPerWheelCents())->toBe(89_900)
            ->and($price->complete())->toBeTrue();
    });

    it('ignores a colour: there are no Wuchtgewichte on a rim sold alone', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);
        $colour = BalanceWeightColour::factory()->withSurcharge(250)->create();

        $price = pricer()->perWheel(pricedWheel(89_900), null, $colour);

        expect($price->weightsCents)->toBe(0)
            ->and($price->mountingCents)->toBeNull()
            ->and($price->knownPerWheelCents())->toBe(89_900)
            ->and($price->complete())->toBeTrue();
    });
});

describe('a Komplettrad with every component priced', function (): void {
    it('sums rim, tyre, mounting and weights per wheel in integer cents', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);
        $colour = BalanceWeightColour::factory()->withSurcharge(250)->create();

        $price = pricer()->perWheel(pricedWheel(89_900), pricedTyre(14_900), $colour);

        expect($price->wheelCents)->toBe(89_900)
            ->and($price->tyreCents)->toBe(14_900)
            ->and($price->mountingCents)->toBe(1_900)
            ->and($price->weightsCents)->toBe(250)
            ->and($price->isSet)->toBeTrue()
            ->and($price->weightsPriced)->toBeTrue()
            ->and($price->currency)->toBe('EUR')
            ->and($price->knownPerWheelCents())->toBe(106_950)
            ->and($price->complete())->toBeTrue()
            // The caller multiplies by the quantity; four wheels stay integer cents.
            ->and($price->knownPerWheelCents() * 4)->toBe(427_800);
    });

    it('includes a 0-cent colour surcharge as 0, never omitted (D-031)', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);
        $colour = BalanceWeightColour::factory()->create();

        $price = pricer()->perWheel(pricedWheel(89_900), pricedTyre(14_900), $colour);

        expect($colour->surcharge_cents)->toBe(0)
            ->and($price->weightsCents)->toBe(0)
            ->and($price->weightsPriced)->toBeTrue()
            ->and($price->knownPerWheelCents())->toBe(106_700)
            ->and($price->complete())->toBeTrue();
    });

    it('treats a configured fee of zero as a price the client set, not as unconfigured', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 0]);

        $price = pricer()->perWheel(pricedWheel(), pricedTyre(), BalanceWeightColour::factory()->create());

        expect($price->mountingCents)->toBe(0)
            ->and($price->complete())->toBeTrue();
    });

    it('never rounds: every figure is the integer the catalogue holds', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1]);
        $colour = BalanceWeightColour::factory()->withSurcharge(1)->create();

        $price = pricer()->perWheel(pricedWheel(1_234_567), pricedTyre(89), $colour);

        expect($price->wheelCents)->toBeInt()->toBe(1_234_567)
            ->and($price->tyreCents)->toBeInt()->toBe(89)
            ->and($price->mountingCents)->toBeInt()->toBe(1)
            ->and($price->weightsCents)->toBeInt()->toBe(1)
            ->and($price->knownPerWheelCents())->toBeInt()->toBe(1_234_658);
    });
});

describe('an unconfigured mounting fee fails closed (D-032)', function (): void {
    it('leaves mounting null, out of the known sum, and the price incomplete', function (): void {
        $colour = BalanceWeightColour::factory()->withSurcharge(250)->create();

        $price = pricer()->perWheel(pricedWheel(89_900), pricedTyre(14_900), $colour);

        expect($price->mountingCents)->toBeNull()
            ->and($price->isSet)->toBeTrue()
            ->and($price->weightsPriced)->toBeTrue()
            // Rim, tyre and weights are known and summed; the fee is left out, not written as 0.
            ->and($price->knownPerWheelCents())->toBe(105_050)
            ->and($price->complete())->toBeFalse();
    });

    it('treats anything but a non-negative integer as unconfigured', function (mixed $configured): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => $configured]);

        $price = pricer()->perWheel(pricedWheel(), pricedTyre(), BalanceWeightColour::factory()->create());

        expect($price->mountingCents)->toBeNull()
            ->and($price->complete())->toBeFalse();
    })->with([
        'null' => [null],
        'empty string' => [''],
        'numeric string' => ['1900'],
        'float' => [19.0],
        'negative' => [-1],
        'boolean' => [true],
    ]);

    it('reads the configuration on every call, so a fee named later is priced without a restart', function (): void {
        $wheel = pricedWheel(89_900);
        $tyre = pricedTyre(14_900);
        $colour = BalanceWeightColour::factory()->create();

        expect(pricer()->perWheel($wheel, $tyre, $colour)->complete())->toBeFalse();

        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);

        $price = pricer()->perWheel($wheel, $tyre, $colour);

        expect($price->mountingCents)->toBe(1_900)
            ->and($price->complete())->toBeTrue();
    });
});

describe('a Komplettrad without a Wuchtgewichte colour', function (): void {
    it('has no weights price and is never complete, even with the mounting fee configured', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);

        $price = pricer()->perWheel(pricedWheel(89_900), pricedTyre(14_900), null);

        expect($price->isSet)->toBeTrue()
            ->and($price->weightsCents)->toBe(0)
            ->and($price->weightsPriced)->toBeFalse()
            ->and($price->mountingCents)->toBe(1_900)
            ->and($price->knownPerWheelCents())->toBe(106_700)
            ->and($price->complete())->toBeFalse();
    });
});

/*
 * The quote is a SensorQuote, not the row: with a default price in play the answer may come from
 * the make's own row or from the default, and `priceId` is what says which (§13, D-030). These
 * cases have no default set, so every answer here must come from a row or not at all.
 */
describe('the RDKS sensor price per make', function (): void {
    it('prices a sensor for a make the admin has entered, whatever the spelling of the make', function (): void {
        $vw = TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4_900]);
        TpmsSensorPrice::factory()->ofMake('porsche', 'Porsche')->create(['price_cents' => 18_900]);

        foreach (['VW', 'vw', 'Volkswagen', 'VOLKSWAGEN', ' volkswagen '] as $spelling) {
            $price = pricer()->sensorFor($spelling);

            expect($price)->toBeInstanceOf(SensorQuote::class, $spelling)
                ->and($price?->priceId)->toBe($vw->id, $spelling)
                ->and($price?->fromDefault())->toBeFalse($spelling)
                ->and($price?->priceCents)->toBe(4_900, $spelling)
                ->and($price?->makeLabelDe)->toBe('Volkswagen', $spelling)
                ->and($price?->currency)->toBe('EUR', $spelling);
        }

        // Porsche ≫ Volkswagen: the make decides the row, never the other way round.
        expect(pricer()->sensorFor('Porsche')?->priceCents)->toBe(18_900);
    });

    it('fails closed for a make with no sensor price: null, never a guess and never another make', function (): void {
        TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4_900]);

        expect(pricer()->sensorFor('Porsche'))->toBeNull()
            ->and(pricer()->sensorFor('Audi'))->toBeNull();
    });

    it('fails closed with no make at all', function (?string $make): void {
        TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4_900]);

        expect(pricer()->sensorFor($make))->toBeNull();
    })->with([
        'null' => [null],
        'empty' => [''],
        'blank' => ['   '],
        'punctuation only' => ['---'],
    ]);

    it('fails closed once the price is deactivated or deleted', function (): void {
        $vw = TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4_900]);

        $vw->update(['active' => false]);
        expect(pricer()->sensorFor('VW'))->toBeNull();

        $vw->update(['active' => true]);
        expect(pricer()->sensorFor('VW')?->priceId)->toBe($vw->id);

        $vw->delete();
        expect(pricer()->sensorFor('VW'))->toBeNull();
    });

    it('reads the table on every call, so a changed price is the price the next reader sees', function (): void {
        $vw = TpmsSensorPrice::factory()->ofMake('volkswagen', 'Volkswagen')->create(['price_cents' => 4_900]);

        expect(pricer()->sensorFor('VW')?->priceCents)->toBe(4_900);

        $vw->update(['price_cents' => 18_900]);

        // §5.3 compares this against the quote the customer was shown; a difference refuses the order.
        expect(pricer()->sensorFor('VW')?->priceCents)->toBe(18_900)
            ->and(pricer()->sensorFor('VW')?->priceId)->toBe($vw->id);
    });

    it('answers from the default for a make with no row, and from the row where there is one', function (): void {
        app(KomplettradSettings::class)->setTpmsDefaultCents(1_500);

        $porsche = TpmsSensorPrice::factory()->ofMake('porsche', 'Porsche')->create(['price_cents' => 5_000]);

        $default = pricer()->sensorFor('VW');
        $row = pricer()->sensorFor('Porsche');

        expect($default?->priceCents)->toBe(1_500)
            ->and($default?->priceId)->toBeNull()
            ->and($default?->fromDefault())->toBeTrue()
            // No admin spelling exists for a make nobody entered, so the vehicle's own is used —
            // normalised, not invented: `VW` stays `VW`, because that is what the catalogue says.
            ->and($default?->makeLabelDe)->toBe('VW')
            ->and(pricer()->sensorFor('volkswagen')?->makeLabelDe)->toBe('Volkswagen')
            ->and($row?->priceCents)->toBe(5_000)
            ->and($row?->priceId)->toBe($porsche->id);
    });
});

describe('currency', function (): void {
    it('travels with the figure and is EUR throughout', function (): void {
        config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);

        $price = pricer()->perWheel(pricedWheel(), pricedTyre(), BalanceWeightColour::factory()->create());

        expect($price->currency)->toBe('EUR');
    });

    it('refuses to add a tyre in another currency to a rim', function (): void {
        $wheel = pricedWheel();
        $tyre = TyreVariant::factory()->create(['price_cents' => 14_900, 'currency' => 'CHF']);

        expect(fn () => pricer()->perWheel($wheel, $tyre, BalanceWeightColour::factory()->create()))
            ->toThrow(UnexpectedValueException::class, 'across currencies');
    });

    it('refuses to add a colour surcharge in another currency to a Komplettrad', function (): void {
        $colour = BalanceWeightColour::factory()->withSurcharge(250)->create(['currency' => 'CHF']);

        expect(fn () => pricer()->perWheel(pricedWheel(), pricedTyre(), $colour))
            ->toThrow(UnexpectedValueException::class, 'across currencies');
    });
});
