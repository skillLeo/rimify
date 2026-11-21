<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\PapersIndex;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\FixedClock;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryTyreCatalogue;
use Tests\Support\Fitment\InMemoryVehicleRepository;

/*
 * D-481 — the client's message of 19.11.2026: „Remove all validation logic for load and speed indices … we will manually ensure
 * that the combinations are valid.“ R-03 and R-06 as amended on 21.11.2026, on the operator's written authority.
 *
 * Nothing about a tyre is derived from the car any more: not from its axle loads, not from its top speed, not from ETRTO's
 * table, not from the customer's own papers. What stays is the paper's own word: the sizes it permits, matched exactly; the
 * figures it prints beside a size, which a tyre offered must meet — a symbol the shop cannot rank matched exactly, never
 * guessed —; its Auflagen about tyres, said to the customer. And two things about the wheel's own approval stay fail-closed:
 * a document that limits it by axle load on a car whose load is unknown (D-289), a combination listed for no type of the car.
 */

/** A car the way the client's dataset gives one, or without any figure. */
function printedCar(?int $front = 1210, ?int $rear = 1235, ?int $speed = 280, ?PapersIndex $papers = null): VehicleRecord
{
    return new VehicleRecord(
        id: 81, hsn: '1860', tsn: 'AAS', vsn: null,
        make: 'Audi', model: 'RS 4', variant: 'RS 4 Avant Quattro', typeDesignation: 'B9',
        buildWindow: BuildWindow::unbounded(),
        axleLoadFrontKg: $front, axleLoadRearKg: $rear, maxSpeedKmh: $speed,
        powerKw: 331, bodyForm: 'Kombi', driveAxle: 'Allrad',
        needsReview: $front === null || $rear === null || $speed === null,
        papersIndex: $papers,
    );
}

function printedWheel(float $diameter = 22.5): WheelConfigRecord
{
    return new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 23, wheelFinishId: 44,
        diameterIn: $diameter, widthIn: 9.0, etMm: 35, boltHoles: 10, boltCircleMm: 335.0, centreBoreMm: 281.0,
        priceCents: 0, stockQty: 0,
    );
}

/**
 * @param  list<TyreSize>  $sizes
 * @param  list<Condition>  $conditions
 */
function printedVerdict(VehicleRecord $car, array $sizes, array $conditions = [], ?int $axleLimitKg = null, float $diameter = 22.5): FitmentVerdict
{
    $document = new DocumentRecord(id: 91, kind: 'TEILEGUTACHTEN', number: '366-0350-22', revision: 1, completeness: DocumentRecord::COMPLETE, axleLimitKg: $axleLimitKg);

    return (new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([$car]),
        fitments: new InMemoryFitmentRepository([FitmentFixtures::row(vehicleId: $car->id, sizes: $sizes, conditions: $conditions, document: $document)], [printedWheel($diameter)]),
        speedSymbol: new SpeedSymbolDeriver(FitmentFixtures::tables()),
        clock: new FixedClock,
    ))->resolve($car->id, FitmentFixtures::WHEEL_CONFIG_ID);
}

function printedTyre(int $id, int $width, int $aspect, float $diameter, int $loadIndex, string $symbol): TyreRecord
{
    return new TyreRecord(
        id: $id, widthMm: $width, aspect: $aspect, diameterIn: $diameter, loadIndex: $loadIndex, speedSymbol: $symbol,
        speedRank: FitmentFixtures::tables()->speedSymbol($symbol)?->rank ?? 0, priceCents: 40_000, sellable: true,
        brandName: 'Demo', name: 'Fernverkehr', season: 'sommer',
    );
}

function printedEligibility(TyreRecord ...$tyres): TyreEligibility
{
    return new TyreEligibility(new InMemoryTyreCatalogue(array_values($tyres)), new SpeedSymbolDeriver(FitmentFixtures::tables()));
}

it('answers the tyres from the paper alone: a car without axle loads or top speed is no longer „Noch nicht bestätigt“', function (): void {
    $verdict = printedVerdict(printedCar(null, null, null), [new TyreSize(305, 70, 22.5, 160, 'F')]);

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->tyre?->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->tyre?->papersOwed)->toBe([])
        ->and($verdict->front->minLoadIndex)->toBe(160)
        ->and($verdict->front->minSpeedSymbol)->toBe('F')
        ->and($verdict->front->minLoadSource)->toBe(MinSource::Document)
        ->and($verdict->tyre?->summary)->toBe('Laut Gutachten mindestens Tragfähigkeitsindex 160, Geschwindigkeitsindex F.');
});

it('derives nothing from a fast, heavy car: the paper\'s 91Y stands where the old sum asked for more', function (): void {
    // 1.235 kg at 280 km/h asked for LI 95 under ETRTO (D-459); the paper prints 91Y.
    $verdict = printedVerdict(printedCar(1210, 1235, 280), [new TyreSize(255, 35, 19.0, 91, 'Y')], diameter: 19.0);

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and([$verdict->front->minLoadIndex, $verdict->front->minSpeedSymbol])->toBe([91, 'Y'])
        ->and([$verdict->rear->minLoadIndex, $verdict->rear->minSpeedSymbol])->toBe([91, 'Y'])
        ->and(implode(' ', $verdict->tyre?->lines ?? []))->not->toContain('kg');
});

