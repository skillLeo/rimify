<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\FixedClock;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\VehicleFixtures;

/*
 * A page of cards asks about many configurations at once, so the engine reads their rows in one
 * pass. That is an optimisation of the reads and nothing else: every configuration in a batch must
 * get exactly the verdict it gets when asked about on its own.
 */

/** The fixture wheel under another configuration id, optionally in another offset. */
function batchWheel(int $id, int $etMm = 35): WheelConfigRecord
{
    $base = FitmentFixtures::wheel(etMm: $etMm);

    return new WheelConfigRecord(
        id: $id,
        wheelModelId: $base->wheelModelId,
        wheelFinishId: $base->wheelFinishId,
        diameterIn: $base->diameterIn,
        widthIn: $base->widthIn,
        etMm: $base->etMm,
        boltHoles: $base->boltHoles,
        boltCircleMm: $base->boltCircleMm,
        centreBoreMm: $base->centreBoreMm,
        priceCents: $base->priceCents,
        stockQty: $base->stockQty,
        sku: 'RMF-'.$id,
        modelName: $base->modelName,
        brandName: $base->brandName,
        finishNameDe: $base->finishNameDe,
    );
}

/** A fixture row moved onto another configuration. */
function batchRow(int $configId, FitmentRow $row): FitmentRow
{
    return new FitmentRow(
        id: $row->id + $configId,
        document: $row->document,
        vehicleId: $row->vehicleId,
        wheelConfigId: $configId,
        axle: $row->axle,
        buildWindow: $row->buildWindow,
        permittedWidthMin: $row->permittedWidthMin,
        permittedWidthMax: $row->permittedWidthMax,
        permittedEtMin: $row->permittedEtMin,
        permittedEtMax: $row->permittedEtMax,
        requiresEntry: $row->requiresEntry,
        entryNoteDe: $row->entryNoteDe,
        tyreSizes: $row->tyreSizes,
        conditions: $row->conditions,
        centreBoreMm: $row->centreBoreMm,
    );
}

/**
 * One configuration in every state the engine can reach from rows alone:
 * 101 permitted · 102 conditional · 103 no document · 104 documented for another car only ·
 * 105 offset outside the permitted range · 106 a configuration that does not exist.
 */
function mixedCatalogue(): InMemoryFitmentRepository
{
    return new InMemoryFitmentRepository(
        rows: [
            batchRow(101, FitmentFixtures::row()),
            batchRow(102, FitmentFixtures::row(conditions: [FitmentFixtures::specificBolts()])),
            batchRow(104, FitmentFixtures::row(vehicleId: 2)),
            batchRow(105, FitmentFixtures::row(etMin: 40, etMax: 45)),
        ],
        configs: [batchWheel(101), batchWheel(102), batchWheel(103), batchWheel(104), batchWheel(105)],
    );
}

const BATCH = [101, 102, 103, 104, 105, 106];

it('gives every configuration in a batch the verdict it gets on its own', function (int $vehicleId): void {
    $resolver = FitmentFixtures::resolver([], mixedCatalogue());

    $batch = $resolver->resolveMany($vehicleId, BATCH);

    expect(array_keys($batch))->toBe(BATCH);

    foreach (BATCH as $id) {
        expect($batch[$id])->toEqual($resolver->resolve($vehicleId, $id));
    }
})->with([
    'a complete vehicle' => 1,
    'a vehicle awaiting review' => 8,
    'a vehicle that does not exist' => 999_999,
]);

it('reaches every state in one batch and never a positive one by default', function (): void {
    $batch = FitmentFixtures::resolver([], mixedCatalogue())->resolveMany(1, BATCH);

    expect($batch[101]->status)->toBe(VerdictStatus::Permitted)
        ->and($batch[102]->status)->toBe(VerdictStatus::Conditional)
        ->and($batch[103]->status)->toBe(VerdictStatus::Unknown)
        ->and($batch[103]->reason?->code)->toBe(VerdictReason::NO_DOCUMENT)
        ->and($batch[104]->status)->toBe(VerdictStatus::NotPermitted)
        ->and($batch[105]->status)->toBe(VerdictStatus::NotPermitted)
        ->and($batch[105]->reason?->code)->toBe(VerdictReason::WIDTH_OR_ET_OUTSIDE_RANGE)
        ->and($batch[106]->status)->toBe(VerdictStatus::Unknown)
        ->and($batch[106]->isSellable())->toBeFalse();
});

it('reads the rows and the configurations once for the whole batch', function (): void {
    $counting = new class(mixedCatalogue()) implements FitmentRepository
    {
        /** @var array<string, int> */
        public array $calls = [];

        public function __construct(private FitmentRepository $inner) {}

        public function publishedRowsFor(int $vehicleId, array $wheelConfigIds): array
        {
            $this->calls['rows'] = ($this->calls['rows'] ?? 0) + 1;

            return $this->inner->publishedRowsFor($vehicleId, $wheelConfigIds);
        }

        public function configsWithPublishedDocument(array $wheelConfigIds): array
        {
            $this->calls['documented'] = ($this->calls['documented'] ?? 0) + 1;

            return $this->inner->configsWithPublishedDocument($wheelConfigIds);
        }

        public function findWheelConfigs(array $wheelConfigIds): array
        {
            $this->calls['configs'] = ($this->calls['configs'] ?? 0) + 1;

            return $this->inner->findWheelConfigs($wheelConfigIds);
        }
    };

    $resolver = new FitmentResolver(
        vehicles: VehicleFixtures::repository(),
        fitments: $counting,
        loadIndex: new LoadIndexDeriver(FitmentFixtures::tables()),
        speedSymbol: new SpeedSymbolDeriver(FitmentFixtures::tables()),
        clock: new FixedClock,
    );

    $resolver->resolveMany(1, [...BATCH, 101, 102]);

    expect($counting->calls)->toBe(['configs' => 1, 'rows' => 1, 'documented' => 1]);
});

it('asks nothing for an empty batch', function (): void {
    expect(FitmentFixtures::resolver([], mixedCatalogue())->resolveMany(1, []))->toBe([]);
});
