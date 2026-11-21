<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\PapersIndex;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\FitmentVerdict;
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

function decideIndexed(VehicleRecord $vehicle): FitmentVerdict
{
    $tables = FitmentFixtures::tables();
    $document = new DocumentRecord(
        id: 57, kind: 'ABE', number: '55255', revision: 1, sourcePage: 4,
    );
    $wheel = new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 23, wheelFinishId: 44,
        diameterIn: 19.0, widthIn: 8.5, etMm: 35, boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6,
        priceCents: 0, stockQty: 0, maxLoadKg: 700,
    );

    return (new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([$vehicle]),
        fitments: new InMemoryFitmentRepository([FitmentFixtures::row(vehicleId: $vehicle->id, sizes: [new TyreSize(225, 40, 19.0)], document: $document)], [$wheel]),
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
        // (W): above 270 km/h, to the maker's limit (D-453) — in either bracket, and Y's second bracket form too.
        ->and(PapersIndex::parse('245/40 ZR18 97(W)'))->toBe([97, '(W)'])
        ->and(PapersIndex::parse('245/40 ZR18 (97W)'))->toBe([97, '(W)'])
        ->and(PapersIndex::parse('245/40 ZR18 97 ( W )'))->toBe([97, '(W)'])
        ->and(PapersIndex::parse('245/35 ZR20 95(Y)'))->toBe([95, '(Y)'])
        ->and(PapersIndex::parse('245/40 ZR18 (97V)'))->toBeNull()
        ->and(PapersIndex::parse('245/40 ZR18 97(V)'))->toBeNull()
        ->and(PapersIndex::parse('245/40 ZR18 (97(W)'))->toBeNull()
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
