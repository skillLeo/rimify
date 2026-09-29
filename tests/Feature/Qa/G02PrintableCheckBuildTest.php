<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\VehicleBuild;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\EngineVersion;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictSnapshot;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Models\CheckResult;
use App\Services\Storefront\CheckResults;
use Database\Seeders\CommerceSeeder;

/*
 * QA „Letzte Runde (G)“, G-02 (S2) — docs/qa/BUGS.md.
 *
 * The printable RIMIFY-Check is what a customer takes to the workshop or the Prüfer. Where its answer rests on a
 * body style or drive the vehicle data does not hold — the owner's word, or a word of the car's name — the frozen
 * verdict carries it (`vehicle.bodyForm`, `bodyFormSource`, …), but `CheckResults::present()` drops it: the page
 * says „Freigegeben für BMW 1er-Reihe 1K4“ and never that this holds only for a Kombi with Allradantrieb, nor that
 * nobody but the customer (or the name) said so. The customer's own 8.1, 8.2 and T are printed; this is not.
 */

// The check service reaches the resolver, which reads the load-index and speed-symbol tables.
beforeEach(fn () => $this->seed(CommerceSeeder::class));

/** @return array<string, mixed> what the printable page is given */
function g02Printed(string $source): array
{
    $car = new VehicleRecord(
        id: 82, hsn: null, tsn: null, vsn: null, make: 'BMW', model: '1er-Reihe', variant: '1K4', typeDesignation: '1K4',
        buildWindow: BuildWindow::unbounded(), axleLoadFrontKg: 1000, axleLoadRearKg: 1100, maxSpeedKmh: 230,
        bodyForm: 'Kombi', driveAxle: 'Allrad',
        bodyFormSource: $source, driveAxleSource: $source,
    );

    $verdict = new FitmentVerdict(
        status: VerdictStatus::Permitted,
        vehicle: $car,
        wheel: null,
        document: null,
        requiresEntry: false,
        entryNoteDe: null,
        conditions: [],
        front: AxleRequirement::none(),
        rear: AxleRequirement::none(),
        reason: null,
        snapshot: new VerdictSnapshot(null, null, new DateTimeImmutable('2026-09-29T10:00:00Z'), EngineVersion::CURRENT),
    );

    // Never saved: the page is built from the frozen verdict alone (no document, so no lookup either).
    $result = (new CheckResult)->forceFill([
        'token' => str_repeat('a', 32),
        'vehicle_id' => 82,
        'wheel_config_id' => 1,
        'approval_document_id' => null,
        'document_revision' => null,
        'verdict_status' => $verdict->status->value,
        'verdict' => $verdict->toArray(),
        'papers' => null,
        'engine_version' => EngineVersion::CURRENT,
        'computed_at' => now(),
    ]);

    $printed = app(CheckResults::class)->present($result);
    expect($printed)->not->toBeNull();

    return $printed ?? [];
}

it('G-02: the printable check names the body style and drive its answer rests on', function (string $source): void {
    $printed = g02Printed($source);
    $text = (string) json_encode($printed, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

    // The car's name says neither word: whatever says them is the assumption, printed.
    expect((string) $printed['vehicle'])->not->toContain('Kombi')->not->toContain('Allrad')
        ->and($text)->toContain('Kombi')
        ->and($text)->toContain('Allrad');
})->with([
    'the owner said so' => [VehicleBuild::FROM_CUSTOMER],
    'a word of the name said so' => [VehicleBuild::FROM_NAME],
]);
