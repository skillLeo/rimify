<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\FixedClock;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryVehicleRepository;

/**
 * Block D: what the two Borbet documents print beside a row or a size, read as they print it.
 *
 * - Several body-style codes on one row are alternatives: ABE 55255 gives BMW 1er 182/1C „Cbo Cpe“ — a Cabrio
 *   or a Coupé, never a car that is both. Read as „all of them“, a Coupé would be refused a wheel its
 *   document permits.
 * - A code printed beside a size narrows that size, not the row: 390L's 225/35R19 on the rear is „Lim R03“,
 *   its other sizes „Car Lim“ — the Touring keeps them.
 * - One size printed more than once for a car is one size carrying every entry's demands and bands.
 */
function psCar(?string $body, ?string $drive = 'Hinterachse', ?int $powerKw = 150): VehicleRecord
{
    return new VehicleRecord(
        id: 1, hsn: null, tsn: null, vsn: null, make: 'BMW', model: '3er-Reihe (V)', variant: '390L', typeDesignation: '390L',
        buildWindow: BuildWindow::unbounded(), axleLoadFrontKg: 1000, axleLoadRearKg: 1100, maxSpeedKmh: 200,
        powerKw: $powerKw, bodyForm: $body, driveAxle: $drive,
    );
}

function psBody(string $code, string ...$forms): RowFilter
{
    return new RowFilter($code, RowFilter::BODY_FORM, array_values($forms));
}

function psDrive(string $code, string $mode, string $drive): RowFilter
{
    return new RowFilter($code, RowFilter::DRIVE, [], $mode, $drive);
}

function psResolve(VehicleRecord $vehicle, FitmentRow $row): FitmentVerdict
{
    $tables = FitmentFixtures::tables();

    return (new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([$vehicle]),
        fitments: new InMemoryFitmentRepository([$row], [FitmentFixtures::wheel()]),
        loadIndex: new LoadIndexDeriver($tables),
        speedSymbol: new SpeedSymbolDeriver($tables),
        clock: new FixedClock,
    ))->resolve($vehicle->id, FitmentFixtures::WHEEL_CONFIG_ID);
}

/**
 * @param  list<TyreSize>  $sizes
 * @return list<string>
 */
function psKeys(array $sizes): array
{
    return array_map(static fn (TyreSize $s): string => $s->key(), $sizes);
}

it('reads the body-style codes of one row as alternatives: „Cbo Cpe“ is a Cabrio or a Coupé', function (): void {
    // ABE 55255, page 2: BMW 1er-Reihe 182, 1C — „A18 Cbo Cpe“ in the row's own column.
    $row = FitmentFixtures::row(filters: [psBody('Cbo', 'Cabrio', 'Roadster'), psBody('Cpe', 'Coupe')]);

    expect(psResolve(psCar('Coupé'), $row)->status)->not->toBe(VerdictStatus::NotPermitted)
        ->and(psResolve(psCar('Cabrio'), $row)->status)->not->toBe(VerdictStatus::NotPermitted)
        ->and(psResolve(psCar('Limousine'), $row)->status)->toBe(VerdictStatus::NotPermitted)
        ->and(psResolve(psCar('Limousine'), $row)->reason?->code)->toBe(VerdictReason::BODY_OR_DRIVE_EXCLUDED)
        // Not knowing the body is not knowing the answer.
        ->and(psResolve(psCar(null), $row)->status)->toBe(VerdictStatus::Unknown);
});

it('narrows a size by the codes printed beside it, and keeps the row for the car the others admit', function (): void {
    // ABE 55255, page 3: BMW 3er-Reihe (V) 390L — 225/35R19 „Car Lim R02“ (front), 225/35R19 „Lim R03“ (rear),
    // 235/35R19 „Car Lim“, 255/30R19 „Car Lim R03“.
    $row = FitmentFixtures::row(sizes: [
        new TyreSize(225, 35, 19.0, axle: 'FRONT', filters: [psBody('Car', 'Kombi'), psBody('Lim', 'Limousine')]),
        new TyreSize(225, 35, 19.0, axle: 'REAR', filters: [psBody('Lim', 'Limousine')]),
        new TyreSize(235, 35, 19.0, filters: [psBody('Car', 'Kombi'), psBody('Lim', 'Limousine')]),
        new TyreSize(255, 30, 19.0, axle: 'REAR', filters: [psBody('Car', 'Kombi'), psBody('Lim', 'Limousine')]),
    ]);

    $touring = psResolve(psCar('Kombi'), $row);
    $limousine = psResolve(psCar('Limousine'), $row);

    expect(psKeys($touring->front->sizes))->toBe(['225/35/19', '235/35/19'])
        ->and(psKeys($touring->rear->sizes))->toBe(['235/35/19', '255/30/19'])
        ->and(psKeys($limousine->rear->sizes))->toBe(['225/35/19', '235/35/19', '255/30/19'])
        // Every size keeps the Coupé out: the row does.
        ->and(psResolve(psCar('Coupe'), $row)->reason?->code)->toBe(VerdictReason::BODY_OR_DRIVE_EXCLUDED)
        ->and(psResolve(psCar(null), $row)->status)->toBe(VerdictStatus::Unknown);
});

