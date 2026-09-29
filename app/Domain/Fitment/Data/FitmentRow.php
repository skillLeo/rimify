<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\Condition;

/**
 * One row of a document's vehicle applicability table, as the engine reads it.
 *
 * Not "this wheel fits this car": *this document permits this wheel configuration on this vehicle
 * variant, within this build window, in these width and offset ranges, subject to these
 * conditions, requiring entry — yes or no*. Every clause of that sentence is a property here, and
 * dropping any one of them produces a system that is usually right.
 */
final readonly class FitmentRow
{
    /**
     * @param  list<TyreSize>  $tyreSizes
     * @param  list<Condition>  $conditions
     * @param  list<string>  $unresolvedCodes  codes on the row or its sizes that its own document does not define
     * @param  list<RowFilter>  $filters  body-style and drive codes: they narrow the row, they are not sentences
     */
    public function __construct(
        public int $id,
        public DocumentRecord $document,
        public int $vehicleId,
        public int $wheelConfigId,
        public string $axle,
        public BuildWindow $buildWindow,
        public ?float $permittedWidthMin,
        public ?float $permittedWidthMax,
        public ?int $permittedEtMin,
        public ?int $permittedEtMax,
        public bool $requiresEntry,
        public ?string $entryNoteDe = null,
        public array $tyreSizes = [],
        public array $conditions = [],
        /**
         * The Mittenlochbohrung THIS document states for THIS vehicle, where it states one.
         *
         * The same casting is measured against the car it was tested on, so the bore belongs to
         * the row, not to the rim: `WheelConfigRecord::centreBoreMm` is the rim's own figure and
         * this is the document's statement about it on this vehicle. Null means the document is
         * silent — never "the same as the rim's", which is a claim no document made.
         */
        public ?float $centreBoreMm = null,
        public array $unresolvedCodes = [],
        public array $filters = [],
        /**
         * The Eintragung as the row's own codes (or a Prüfer's override) derive it, before its sizes add
         * theirs — so a row narrowed to fewer sizes says it again from what remains. Null: not known apart.
         */
        public ?bool $ownRequiresEntry = null,
    ) {}

    /**
     * Whether the row's own body-style and drive codes let this vehicle in: true, false, or null when
     * they cannot be decided — which is never read as a pass. Its sizes' codes are the sizes' own
     * (TyreSize::filtersAdmit()).
     */
    public function filtersAdmit(VehicleRecord $vehicle): ?bool
    {
        return RowFilter::admitAll($this->filters, $vehicle);
    }

    /**
     * The row narrowed to the tyre sizes this vehicle may carry: a size whose own body-style or drive
     * codes exclude the car is dropped (ABE 55255 gives 390L's 225/35R19 on the rear to the Limousine
     * only, beside sizes for Limousine and Touring).
     *
     * @param  list<TyreSize>  $tyreSizes
     */
    public function withTyreSizes(array $tyreSizes): self
    {
        return new self(
            id: $this->id,
            document: $this->document,
            vehicleId: $this->vehicleId,
            wheelConfigId: $this->wheelConfigId,
            axle: $this->axle,
            buildWindow: $this->buildWindow,
            permittedWidthMin: $this->permittedWidthMin,
            permittedWidthMax: $this->permittedWidthMax,
            permittedEtMin: $this->permittedEtMin,
            permittedEtMax: $this->permittedEtMax,
            // An Abnahme only a dropped size carried is not this car's.
            requiresEntry: $this->ownRequiresEntry === null
                ? $this->requiresEntry
                : $this->ownRequiresEntry || array_filter($tyreSizes, static fn (TyreSize $s): bool => $s->requiresEntry) !== [],
            entryNoteDe: $this->entryNoteDe,
            tyreSizes: $tyreSizes,
            conditions: $this->conditions,
            centreBoreMm: $this->centreBoreMm,
            unresolvedCodes: $this->unresolvedCodes,
            filters: $this->filters,
            ownRequiresEntry: $this->ownRequiresEntry,
        );
    }

    public function coversFront(): bool
    {
        return $this->axle !== 'REAR';
    }

    public function coversRear(): bool
    {
        return $this->axle !== 'FRONT';
    }

    /**
     * Does this row's own build-window scope overlap the vehicle's?
     *
     * A row with both bounds null is not scoped by the document at all, which is a different
     * statement from "scoped to nothing" — it covers whatever the vehicle's own window is.
     */
    public function windowCovers(BuildWindow $vehicleWindow): bool
    {
        return $this->buildWindow->overlaps($vehicleWindow);
    }

    /** Is a wheel's actual width and offset inside what this row permits? */
    public function permitsGeometry(float $widthIn, int $etMm): bool
    {
        $widthOk = ($this->permittedWidthMin === null || $widthIn >= $this->permittedWidthMin)
            && ($this->permittedWidthMax === null || $widthIn <= $this->permittedWidthMax);

        $etOk = ($this->permittedEtMin === null || $etMm >= $this->permittedEtMin)
            && ($this->permittedEtMax === null || $etMm <= $this->permittedEtMax);

        return $widthOk && $etOk;
    }

    /**
     * The sizes this row permits on the named axle: the row must cover the axle AND the size
     * itself must not be scoped to the other one.
     *
     * @return list<TyreSize>
     */
    public function tyreSizesForAxle(string $axle): array
    {
        return array_values(array_filter(
            $this->tyreSizes,
            fn (TyreSize $size): bool => $this->coversAxle($axle) && $size->coversAxle($axle),
        ));
    }

    private function coversAxle(string $axle): bool
    {
        return $this->axle === 'ALL' || $this->axle === $axle;
    }

    /** Any condition that makes the verdict CONDITIONAL rather than PERMITTED. */
    public function hasPurchaseAffectingCondition(): bool
    {
        foreach ($this->conditions as $condition) {
            if ($condition->downgradesVerdict()) {
                return true;
            }
        }

        return false;
    }
}
