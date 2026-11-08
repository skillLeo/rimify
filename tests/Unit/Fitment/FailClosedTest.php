<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Tyres\TyrePairingTable;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\VehicleFixtures;

/*
 * Where the engine is missing what it needs, it says so — „Noch nicht bestätigt“, never a grant (CLAUDE.md §2, R-03, R-07).
 * Each case here is one way the record can be short, and each must come out UNKNOWN with the reason that names it (D-433).
 */

/** The fixture RS 4 with what the test changes about it. */
function fcCar(bool $deleted = false, ?int $front = 1210, ?int $rear = 1235, ?int $speed = 280): VehicleRecord
{
    $car = VehicleFixtures::rs4First();

    return new VehicleRecord(
        id: $car->id, hsn: $car->hsn, tsn: $car->tsn, vsn: $car->vsn, make: $car->make, model: $car->model, variant: $car->variant,
        typeDesignation: $car->typeDesignation, buildWindow: $car->buildWindow, axleLoadFrontKg: $front, axleLoadRearKg: $rear,
        maxSpeedKmh: $speed, powerKw: $car->powerKw, powerPs: $car->powerPs, bodyForm: $car->bodyForm, driveAxle: $car->driveAxle,
        doors: $car->doors, seats: $car->seats, isDeleted: $deleted,
    );
}

it('answers nothing for a car taken out of the data, for every configuration asked about at once', function (): void {
    $verdicts = FitmentFixtures::resolver([FitmentFixtures::row()])->resolveManyForVehicle(fcCar(deleted: true), [FitmentFixtures::WHEEL_CONFIG_ID, 999]);

    expect(array_keys($verdicts))->toBe([FitmentFixtures::WHEEL_CONFIG_ID, 999]);

    foreach ($verdicts as $verdict) {
        expect($verdict->status)->toBe(VerdictStatus::Unknown)
            ->and($verdict->reason?->code)->toBe(VerdictReason::VEHICLE_INCOMPLETE);
    }

    expect($verdicts[FitmentFixtures::WHEEL_CONFIG_ID]->wheel?->id)->toBe(FitmentFixtures::WHEEL_CONFIG_ID)
        ->and($verdicts[999]->wheel)->toBeNull();
});

it('confirms nothing while a code on the row is one its own document does not define — the sentence is missing, so the answer is', function (): void {
    $clean = FitmentFixtures::row();
    $row = new FitmentRow(
        id: $clean->id, document: $clean->document, vehicleId: $clean->vehicleId, wheelConfigId: $clean->wheelConfigId, axle: 'ALL',
        buildWindow: BuildWindow::unbounded(), permittedWidthMin: null, permittedWidthMax: null, permittedEtMin: null, permittedEtMax: null,
        requiresEntry: false, tyreSizes: [new TyreSize(245, 45, 18.0)], unresolvedCodes: ['A99'],
    );

    $verdict = FitmentFixtures::resolver([$row])->resolveForVehicle(fcCar(), FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->reason?->code)->toBe(VerdictReason::CONDITION_UNRESOLVED)
        ->and($verdict->document?->id)->toBe($clean->document->id)
        // The same row without the undefined code is a grant: the code alone is what holds it back.
        ->and(FitmentFixtures::resolver([$clean])->resolveForVehicle(fcCar(), FitmentFixtures::WHEEL_CONFIG_ID)->status)->toBe(VerdictStatus::Permitted);
});

it('confirms no tyres where the document lists its combinations by vehicle type and none takes in this car (D-358)', function (): void {
    $base = FitmentFixtures::document();
    $document = new DocumentRecord(
        id: $base->id, kind: $base->kind, number: $base->number, revision: $base->revision, issuedOn: $base->issuedOn,
        pdfKey: $base->pdfKey, pdfSha256: $base->pdfSha256, sourcePage: $base->sourcePage, speedDerating: $base->speedDerating,
        completeness: $base->completeness, tyreCombinations: TyrePairingTable::unmatched(9),
    );

    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(document: $document)])->resolveForVehicle(fcCar(), FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->status)->not->toBe(VerdictStatus::Permitted)
        ->and($verdict->status)->not->toBe(VerdictStatus::Conditional)
        ->and($verdict->tyre?->papersOwed)->toBe([]);
});

it('confirms no tyres for an axle heavier than the load-index table reaches — never a guessed index', function (): void {
    // 3.600 kg on the front axle is 1.800 kg a tyre, beyond the passenger-car table.
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row()])->resolveForVehicle(fcCar(front: 3600), FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and(implode(' ', $verdict->tyre?->lines ?? []))->toContain("Für eine Achslast von 3.600\u{00A0}kg nennt die Tragfähigkeitstabelle keinen Index");
});