it('says the Eintragung only where a size the car keeps needs it', function (): void {
    // 390L: A01 (Abnahme) is printed beside 235/35R19 only. A car that keeps only that size needs the entry;
    // one whose sizes all go without it does not carry it over from a dropped size.
    $abnahme = Condition::ofKind('A01', ConditionKind::Abnahme, 'Nach Durchführung der Technischen Änderung ist das Fahrzeug … vorzuführen.');
    $row = new FitmentRow(
        id: 1, document: FitmentFixtures::document(), vehicleId: 1, wheelConfigId: FitmentFixtures::WHEEL_CONFIG_ID, axle: 'ALL',
        buildWindow: BuildWindow::unbounded(), permittedWidthMin: null, permittedWidthMax: null, permittedEtMin: null, permittedEtMax: null,
        requiresEntry: true,
        tyreSizes: [
            new TyreSize(225, 35, 19.0, filters: [psBody('Lim', 'Limousine')]),
            new TyreSize(235, 35, 19.0, requiresEntry: true, conditions: [$abnahme], filters: [psBody('Car', 'Kombi')]),
        ],
        ownRequiresEntry: false,
    );

    expect(psResolve(psCar('Limousine'), $row)->requiresEntry)->toBeFalse()
        ->and(psResolve(psCar('Kombi'), $row)->requiresEntry)->toBeTrue();
});

it('lets in any drive a row names „nur mit“, keeps out each „nicht mit“, and cannot tell four-wheel steering', function (): void {
    // The 18″ Nachtrag prints „Allradantrieb; Heckantrieb;“ for one group: either drive.
    $either = [psDrive('Allrad', 'only', 'Allrad'), psDrive('Heck', 'only', 'Hinterachse')];

    expect(RowFilter::admitAll($either, psCar('Coupe', 'Allrad')))->toBeTrue()
        ->and(RowFilter::admitAll($either, psCar('Coupe', 'Hinterachse')))->toBeTrue()
        ->and(RowFilter::admitAll($either, psCar('Coupe', 'Vorderachse')))->toBeFalse()
        ->and(RowFilter::admitAll($either, psCar('Coupe', null)))->toBeNull();

    // ABE 55255, page 4: BMW 5er-Reihe 5L „A58 L04“ — not with all-wheel drive, only with four-wheel steering.
    $fiveSeries = [psDrive('A58', 'not', 'Allrad'), psDrive('L04', 'only', 'Allradlenkung')];

    expect(RowFilter::admitAll($fiveSeries, psCar('Limousine', 'Allrad')))->toBeFalse()
        ->and(RowFilter::admitAll($fiveSeries, psCar('Limousine', 'Hinterachse')))->toBeNull();

    // Codes that together let in every body style narrow nothing: the 18″ Nachtrag's „Pkw geschlossen; Cabrio“
    // (BMW 3/B) passes a car whose body style no record holds.
    $closedOrOpen = [psBody('Pkw geschlossen', 'Limousine', 'Kombi', 'Coupe', 'Schrägheck', 'SUV', 'Van'), psBody('Cabrio', 'Cabrio', 'Roadster')];

    expect(RowFilter::admitAll($closedOrOpen, psCar(null)))->toBeTrue()
        ->and(RowFilter::admitAll([psBody('Pkw geschlossen', 'Limousine', 'Kombi', 'Coupe', 'Schrägheck', 'SUV', 'Van')], psCar(null)))->toBeNull();

    // A body-style code and a drive code on one row both have to let the car in.
    expect(RowFilter::admitAll([psBody('Lim', 'Limousine'), psDrive('A56', 'only', 'Allrad')], psCar('Limousine', 'Allrad')))->toBeTrue()
        ->and(RowFilter::admitAll([psBody('Lim', 'Limousine'), psDrive('A56', 'only', 'Allrad')], psCar('Kombi', null)))->toBeFalse();
});

