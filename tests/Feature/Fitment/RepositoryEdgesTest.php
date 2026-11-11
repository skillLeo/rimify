<?php

declare(strict_types=1);

use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Models\FitmentCondition;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\ReferenceDataSeeder;

/*
 * The approval repository at its edges, against the real schema (D-433): an empty question reads nothing, a preview hides
 * the revision it replaces, the Prüfer's word on the Eintragung is said as his, an axle code narrows a size — to no axle
 * at all where the two disagree — and a combination row that names no EG entry matches no car.
 */

beforeEach(function (): void {
    $this->seed(ReferenceDataSeeder::class);
});

it('reads nothing for an empty question, whatever it is asked', function (): void {
    $repository = new EloquentFitmentRepository;

    expect($repository->publishedRowsFor(1, []))->toBe([])
        ->and($repository->wheelSetsFor(1, []))->toBe([])
        ->and($repository->wheelSetsFor(PHP_INT_MAX, [1]))->toBe([])
        ->and($repository->configsWithPublishedDocument([]))->toBe([])
        ->and($repository->incompleteDocumentsFor([]))->toBe([])
        ->and($repository->findWheelConfigs([]))->toBe([])
        ->and($repository->conflictDecisionsFor(1, []))->toBe([]);
});

it('shows in a preview the draft’s rows and hides those of the revision it replaces', function (): void {
    $vehicle = Vehicle::factory()->create();
    $wheel = WheelConfig::factory()->create();
    $old = ApprovalDocument::factory()->abe()->create();
    $new = ApprovalDocument::factory()->abe()->draft()->create(['supersedes_id' => $old->id]);
    $oldRow = Fitment::factory()->create(['approval_document_id' => $old->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);
    $newRow = Fitment::factory()->draft()->create(['approval_document_id' => $new->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);

    $ids = static fn (EloquentFitmentRepository $r): array => array_map(static fn ($row): int => $row->id, $r->publishedRowsFor($vehicle->id, [$wheel->id])[$wheel->id]);

    expect($ids(new EloquentFitmentRepository))->toBe([$oldRow->id])
        ->and($ids(EloquentFitmentRepository::forPreviewOf($new)))->toBe([$newRow->id]);
});

it('says the Prüfer’s word where he made the Eintragung required, after the row’s own note', function (): void {
    $vehicle = Vehicle::factory()->create();
    $wheel = WheelConfig::factory()->create();
    $row = Fitment::factory()->create([
        'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id, 'requires_entry' => true,
        'entry_note_de' => 'Eintragung durch eine amtlich anerkannte Prüfstelle.',
        'entry_override' => 'required', 'entry_override_reason' => 'Der Prüfer verlangt sie wegen der Spurverbreiterung.',
    ]);
    FitmentTyreSize::factory()->for($row)->create();

    $read = (new EloquentFitmentRepository)->publishedRowsFor($vehicle->id, [$wheel->id])[$wheel->id][0];

    expect($read->requiresEntry)->toBeTrue()
        ->and($read->entryNoteDe)->toBe('Eintragung durch eine amtlich anerkannte Prüfstelle. Laut Prüfer: Der Prüfer verlangt sie wegen der Spurverbreiterung.');
});

it('narrows a size for all axles to the rear under a rear-only code, and a front-only size under it to no axle at all', function (): void {
    $vehicle = Vehicle::factory()->create();
    $wheel = WheelConfig::factory()->create();
    $document = ApprovalDocument::factory()->abe()->create();
    DocumentCondition::factory()->kind(ConditionKind::ReifenAchse, 'Nur an der Hinterachse zulässig.')->create(['approval_document_id' => $document->id, 'code' => 'R03', 'axle' => 'REAR']);
    $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);
    FitmentCondition::query()->create(['fitment_id' => $row->id, 'code' => 'R03']);
    FitmentTyreSize::factory()->for($row)->size(245, 45, 18.0)->create(['axle' => 'ALL']);
    FitmentTyreSize::factory()->for($row)->size(255, 40, 18.0)->create(['axle' => 'FRONT']);

    $sizes = (new EloquentFitmentRepository)->publishedRowsFor($vehicle->id, [$wheel->id])[$wheel->id][0]->tyreSizes;

    expect(array_map(static fn ($s): string => $s->key().' '.$s->axle, $sizes))->toBe(['245/45/18 REAR', '255/40/18 NONE']);
});

it('matches no car with a combination row that names no EG entry — the tyres are then not confirmed', function (): void {
    $vehicle = Vehicle::factory()->create(['eg_nummer_raw' => 'e1*2001/116*0447*11']);
    $wheel = WheelConfig::factory()->create();
    $document = ApprovalDocument::factory()->abe()->create();
    $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);
    FitmentTyreSize::factory()->for($row)->size(225, 40, 18.0)->create();
    DocumentTyreCombination::query()->create([
        'approval_document_id' => $document->id, 'eg_number' => null, 'eg_number_norm' => null, 'number' => 1,
        'front_width_mm' => 225, 'front_aspect' => 40, 'front_diameter_in' => 18.0,
        'rear_width_mm' => 255, 'rear_aspect' => 35, 'rear_diameter_in' => 18.0, 'source_page' => 5,
    ]);

    $table = (new EloquentFitmentRepository)->publishedRowsFor($vehicle->id, [$wheel->id])[$wheel->id][0]->document->tyreCombinations;

    expect($table?->unmatched)->toBeTrue()
        ->and($table?->pairs)->toBe([])
        // As the shop read it before D-358, the whole list stands for every car.
        ->and(EloquentFitmentRepository::beforeEntries()->publishedRowsFor($vehicle->id, [$wheel->id])[$wheel->id][0]->document->tyreCombinations?->pairs)->toHaveCount(1);
});

