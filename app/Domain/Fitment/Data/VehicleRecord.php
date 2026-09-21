<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Domain\Fitment\Support\BuildWindow;

/**
 * A vehicle variant, as the engine sees it.
 *
 * Framework-free on purpose (R-13): the storefront, the admin panel, Rimify Check and the order
 * pipeline all reason about the same shape, and none of them can reach past it to an Eloquent
 * model and ask a different question.
 *
 * `axleLoadFrontKg`, `axleLoadRearKg` and `maxSpeedKmh` are nullable because the importer stores
 * NULL rather than a coerced zero when a source value cannot be parsed (R-03). A null here is the
 * whole reason `UNKNOWN` exists.
 */
final readonly class VehicleRecord
{
    public function __construct(
        public int $id,
        public string $hsn,
        public string $tsn,
        public ?string $vsn,
        public string $make,
        public string $model,
        public string $variant,
        public ?string $typeDesignation,
        public BuildWindow $buildWindow,
        public ?int $axleLoadFrontKg,
        public ?int $axleLoadRearKg,
        public ?int $maxSpeedKmh,
        public ?int $powerKw = null,
        public ?int $powerPs = null,
        public ?string $bodyForm = null,
        public ?string $driveAxle = null,
        public ?int $doors = null,
        public ?int $seats = null,
        public bool $needsReview = false,
        public bool $isDeleted = false,
    ) {}

    /**
     * R-03, asked before anything else: a vehicle whose axle loads or top speed could not be
     * parsed can never produce a positive verdict, because both derivations would return null and
     * a null minimum is not "no minimum".
     */
    public function hasCompleteLegalData(): bool
    {
        return ! $this->needsReview
            && ! $this->isDeleted
            && $this->axleLoadFrontKg !== null && $this->axleLoadFrontKg > 0
            && $this->axleLoadRearKg !== null && $this->axleLoadRearKg > 0
            && $this->maxSpeedKmh !== null && $this->maxSpeedKmh > 0;
    }

    /** `Audi RS 4 Avant Quattro (B9)` */
    public function label(): string
    {
        $label = trim($this->make.' '.$this->variant);

        return $this->typeDesignation === null ? $label : $label.' ('.$this->typeDesignation.')';
    }

    /** `Audi RS 4 Avant Quattro (B9), 03/2018–11/2019` — what the chooser shows. */
    public function labelWithPeriod(): string
    {
        return $this->label().', '.$this->buildWindow->labelDe();
    }

    public function keyNumbers(): string
    {
        return $this->hsn.'/'.$this->tsn;
    }
}
