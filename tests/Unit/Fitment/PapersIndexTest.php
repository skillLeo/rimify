<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\PapersIndex;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Support\GermanFormat;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\FixedClock;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryVehicleRepository;

/*
 * 15.1 and 15.2 — the tyres the car's own papers name (the operator's decisions of 14.10. §3 and 15.10. §2.1, D-242).
 * The engine takes the stricter of that index and the one it computes from 8.1, 8.2 and T: never the weaker, never the
 * papers' alone (R-03), each half credited to what set it, and where every number came from frozen with the answer.
 */

/** The BMW 4er Coupé 3C as ABE 55255 names it; at 1.100 kg and 250 km/h the engine computes 89 W on its own. */
function indexedCar(?int $front = 1100, ?int $rear = 1100, ?int $speed = 250): VehicleRecord
{
    return new VehicleRecord(
        id: 41, hsn: '', tsn: '', vsn: null,
        make: 'BMW', model: '4er Coupé', variant: '4er Coupé', typeDesignation: '3C',
        buildWindow: BuildWindow::unbounded(),
        axleLoadFrontKg: $front, axleLoadRearKg: $rear, maxSpeedKmh: $speed,
        powerKw: 135, bodyForm: 'Coupé', driveAxle: 'Hinterachse',
        needsReview: $front === null || $rear === null || $speed === null,
    );
}

/** The car once its owner typed 8.1, 8.2, T and the two tyre fields, as the form sends them. */
function withPapersIndex(VehicleRecord $car, string $front, string $rear, int $axleFront = 1100, int $axleRear = 1100, int $speed = 250): VehicleRecord
{
    $f = PapersIndex::parse($front) ?? throw new LogicException("15.1 unread: {$front}");
    $r = PapersIndex::parse($rear) ?? throw new LogicException("15.2 unread: {$rear}");
    $figures = PapersFigures::tryFrom($axleFront, $axleRear, $speed, null, PapersIndex::tryFrom($f[0], $f[1], $r[0], $r[1]))
        ?? throw new LogicException('figures out of range');

    return $figures->applyTo($car);
}

function decideIndexed(VehicleRecord $vehicle, bool $withTable = true): FitmentVerdict
{
    $tables = FitmentFixtures::tables();
    $document = new DocumentRecord(
        id: 57, kind: 'ABE', number: '55255', revision: 1, sourcePage: 4,
        speedDerating: $withTable ? FitmentFixtures::deratingTable() : null,
    );
    $wheel = new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 23, wheelFinishId: 44,
        diameterIn: 19.0, widthIn: 8.5, etMm: 35, boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6,
        priceCents: 0, stockQty: 0, maxLoadKg: 700,
    );

    return (new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([$vehicle]),
        fitments: new InMemoryFitmentRepository([FitmentFixtures::row(vehicleId: $vehicle->id, sizes: [new TyreSize(225, 40, 19.0)], document: $document)], [$wheel]),
        loadIndex: new LoadIndexDeriver($tables),
        speedSymbol: new SpeedSymbolDeriver($tables),
        clock: new FixedClock,
    ))->resolve($vehicle->id, FitmentFixtures::WHEEL_CONFIG_ID);
}

function indexKg(string $figure): string
{
    return $figure.GermanFormat::NBSP.'kg';
}

it('reads the index and the symbol at the end of what 15.1 and 15.2 print, and nothing else', function (): void {
    expect(PapersIndex::parse('225/45 R17 91W'))->toBe([91, 'W'])
        ->and(PapersIndex::parse(' 94 y '))->toBe([94, 'Y'])
        // A bracket is a tyre above 300 km/h, never the slower Y.
        ->and(PapersIndex::parse('245/35 ZR20 (95Y)'))->toBe([95, '(Y)'])
        ->and(PapersIndex::parse('245/35 ZR20 (95Y'))->toBeNull()
        ->and(PapersIndex::parse('245/35 ZR20 95Y)'))->toBeNull()
        // A size without its index, a letter no tyre carries, an index no car tyre has: refused, never guessed.
        ->and(PapersIndex::parse('225/45 R17'))->toBeNull()
        ->and(PapersIndex::parse('225/45 ZR17 W'))->toBeNull()
        ->and(PapersIndex::parse('225/45 R17 91X'))->toBeNull()
        ->and(PapersIndex::parse('225/45 R17 59W'))->toBeNull()
        ->and(PapersIndex::parse('225/45 R17 131W'))->toBeNull()
        ->and(PapersIndex::parse(''))->toBeNull()
        ->and(PapersIndex::tryFrom(91, 'W', 94, 'Z'))->toBeNull()
        ->and(PapersIndex::tryFrom(91, 'W', 95, '(Y)')?->labelFor('REAR'))->toBe('(95Y)')
        ->and(PapersIndex::tryFrom(91, 'W', 95, '(Y)')?->forAxle('FRONT'))->toBe(['loadIndex' => 91, 'speedSymbol' => 'W', 'field' => '15.1']);
});