it('states no minimum where the paper prints none, and offers every tyre of exactly that size', function (): void {
    $verdict = printedVerdict(printedCar(), [new TyreSize(235, 50, 18.0)], diameter: 18.0);
    $offer = printedEligibility(
        printedTyre(1, 235, 50, 18.0, 70, 'Q'),
        printedTyre(2, 235, 50, 18.0, 104, 'Y'),
        printedTyre(3, 235, 55, 18.0, 104, 'Y'),
    )->offerFor($verdict);

    expect([$verdict->front->minLoadIndex, $verdict->front->minSpeedSymbol])->toBe([null, null])
        ->and($verdict->tyre?->summary)->toBeNull()
        ->and($offer->refusal)->toBeNull()
        ->and(array_map(static fn (TyreRecord $t): int => $t->id, $offer->tyres))->toEqualCanonicalizing([1, 2]);
});

it('offers a tyre that meets the paper\'s figures — ranked, never compared as letters — and refuses one below them', function (): void {
    $verdict = printedVerdict(printedCar(), [new TyreSize(225, 40, 18.0, 88, 'W')], diameter: 18.0);
    $eligibility = printedEligibility();

    expect($eligibility->permits($verdict, printedTyre(1, 225, 40, 18.0, 88, 'W')))->toBeNull()
        ->and($eligibility->permits($verdict, printedTyre(2, 225, 40, 18.0, 92, 'Y')))->toBeNull()
        ->and($eligibility->permits($verdict, printedTyre(3, 225, 40, 18.0, 87, 'Y')))->toBe(KomplettradRefusal::BelowMinimum)
        // H (210 km/h) is below W, though it comes after W in the alphabet's order nowhere and before V in the table's.
        ->and($eligibility->permits($verdict, printedTyre(4, 225, 40, 18.0, 92, 'H')))->toBe(KomplettradRefusal::BelowMinimum)
        // The exact size: a 225/45 is not a 225/40.
        ->and($eligibility->permits($verdict, printedTyre(5, 225, 45, 18.0, 92, 'Y')))->toBe(KomplettradRefusal::SizeNotPermitted);
});

it('matches a symbol the shop cannot rank exactly — F is F, never guessed above or below', function (): void {
    $verdict = printedVerdict(printedCar(), [new TyreSize(305, 70, 22.5, 160, 'F')]);
    $eligibility = printedEligibility();

    expect($eligibility->permits($verdict, printedTyre(1, 305, 70, 22.5, 160, 'F')))->toBeNull()
        ->and($eligibility->permits($verdict, printedTyre(2, 305, 70, 22.5, 160, 'f')))->toBeNull()
        ->and($eligibility->permits($verdict, printedTyre(3, 305, 70, 22.5, 164, 'G')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and($eligibility->permits($verdict, printedTyre(4, 305, 70, 22.5, 160, 'Y')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and($eligibility->permits($verdict, printedTyre(5, 305, 70, 22.5, 158, 'F')))->toBe(KomplettradRefusal::BelowMinimum);
});

it('says a load-index Auflage to the customer and keeps it CONDITIONAL — it computes nothing and stops no offer', function (): void {
    $auflage = Condition::ofKind('T91', ConditionKind::ReifenTragfaehigkeit, 'Reifen mit Tragfähigkeitsindex 91 sind nur bis zu einer zulässigen Achslast von 1.230 kg zulässig.', null, 6, 1230);
    $verdict = printedVerdict(printedCar(1210, 1235, 280), [new TyreSize(255, 35, 19.0, 91, 'Y')], [$auflage], diameter: 19.0);
    $offer = printedEligibility(printedTyre(1, 255, 35, 19.0, 91, 'Y'))->offerFor($verdict);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->conditions)->toContain($auflage)
        ->and([$verdict->rear->minLoadIndex])->toBe([91])
        ->and($offer->refusal)->toBeNull()
        ->and(array_map(static fn (TyreRecord $t): int => $t->id, $offer->tyres))->toBe([1]);
});

it('takes nothing from the customer\'s own papers either: field 15.1 neither raises nor stands for the paper', function (): void {
    $papers = PapersIndex::tryFrom(99, 'Y', 99, 'Y');
    expect($papers)->not->toBeNull();
    $verdict = printedVerdict(printedCar(papers: $papers), [new TyreSize(255, 35, 19.0, 91, 'W')], diameter: 19.0);

    expect([$verdict->front->minLoadIndex, $verdict->front->minSpeedSymbol])->toBe([91, 'W'])
        ->and($verdict->front->minLoadSource)->toBe(MinSource::Document);
});

it('still keeps the wheel fail-closed where its document limits it by axle load and the car\'s is unknown (D-289)', function (): void {
    $verdict = printedVerdict(printedCar(null, null, 250), [new TyreSize(255, 35, 19.0, 91, 'Y')], axleLimitKg: 1160, diameter: 19.0);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->tyre?->papersOwed)->toBe(['8.1', '8.2'])
        ->and($verdict->isSellable())->toBeFalse();

    // Known, it is no longer asked: the paper decides the rest.
    expect(printedVerdict(printedCar(1100, 1150, 250), [new TyreSize(255, 35, 19.0, 91, 'Y')], axleLimitKg: 1160, diameter: 19.0)->status)
        ->toBe(VerdictStatus::Permitted);
});

it('keeps each size its own printed figures beside the axle\'s strictest (D-431)', function (): void {
    $verdict = printedVerdict(printedCar(), [new TyreSize(225, 40, 18.0, 88, 'W'), new TyreSize(235, 40, 18.0, 92, 'Y')], diameter: 18.0);

    expect([$verdict->front->minLoadIndex, $verdict->front->minSpeedSymbol])->toBe([92, 'Y'])
        ->and($verdict->front->minimumFor(new TyreSize(225, 40, 18.0)))->toBe(['loadIndex' => 88, 'speedSymbol' => 'W'])
        ->and(printedEligibility()->permits($verdict, printedTyre(1, 225, 40, 18.0, 88, 'W')))->toBeNull();
});
