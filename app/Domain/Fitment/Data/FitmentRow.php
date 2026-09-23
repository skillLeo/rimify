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
    ) {}

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