it('takes the papers’ index where it is the stricter, and keeps its own computation beside it', function (): void {
    $verdict = decideIndexed(withPapersIndex(indexedCar(), '225/40 R19 91Y', '225/40 R19 91Y'));

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->front->minLoadIndex)->toBe(91)
        ->and($verdict->front->minSpeedSymbol)->toBe('Y')
        ->and($verdict->front->minLoadSource)->toBe(MinSource::Papers)
        ->and($verdict->front->minSpeedSource)->toBe(MinSource::Papers)
        ->and($verdict->tyre?->stricterByPapers)->toBeTrue()
        ->and($verdict->tyre?->summary)->toBe('Beide Achsen mit '.indexKg('1.100').': mindestens Tragfähigkeitsindex 91, Geschwindigkeitsindex Y.')
        // The computation stands as it would without the papers: W at 95 %, LI 89 …
        ->and($verdict->tyre?->lines)->toContain('Bei 250 km/h trägt ein Reifen mit Geschwindigkeitsindex W nur 95 % seiner Last (Tabelle auf Seite 6 im Gutachten 55255): '
            .indexKg('550').' ÷ 0,95 = '.indexKg('578,9').' – das verlangt Tragfähigkeitsindex 89 ('.indexKg('580').').')
        // … the papers' index is said on its own, and the one that governs is named.
        ->and($verdict->tyre?->lines)->toContain('Nach deinen Angaben aus Feld 15.1: Tragfähigkeitsindex 91, Geschwindigkeitsindex Y.')
        ->and($verdict->tyre?->lines)->toContain('Maßgeblich ist deine Angabe aus Feld 15.1: mindestens Tragfähigkeitsindex 91, Geschwindigkeitsindex Y.')
        ->and($verdict->tyre?->lines)->toContain('Maßgeblich ist deine Angabe aus Feld 15.2: mindestens Tragfähigkeitsindex 91, Geschwindigkeitsindex Y.');
});

it('never takes the weaker: an index below the computation changes nothing, and is still said', function (): void {
    $verdict = decideIndexed(withPapersIndex(indexedCar(), '84V', '84V'));

    expect($verdict->front->minLoadIndex)->toBe(89)
        ->and($verdict->front->minSpeedSymbol)->toBe('W')
        ->and($verdict->front->minLoadSource)->toBe(MinSource::Derived)
        ->and($verdict->front->minSpeedSource)->toBe(MinSource::Derived)
        ->and($verdict->tyre?->stricterByPapers)->toBeFalse()
        ->and($verdict->tyre?->lines)->toContain('Nach deinen Angaben aus Feld 15.1: Tragfähigkeitsindex 84, Geschwindigkeitsindex V.')
        ->and($verdict->tyre?->lines)->toContain('Maßgeblich ist die Minderung bei hoher Geschwindigkeit: mindestens Tragfähigkeitsindex 89, Geschwindigkeitsindex W.');
});

it('credits each half to what set it where the papers set only one', function (): void {
    // 85Y: the symbol is the stricter (Y over W), the index is not (85 under 89).
    $speedOnly = decideIndexed(withPapersIndex(indexedCar(), '85Y', '85Y'));

    expect($speedOnly->front->minLoadIndex)->toBe(89)
        ->and($speedOnly->front->minSpeedSymbol)->toBe('Y')
        ->and($speedOnly->front->minLoadSource)->toBe(MinSource::Derived)
        ->and($speedOnly->front->minSpeedSource)->toBe(MinSource::Papers)
        ->and($speedOnly->tyre?->lines)->toContain('Maßgeblich ist die Minderung bei hoher Geschwindigkeit: mindestens Tragfähigkeitsindex 89. Den Geschwindigkeitsindex Y verlangt deine Angabe aus Feld 15.1.');

    // 93V: the index is the stricter (93 over 89), the symbol is not (V under W).
    $loadOnly = decideIndexed(withPapersIndex(indexedCar(), '93V', '93V'));

    expect($loadOnly->front->minLoadIndex)->toBe(93)
        ->and($loadOnly->front->minSpeedSymbol)->toBe('W')
        ->and($loadOnly->front->minLoadSource)->toBe(MinSource::Papers)
        ->and($loadOnly->front->minSpeedSource)->toBe(MinSource::Derived)
        ->and($loadOnly->tyre?->lines)->toContain('Maßgeblich ist deine Angabe aus Feld 15.1: mindestens Tragfähigkeitsindex 93. Der Geschwindigkeitsindex muss mindestens W sein.');
});

