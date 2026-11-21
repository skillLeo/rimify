<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictReason;
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
 * load at speed — the tyres are „Noch nicht bestätigt“, the missing field named (D-286), and so the verdict is never
 * PERMITTED: without the speed a table could only be read the permissive way. With the top speed entered the same row is
 * answered, so the refusal is the missing field's and nothing else's. Under the third — load index and symbol beside every
 * size (D-285) — the car is answered without it (D-284), and the tyre chosen must meet or exceed both figures.
 */

beforeEach(function (): void {
    $this->seed(ReferenceDataSeeder::class);
    // The answers this test reads are at the legal minimum: margins as shipped, stated (the look-back, D-232).
    config(['rimify.speed_symbol_margin_steps' => 0, 'rimify.load_index_margin_steps' => 0]);
});

/**
 * One released row — a car with its axle loads, a 225/40 R18 on an 8,5J × 18 — under a document that answers this way;
 * the size with the speed symbol the document prints beside it, where it prints one.
 */
function underDocument(TyreIndexSource $source, ?int $topSpeed, ?string $symbol = null, ?int $wheelLoadKg = null, ?int $loadIndex = null): FitmentVerdict
{
    $document = ApprovalDocument::factory()->abe()->tyreIndex($source)->create();
    $vehicle = Vehicle::factory()->create(['axle_load_front_kg' => 1100, 'axle_load_rear_kg' => 1100, 'max_speed_kmh' => $topSpeed, 'needs_review' => $topSpeed === null]);
    $wheel = WheelConfig::factory()->havanna85x18()->create(['max_load_kg' => $wheelLoadKg]);
    $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);
    FitmentTyreSize::factory()->for($row)->size(225, 40, 18.0)->create(['min_speed_symbol' => $symbol, 'min_load_index' => $loadIndex]);

    return app(FitmentResolver::class)->resolve($vehicle->id, $wheel->id);
}

const TOP_SPEED_OWED = 'Für die Reifen fehlt uns die Höchstgeschwindigkeit deines Fahrzeugs (Feld T der Zulassungsbescheinigung Teil I).';
const TOP_SPEED_ASK = 'Trag die Werte aus deiner Zulassungsbescheinigung Teil I ein, dann zeigen wir dir, welche Reifen du fahren darfst.';

/** „Noch nicht bestätigt“ for want of field T alone (D-286): the wheel answered, nothing sold, the field named. */
function awaitsTopSpeed(FitmentVerdict $verdict): void
{
    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->tyreUnconfirmed())->toBeTrue()
        ->and($verdict->isSellable())->toBeFalse()
        ->and($verdict->tyre?->papersOwed)->toBe(['T']);
}

it('sells only a tyre that meets or exceeds both figures the document names — a 91V is not a 91W (D-284)', function (): void {
    $verdict = underDocument(TyreIndexSource::Document, null, 'W', loadIndex: 91);
    $eligibility = app(TyreEligibility::class);
    $speedSymbols = app(SpeedSymbolDeriver::class);
    $tyre = static fn (int $loadIndex, string $symbol): TyreRecord => new TyreRecord(
        id: 1, widthMm: 225, aspect: 40, diameterIn: 18.0, loadIndex: $loadIndex, speedSymbol: $symbol,
        speedRank: (int) $speedSymbols->rankOf($symbol), priceCents: 15_000, sellable: true,
    );

    expect($eligibility->permits($verdict, $tyre(91, 'V')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and($eligibility->permits($verdict, $tyre(90, 'W')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and($eligibility->permits($verdict, $tyre(91, 'W')))->toBeNull()
        ->and($eligibility->permits($verdict, $tyre(94, 'Y')))->toBeNull();
});

it('refuses a wheel its tested load cannot carry while the top speed is open', function (): void {
    // 1.100 kg on the axle, 500 kg tested a wheel: 550 kg a wheel is more than the rim may carry.
    foreach ([TyreIndexSource::Document, TyreIndexSource::Papers] as $source) {
        $verdict = underDocument($source, null, 'W', 500);

        expect($verdict->status)->toBe(VerdictStatus::NotPermitted, $source->value)
            ->and($verdict->reason?->code)->toBe(VerdictReason::WHEEL_LOAD_EXCEEDED);
    }
});

/** A car without its top speed and one wheel, covered by one document per answer given. */
function underDocuments(TyreIndexSource ...$sources): FitmentVerdict
{
    $vehicle = Vehicle::factory()->create(['axle_load_front_kg' => 1100, 'axle_load_rear_kg' => 1100, 'max_speed_kmh' => null, 'needs_review' => true]);
    $wheel = WheelConfig::factory()->havanna85x18()->create();

    foreach ($sources as $source) {
        $document = ApprovalDocument::factory()->abe()->tyreIndex($source)->create();
        $row = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $wheel->id]);
        FitmentTyreSize::factory()->for($row)->size(225, 40, 18.0)->create(['min_speed_symbol' => 'W', 'min_load_index' => 91]);
    }

    return app(FitmentResolver::class)->resolve($vehicle->id, $wheel->id);
}