it('reads one size printed at two kW bands as one size with both entries’ Auflagen where both cover the car', function (): void {
    // ABE 55255, page 5: BMW Z3 — 225/35R19 at 85–110 kW „Cbo K2b K42 K46 L02“ and at 85–125 kW „Cbo L02 R70“.
    $k2b = Condition::ofKind('K2b', ConditionKind::Karosseriearbeit, 'Die Radabdeckung an Achse 2 ist … herzustellen.');
    $r70 = Condition::ofKind('R70', ConditionKind::Hinweis, 'Für das Fahrzeug ist die Reifengröße … zu bestätigen.');
    $row = FitmentFixtures::row(sizes: [
        new TyreSize(225, 35, 19.0, conditions: [$k2b], kwMin: 85, kwMax: 110),
        new TyreSize(225, 35, 19.0, conditions: [$r70], kwMin: 85, kwMax: 125),
    ]);

    $codes = static fn (FitmentVerdict $v): array => array_map(static fn (Condition $c): string => $c->code, $v->front->sizes[0]->conditions ?? []);

    $at100 = psResolve(psCar('Roadster', 'Hinterachse', 100), $row);
    $at120 = psResolve(psCar('Roadster', 'Hinterachse', 120), $row);
    $unknown = psResolve(psCar('Roadster', 'Hinterachse', null), $row);

    expect(psKeys($at100->front->sizes))->toBe(['225/35/19'])
        ->and($codes($at100))->toEqualCanonicalizing(['K2b', 'R70'])
        ->and($codes($at120))->toBe(['R70'])
        ->and(psResolve(psCar('Roadster', 'Hinterachse', 130), $row)->status)->toBe(VerdictStatus::NotPermitted)
        // Power unknown: the bands are said together, as one.
        ->and(array_map(static fn (Condition $c): string => $c->sentenceDe(), $unknown->conditions))
        ->toContain('225/35 R19 ist laut Gutachten nur für Fahrzeuge mit 85–125'."\u{00A0}".'kW zugelassen. Vergleiche das mit der Leistung in Feld P.2 deiner Zulassungsbescheinigung (im alten Fahrzeugschein Ziffer 7).');
});

it('keeps a band printed as two values two values — „225, 235“ never reads as everything between', function (): void {
    // ABE 55255, page 4: BMW 5er ActiveHybrid — kW „225, 235“ beside every size.
    $row = FitmentFixtures::row(sizes: [
        new TyreSize(225, 45, 19.0, kwMin: 225, kwMax: 225),
        new TyreSize(225, 45, 19.0, kwMin: 235, kwMax: 235),
    ]);

    expect(psResolve(psCar('Limousine', 'Hinterachse', 230), $row)->status)->toBe(VerdictStatus::NotPermitted)
        ->and(psKeys(psResolve(psCar('Limousine', 'Hinterachse', 235), $row)->front->sizes))->toBe(['225/45/19'])
        ->and(array_map(static fn (Condition $c): string => $c->sentenceDe(), psResolve(psCar('Limousine', 'Hinterachse', null), $row)->conditions))
        ->toContain('225/45 R19 ist laut Gutachten nur für Fahrzeuge mit 225'."\u{00A0}".'kW oder 235'."\u{00A0}".'kW zugelassen. Vergleiche das mit der Leistung in Feld P.2 deiner Zulassungsbescheinigung (im alten Fahrzeugschein Ziffer 7).');
});

it('binds the axle to the strictest speed symbol and the highest load index any of its sizes prints', function (): void {
    // The 18″ Nachtrag, page 5: BMW 2er 1C — 215/40R18 89Y beside 225/45R18 91W.
    $row = FitmentFixtures::row(sizes: [
        new TyreSize(215, 40, 18.0, documentMinLoadIndex: 89, documentMinSpeedSymbol: 'Y'),
        new TyreSize(225, 45, 18.0, documentMinLoadIndex: 91, documentMinSpeedSymbol: 'W'),
    ]);

    $verdict = psResolve(psCar('Coupe', 'Hinterachse', 150), $row);

    expect($verdict->front->minSpeedSymbol)->toBe('Y')
        ->and($verdict->front->minLoadIndex)->toBeGreaterThanOrEqual(91);
});
