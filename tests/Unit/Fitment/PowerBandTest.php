<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\FixedClock;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryVehicleRepository;

/**
 * Block D; the Borbet brief §2.6: the kW band a Gutachten prints beside a tyre size. ABE 55255, page 2 —
 * BMW 1er-Reihe 187: 215/35R19 at 85–125 kW, 225/35R19 and 235/35R19 at 85–195 kW. A size is offered only
 * for a car whose power its band covers; where the power is not known, the verdict says which band to
 * compare with field P.2 and is never PERMITTED.
 */
function bmw1er187(?int $powerKw): VehicleRecord
{
    return new VehicleRecord(
        id: 187, hsn: null, tsn: null, vsn: null,
        make: 'BMW', model: '1er-Reihe', variant: '187', typeDesignation: '187',
        buildWindow: BuildWindow::unbounded(),
        axleLoadFrontKg: 900, axleLoadRearKg: 1000, maxSpeedKmh: 200,
        powerKw: $powerKw,
    );
}

/** The row as ABE 55255 prints it on page 2, three of its sizes. */
function banded(VehicleRecord $vehicle): FitmentVerdict
{
    $tables = FitmentFixtures::tables();
    $row = FitmentFixtures::row(vehicleId: $vehicle->id, sizes: [
        new TyreSize(215, 35, 19.0, kwMin: 85, kwMax: 125),
        new TyreSize(225, 35, 19.0, kwMin: 85, kwMax: 195),
        new TyreSize(235, 35, 19.0, kwMin: 85, kwMax: 195),
    ]);

    return (new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([$vehicle]),
        fitments: new InMemoryFitmentRepository([$row], [FitmentFixtures::wheel()]),
        loadIndex: new LoadIndexDeriver($tables),
        speedSymbol: new SpeedSymbolDeriver($tables),
        clock: new FixedClock,
    ))->resolve($vehicle->id, FitmentFixtures::WHEEL_CONFIG_ID);
}

/** @return list<string> */
function sizeLabels(FitmentVerdict $verdict): array
{
    return array_map(static fn (TyreSize $s): string => $s->key(), $verdict->front->sizes);
}

it('offers only the sizes whose band covers the car’s power', function (): void {
    expect(sizeLabels(banded(bmw1er187(110))))->toBe(['215/35/19', '225/35/19', '235/35/19'])
        ->and(sizeLabels(banded(bmw1er187(150))))->toBe(['225/35/19', '235/35/19'])
        // The band's own ends belong to it.
        ->and(sizeLabels(banded(bmw1er187(125))))->toBe(['215/35/19', '225/35/19', '235/35/19'])
        ->and(sizeLabels(banded(bmw1er187(195))))->toBe(['225/35/19', '235/35/19']);
});

it('refuses the wheel when no size’s band covers the car', function (): void {
    $verdict = banded(bmw1er187(240));

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->front->sizes)->toBe([]);
});

it('never answers PERMITTED while the power is unknown, and names each band with field P.2', function (): void {
    $verdict = banded(bmw1er187(null));
    $sentences = array_map(static fn ($c): string => $c->sentenceDe(), $verdict->conditions);

    expect($verdict->wheelStatus)->toBe(VerdictStatus::Conditional)
        ->and($verdict->status)->not->toBe(VerdictStatus::Permitted)
        ->and($sentences)->toContain('215/35 R19 ist laut Gutachten nur für Fahrzeuge mit 85–125'."\u{00A0}".'kW zugelassen. Vergleiche das mit der Leistung in Feld P.2 deiner Zulassungsbescheinigung (im alten Fahrzeugschein Ziffer 7).')
        ->and($sentences)->toContain('225/35 R19 und 235/35 R19 sind laut Gutachten nur für Fahrzeuge mit 85–195'."\u{00A0}".'kW zugelassen. Vergleiche das mit der Leistung in Feld P.2 deiner Zulassungsbescheinigung (im alten Fahrzeugschein Ziffer 7).');
});

it('reads the band against P.2 from the customer’s papers where the vehicle data has no power, and never over it', function (): void {
    $typed = PapersFigures::tryFrom(900, 1000, 200, 150);

    expect($typed)->not->toBeNull()
        ->and(sizeLabels(banded($typed?->applyTo(bmw1er187(null)) ?? bmw1er187(null))))->toBe(['225/35/19', '235/35/19'])
        // The data knows 110 kW: a P.2 of 150 is the wrong variant chosen, not a figure to answer with.
        ->and(sizeLabels(banded($typed?->applyTo(bmw1er187(110)) ?? bmw1er187(110))))->toBe(['215/35/19', '225/35/19', '235/35/19']);
});

it('keeps the band in the frozen verdict', function (): void {
    $size = new TyreSize(215, 35, 19.0, kwMin: 85, kwMax: 125);
    $back = TyreSize::fromArray($size->toArray());

    expect($back->kwMin)->toBe(85)
        ->and($back->kwMax)->toBe(125)
        ->and($back->powerBandDe())->toBe('85–125'."\u{00A0}".'kW')
        // A snapshot frozen before the band reads without one.
        ->and(TyreSize::fromArray(['width' => 215, 'aspect' => 35, 'diameter' => 19])->hasPowerBand())->toBeFalse();
});