it('never answers on the papers’ index alone: without its own computation the tyres stay open, and it says why (R-03)', function (): void {
    // No table above 210 km/h: the engine cannot compute, so 91Y and 94Y confirm nothing on their own.
    $verdict = decideIndexed(withPapersIndex(indexedCar(), '91Y', '94Y'), withTable: false);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->front->minLoadIndex)->toBeNull()
        ->and($verdict->rear->minLoadIndex)->toBeNull()
        ->and($verdict->tyre?->lines)->toContain('Deine Angabe aus Feld 15.1 – Tragfähigkeitsindex 91, Geschwindigkeitsindex Y – bestätigt die Reifen allein nicht: Wir nehmen sie nur zusammen mit unserer eigenen Berechnung aus Achslast und Höchstgeschwindigkeit.')
        ->and($verdict->tyre?->lines)->toContain('Deine Angabe aus Feld 15.2 – Tragfähigkeitsindex 94, Geschwindigkeitsindex Y – bestätigt die Reifen allein nicht: Wir nehmen sie nur zusammen mit unserer eigenen Berechnung aus Achslast und Höchstgeschwindigkeit.');
});

it('freezes where every number came from beside the verdict', function (): void {
    // 8.1 typed above the data (1.180 over 1.100 kg): the customer's. 8.2 and T as the data has them.
    $verdict = decideIndexed(withPapersIndex(indexedCar(), '91W', '91W', 1180, 1100, 250));

    expect($verdict->front->provenance)->toBe(['axleLoadFrom' => 'customer', 'topSpeedFrom' => 'dataset', 'papersLoadIndex' => 91, 'papersSpeedSymbol' => 'W'])
        ->and($verdict->rear->provenance)->toBe(['axleLoadFrom' => 'dataset', 'topSpeedFrom' => 'dataset', 'papersLoadIndex' => 91, 'papersSpeedSymbol' => 'W'])
        ->and($verdict->toArray()['tyres']['front']['provenance'] ?? null)->toBe($verdict->front->provenance);

    // The frozen verdict reads back with its provenance and its sources.
    $restored = FitmentVerdict::fromArray($verdict->toArray());

    expect($restored->front->provenance)->toBe($verdict->front->provenance)
        ->and($restored->rear->provenance)->toBe($verdict->rear->provenance)
        ->and($restored->front->minLoadSource)->toBe($verdict->front->minLoadSource);

    // A car the data knew nothing of: every figure is the customer's.
    $typed = decideIndexed(withPapersIndex(indexedCar(null, null, null), '91W', '91W'));

    expect($typed->front->provenance)->toBe(['axleLoadFrom' => 'customer', 'topSpeedFrom' => 'customer', 'papersLoadIndex' => 91, 'papersSpeedSymbol' => 'W']);

    // Nothing typed: every figure is our vehicle data's, and the frozen verdict claims no provenance.
    $plain = decideIndexed(indexedCar());

    expect($plain->front->provenance)->toBeNull()
        ->and($plain->toArray()['tyres']['front'])->not->toHaveKey('provenance');
});

it('reads `(95Y)` as above 300 km/h and lets it raise a Y', function (): void {
    // 280 km/h: the table asks Y; the papers name (95Y) — the stricter symbol governs, the index computed for Y stays.
    $verdict = decideIndexed(withPapersIndex(indexedCar(1100, 1100, 280), '245/35 ZR19 (95Y)', '245/35 ZR19 (95Y)', 1100, 1100, 280));

    expect($verdict->front->minSpeedSymbol)->toBe('(Y)')
        ->and($verdict->front->minSpeedSource)->toBe(MinSource::Papers)
        ->and($verdict->front->minLoadIndex)->toBe(95)
        ->and($verdict->tyre?->lines)->toContain('Nach deinen Angaben aus Feld 15.1: Tragfähigkeitsindex 95, Geschwindigkeitsindex (Y).');
});
