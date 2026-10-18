<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Enums\TyreIndexSource;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\ReferenceDataSeeder;

/*
 * The operator's brief of 17.10.2026, „Do not remove the top speed. Make it conditional.“ (D-277): for each way a Gutachten
 * gives its tyres' index, a car without a top speed. Under the two that need it — the vehicle's papers, a table of tyre
 * load at speed — no PERMITTED tyre verdict comes out, and so no PERMITTED verdict at all: without the speed a table could
 * only be read the permissive way. With the top speed entered the same row is answered, so the refusal is the missing
 * field's and nothing else's.
 *
 * The third answer — the index printed beside every size — waits for the operator's word on R-03 (D-277).
 */

beforeEach(function (): void {
    $this->seed(ReferenceDataSeeder::class);
    // The answers this test reads are at the legal minimum: margins as shipped, stated (the look-back, D-232).
    config(['rimify.speed_symbol_margin_steps' => 0, 'rimify.load_index_margin_steps' => 0]);
});

/** One released row — a car with its axle loads, a 225/40 R18 on an 8,5J × 18 — under a document that answers this way. */
function underDocument(TyreIndexSource $source, ?int $topSpeed): FitmentVerdict
{
    $factory = ApprovalDocument::factory()->abe()->tyreIndex($source);
    $document = ($source === TyreIndexSource::Table ? $factory->printingDeratingTable() : $factory)->create();
    $vehicle = Vehicle::factory()->create(['axle_load_front_kg' => 1100, 'axle_load_rear_kg' => 1100, 'max_speed_kmh' => $topSpeed, 'needs_review' => $topSpeed === null]);
    $wheel = WheelConfig::factory()->havanna85x18()->create();
    $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);
    FitmentTyreSize::factory()->for($row)->size(225, 40, 18.0)->create();

    return app(FitmentResolver::class)->resolve($vehicle->id, $wheel->id);
}

it('gives no PERMITTED tyre verdict without the top speed where the document sends the reader to the papers', function (): void {
    $without = underDocument(TyreIndexSource::Papers, null);

    expect($without->tyre?->status)->not->toBe(VerdictStatus::Permitted)
        ->and($without->status)->not->toBe(VerdictStatus::Permitted)
        // The missing field is named: the papers' T.
        ->and(implode(' ', $without->tyre->lines ?? []))->toContain('Höchstgeschwindigkeit (Feld T)');

    // Entered — at a speed no table is needed for — the same row is answered.
    expect(underDocument(TyreIndexSource::Papers, 200)->status)->toBe(VerdictStatus::Permitted);
});

it('gives no PERMITTED tyre verdict without the top speed where the document prints a table of load at speed', function (): void {
    $without = underDocument(TyreIndexSource::Table, null);

    expect($without->tyre?->status)->not->toBe(VerdictStatus::Permitted)
        ->and($without->status)->not->toBe(VerdictStatus::Permitted)
        ->and(implode(' ', $without->tyre->lines ?? []))->toContain('Höchstgeschwindigkeit (Feld T)');

    // Entered, the table is read — 250 km/h asks a W tyre for 95 % of its load — and the row is answered.
    $with = underDocument(TyreIndexSource::Table, 250);

    expect($with->status)->toBe(VerdictStatus::Permitted)
        ->and($with->front->minSpeedSymbol)->toBe('W');
});
