<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Contracts\Clock;
use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\EngineVersion;
use App\Domain\Fitment\Exceptions\ReferenceDataMissing;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictSnapshot;
use App\Domain\Fitment\Verdict\VerdictStatus;

/**
 * Decides whether a wheel is legal on a car.
 *
 * Six steps, in this order, on every surface:
 *   1. resolve the vehicle
 *   2. find published rows whose build window overlaps the vehicle's
 *   3. keep the rows whose permitted width and offset contain the wheel's actual geometry
 *   4. collect the permitted tyre sizes, per axle
 *   5. apply the minima derived from the vehicle record itself
 *   6. attach the conditions and the entry flag
 *
 * The order matters. Steps 1–2 narrow by law, 3–4 by document, 5 by physics derived from the
 * vehicle, 6 adds the human-readable obligations. Reordering 2 and 5 produces results that pass
 * the physics check with no document behind them.
 *
 * Where several published rows cover the same combination the engine merges TOWARD CAUTION:
 * `requiresEntry` is OR, conditions are the union, tyre sizes are the intersection, and minima
 * take the maximum. Every one of those choices is the one that fails to a missed sale rather than
 * to a wrong answer.
 */
final readonly class FitmentResolver
{
    public function __construct(
        private VehicleRepository $vehicles,
        private FitmentRepository $fitments,
        private LoadIndexDeriver $loadIndex,
        private SpeedSymbolDeriver $speedSymbol,
        private Clock $clock,
    ) {}

    public function resolve(int $vehicleId, int $wheelConfigId): FitmentVerdict
    {
        $vehicle = $this->vehicles->find($vehicleId);

        if ($vehicle === null) {
            return $this->unknownWithoutVehicle($vehicleId, $wheelConfigId);
        }

        return $this->resolveForVehicle($vehicle, $wheelConfigId);
    }

    public function resolveForVehicle(VehicleRecord $vehicle, int $wheelConfigId): FitmentVerdict
    {
        $wheel = $this->fitments->findWheelConfig($wheelConfigId);

        // ── Step 1 · the vehicle must be usable at all ───────────────────────────────────
        // Asked before anything else: a vehicle whose axle loads or top speed could not be parsed
        // can never produce a positive verdict, because both derivations return null and a null
        // minimum is not "no minimum" (R-03). This outranks R-06 — a document stating its own
        // minimum does not rescue a vehicle we cannot characterise.
        if (! $vehicle->hasCompleteLegalData()) {
            return $this->negative(
                VerdictStatus::Unknown,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::VEHICLE_INCOMPLETE),
            );
        }

        // ── Steps 2 and 3 · rows scoped by law and by document ───────────────────────────
        $rows = $this->fitments->publishedRowsFor($vehicle->id, $wheelConfigId);

        $covering = array_values(array_filter(
            $rows,
            fn (FitmentRow $row): bool => $row->windowCovers($vehicle->buildWindow)
                && ($wheel === null || $row->permitsGeometry($wheel->widthIn, $wheel->etMm)),
        ));

        if ($covering === []) {
            return $this->negativeWithoutCoverage($vehicle, $wheel, $wheelConfigId, $rows);
        }

        // ── Steps 4, 5 and 6 · merged toward caution across every covering row ───────────
        try {
            return $this->buildPositiveVerdict($vehicle, $wheel, $covering);
        } catch (ReferenceDataMissing) {
            // A configuration fault must never present itself as a permissive legal answer.
            return $this->negative(
                VerdictStatus::Unknown,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::REFERENCE_DATA_MISSING),
            );
        }
    }

    /** @param list<FitmentRow> $covering */
    private function buildPositiveVerdict(
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        array $covering,
    ): FitmentVerdict {
        // Step 6's inputs, merged toward caution.
        $requiresEntry = false;
        $entryNotes = [];
        $conditions = [];

        foreach ($covering as $row) {
            // OR: if any document says the fitment must be entered, it must be entered.
            $requiresEntry = $requiresEntry || $row->requiresEntry;

            if ($row->requiresEntry && $row->entryNoteDe !== null && trim($row->entryNoteDe) !== '') {
                $entryNotes[$row->entryNoteDe] = true;
            }

            // Union: showing a condition that turns out not to apply costs a moment's reading;
            // omitting one that does apply costs a workshop visit nobody budgeted for.
            $conditions = Condition::union($conditions, $row->conditions);
        }

        $front = $this->axleRequirement($covering, $vehicle->axleLoadFrontKg, $vehicle->maxSpeedKmh, 'FRONT');
        $rear = $this->axleRequirement($covering, $vehicle->axleLoadRearKg, $vehicle->maxSpeedKmh, 'REAR');

        // Step 5's failure mode: the document covers the car but nothing is legally mountable.
        if (! $front->hasPermittedSizes() && ! $rear->hasPermittedSizes()) {
            return $this->negative(
                VerdictStatus::NotPermitted,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::NO_TYRE_SIZE),
                $covering[0]->document,
            );
        }

        // A minimum we could not derive is not a minimum of zero.
        if (! $front->hasUsableMinimum() || ! $rear->hasUsableMinimum()) {
            return $this->negative(
                VerdictStatus::Unknown,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::VEHICLE_INCOMPLETE),
                $covering[0]->document,
            );
        }

        $hasPurchaseAffectingCondition = false;

        foreach ($conditions as $condition) {
            if ($condition->downgradesVerdict()) {
                $hasPurchaseAffectingCondition = true;
            }
        }

        // Entry in the papers is itself something the customer must do before driving, so it
        // downgrades the verdict just as an ACTION condition does.
        $status = ($requiresEntry || $hasPurchaseAffectingCondition)
            ? VerdictStatus::Conditional
            : VerdictStatus::Permitted;

        // The document reported is the one whose row is most specific: the newest revision among
        // the covering rows, so a reissue is what the customer is shown.
        $document = $this->governingDocument($covering);

        return new FitmentVerdict(
            status: $status,
            vehicle: $vehicle,
            wheel: $wheel,
            document: $document,
            requiresEntry: $requiresEntry,
            entryNoteDe: $entryNotes === [] ? null : implode(' ', array_keys($entryNotes)),
            conditions: $conditions,
            front: $front,
            rear: $rear,
            reason: null,
            snapshot: new VerdictSnapshot(
                fitmentId: $this->governingRow($covering)->id,
                documentRevision: $document->revision,
                computedAt: $this->clock->now(),
                engineVersion: EngineVersion::CURRENT,
            ),
        );
    }

    /**
     * The permitted sizes and the governing minima for one axle.
     *
     * @param  list<FitmentRow>  $covering
     */
    private function axleRequirement(
        array $covering,
        ?int $axleLoadKg,
        ?int $maxSpeedKmh,
        string $axle,
    ): AxleRequirement {
        $sizes = null;
        $documentLoadIndex = null;
        $documentSpeedSymbol = null;

        foreach ($covering as $row) {
            if (! $this->rowCoversAxle($row, $axle)) {
                continue;
            }

            $rowSizes = array_values(array_filter(
                $row->tyreSizes,
                static fn (TyreSize $size): bool => true,
            ));

            // Intersection across documents: a size only one of them permits is not offered.
            $sizes = $sizes === null ? $rowSizes : TyreSize::intersect($sizes, $rowSizes);

            foreach ($rowSizes as $size) {
                if ($size->documentMinLoadIndex !== null) {
                    $documentLoadIndex = max($documentLoadIndex ?? 0, $size->documentMinLoadIndex);
                }

                if ($size->documentMinSpeedSymbol !== null) {
                    $documentSpeedSymbol = $size->documentMinSpeedSymbol;
                }
            }
        }

        $derivedLoadIndex = $this->loadIndex->forAxle($axleLoadKg);
        $derivedSpeedSymbol = $this->speedSymbol->forTopSpeed($maxSpeedKmh);

        // R-06: the stricter of document and derivation governs, and the verdict records which.
        [$minLoadIndex, $loadSource] = $this->stricterLoadIndex(
            $derivedLoadIndex?->index,
            $documentLoadIndex,
        );

        [$minSpeedSymbol, $speedSource] = $this->stricterSpeedSymbol(
            $derivedSpeedSymbol?->symbol,
            $documentSpeedSymbol,
        );

        return new AxleRequirement(
            sizes: $sizes ?? [],
            minLoadIndex: $minLoadIndex,
            minSpeedSymbol: $minSpeedSymbol,
            // If either half came from the document, the reasoning is "the document said so".
            minSource: ($loadSource === MinSource::Document || $speedSource === MinSource::Document)
                ? MinSource::Document
                : MinSource::Derived,
        );
    }

    /** @return array{0: int|null, 1: MinSource} */
    private function stricterLoadIndex(?int $derived, ?int $document): array
    {
        if ($derived === null) {
            // R-03 outranks R-06: without a derivation we cannot state a floor, and a document
            // minimum alone does not tell us the car can carry it.
            return [null, MinSource::Derived];
        }

        if ($document === null || $document <= $derived) {
            return [$derived, MinSource::Derived];
        }

        return [$document, MinSource::Document];
    }

    /** @return array{0: string|null, 1: MinSource} */
    private function stricterSpeedSymbol(?string $derived, ?string $document): array
    {
        if ($derived === null) {
            return [null, MinSource::Derived];
        }

        if ($document === null) {
            return [$derived, MinSource::Derived];
        }

        $derivedRank = $this->speedSymbol->rankOf($derived);
        $documentRank = $this->speedSymbol->rankOf($document);

        // An unrecognised document symbol is ignored rather than trusted: it would otherwise rank
        // as nothing and silently relax the requirement.
        if ($documentRank === null || $derivedRank === null || $documentRank <= $derivedRank) {
            return [$derived, MinSource::Derived];
        }

        return [$document, MinSource::Document];
    }

    private function rowCoversAxle(FitmentRow $row, string $axle): bool
    {
        return $axle === 'FRONT' ? $row->coversFront() : $row->coversRear();
    }

    /** @param list<FitmentRow> $covering */
    private function governingRow(array $covering): FitmentRow
    {
        $governing = $covering[0];

        foreach ($covering as $row) {
            if ($row->document->revision > $governing->document->revision) {
                $governing = $row;
            }
        }

        return $governing;
    }

    /** @param list<FitmentRow> $covering */
    private function governingDocument(array $covering): DocumentRecord
    {
        return $this->governingRow($covering)->document;
    }

    /**
     * No covering row. The distinction here is the whole reason there are four states: we either
     * hold a document and it does not cover this car, or we hold nothing at all.
     *
     * @param  list<FitmentRow>  $allRows
     */
    private function negativeWithoutCoverage(
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        int $wheelConfigId,
        array $allRows,
    ): FitmentVerdict {
        if (! $this->fitments->hasPublishedDocumentForConfig($wheelConfigId)) {
            // We hold no evidence either way — and this is what the catalogue-gap report ranks.
            return $this->negative(
                VerdictStatus::Unknown,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::NO_DOCUMENT),
            );
        }

        // Rows exist for this vehicle, so the document knows the car — the reason it failed is
        // either the build window or the geometry, and the customer deserves to be told which.
        $reasonCode = VerdictReason::NOT_COVERED;

        foreach ($allRows as $row) {
            if (! $row->windowCovers($vehicle->buildWindow)) {
                $reasonCode = VerdictReason::OUTSIDE_BUILD_WINDOW;

                break;
            }

            if ($wheel !== null && ! $row->permitsGeometry($wheel->widthIn, $wheel->etMm)) {
                $reasonCode = VerdictReason::WIDTH_OR_ET_OUTSIDE_RANGE;

                break;
            }
        }

        return $this->negative(
            VerdictStatus::NotPermitted,
            $vehicle,
            $wheel,
            VerdictReason::of($reasonCode),
            $allRows === [] ? null : $allRows[0]->document,
        );
    }

    private function unknownWithoutVehicle(int $vehicleId, int $wheelConfigId): FitmentVerdict
    {
        $placeholder = new VehicleRecord(
            id: $vehicleId,
            hsn: '0000', tsn: '000', vsn: null,
            make: '', model: '', variant: 'Unbekanntes Fahrzeug', typeDesignation: null,
            buildWindow: BuildWindow::unbounded(),
            axleLoadFrontKg: null, axleLoadRearKg: null, maxSpeedKmh: null,
            needsReview: true,
        );

        return $this->negative(
            VerdictStatus::Unknown,
            $placeholder,
            $this->fitments->findWheelConfig($wheelConfigId),
            VerdictReason::of(VerdictReason::VEHICLE_NOT_FOUND),
        );
    }

    private function negative(
        VerdictStatus $status,
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        VerdictReason $reason,
        ?DocumentRecord $document = null,
    ): FitmentVerdict {
        return FitmentVerdict::negative(
            $status,
            $vehicle,
            $wheel,
            $reason,
            $this->clock->now(),
            EngineVersion::CURRENT,
            $document,
        );
    }
}