/*
 * Pairs per car (his round of 08.11, §2; D-447): a car reads its own rows; only where it has none does its field K choose an
 * entry, and then only that entry's rows that name no car — never another car's.
 */
describe('a car\'s own pairs', function (): void {
    /** @return array{document: ApprovalDocument, wheel: WheelConfig} */
    function ownPairsPaper(): array
    {
        return ['document' => ApprovalDocument::factory()->abe()->create(), 'wheel' => WheelConfig::factory()->create()];
    }

    function ownPairsCar(ApprovalDocument $document, WheelConfig $wheel, string $k = 'e1*2001/116*0447*11'): Vehicle
    {
        $vehicle = Vehicle::factory()->create(['eg_nummer_raw' => $k, 'eg_nummer_norm' => $k]);
        $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);
        FitmentTyreSize::factory()->for($row)->size(225, 40, 18.0)->create();

        return $vehicle;
    }

    function ownPairsRow(ApprovalDocument $document, ?Vehicle $car, int $rearWidth, int $number = 1, string $k = 'e1*2001/116*0447*11'): DocumentTyreCombination
    {
        return DocumentTyreCombination::query()->create([
            'approval_document_id' => $document->id, 'vehicle_id' => $car?->id, 'eg_number' => $k, 'eg_number_norm' => $k, 'number' => $number,
            'front_width_mm' => 225, 'front_aspect' => 40, 'front_diameter_in' => 18.0,
            'rear_width_mm' => $rearWidth, 'rear_aspect' => 35, 'rear_diameter_in' => 18.0, 'source_page' => 5,
        ]);
    }

    /** @return list<int>|null the rear widths of the car's pairs; null where the list does not reach it */
    function ownPairsRead(Vehicle $car, WheelConfig $wheel): ?array
    {
        $table = (new EloquentFitmentRepository)->publishedRowsFor($car->id, [$wheel->id])[$wheel->id][0]->document->tyreCombinations;

        return $table === null || $table->unmatched ? null : array_map(static fn ($pair): int => $pair->rear->widthMm, $table->pairs);
    }

    it('gives two cars of one field K each its own pairs, with the row an order freezes', function (): void {
        ['document' => $document, 'wheel' => $wheel] = ownPairsPaper();
        $a = ownPairsCar($document, $wheel);
        $b = ownPairsCar($document, $wheel);
        $rowA = ownPairsRow($document, $a, 255);
        ownPairsRow($document, $b, 245);

        $pairs = (new EloquentFitmentRepository)->publishedRowsFor($a->id, [$wheel->id])[$wheel->id][0]->document->tyreCombinations?->pairs;

        expect(ownPairsRead($a, $wheel))->toBe([255])
            ->and(ownPairsRead($b, $wheel))->toBe([245])
            ->and($pairs[0]->id ?? null)->toBe($rowA->id);
    });

    it('never gives a car without rows of its own another car\'s pairs under the same field K: not confirmed', function (): void {
        ['document' => $document, 'wheel' => $wheel] = ownPairsPaper();
        $a = ownPairsCar($document, $wheel);
        $b = ownPairsCar($document, $wheel);
        ownPairsRow($document, $a, 255);

        expect(ownPairsRead($a, $wheel))->toBe([255])
            ->and(ownPairsRead($b, $wheel))->toBeNull();
    });

    it('matches a car without rows of its own to the rows that name no car, by its field K, as before', function (): void {
        ['document' => $document, 'wheel' => $wheel] = ownPairsPaper();
        $later = ownPairsCar($document, $wheel);
        ownPairsRow($document, null, 255, 1);
        ownPairsRow($document, null, 245, 2);

        expect(ownPairsRead($later, $wheel))->toBe([255, 245]);
    });

    it('chooses no entry whose rows hold different pairs for different cars: it could not say whose list it would be', function (): void {
        ['document' => $document, 'wheel' => $wheel] = ownPairsPaper();
        $a = ownPairsCar($document, $wheel);
        $later = ownPairsCar($document, $wheel);
        ownPairsRow($document, $a, 255);
        ownPairsRow($document, null, 245);

        expect(ownPairsRead($later, $wheel))->toBeNull()
            ->and(ownPairsRead($a, $wheel))->toBe([255]);
    });

    it('reads an entry the same whoever holds it: one list across its cars still matches by field K', function (): void {
        ['document' => $document, 'wheel' => $wheel] = ownPairsPaper();
        $a = ownPairsCar($document, $wheel);
        $later = ownPairsCar($document, $wheel);
        ownPairsRow($document, $a, 255);
        ownPairsRow($document, null, 255);

        expect(ownPairsRead($later, $wheel))->toBe([255]);
    });
});
