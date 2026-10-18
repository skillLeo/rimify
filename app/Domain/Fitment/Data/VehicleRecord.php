<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Domain\Fitment\Support\BuildWindow;
use App\Support\VehicleName;

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
    /**
     * @param  string|null  $hsn  null, with $tsn, for a car typed from a Gutachten until a vehicle dataset
     *                            brings its key numbers (Block C, item 7) — never invented
     */
    public function __construct(
        public int $id,
        public ?string $hsn,
        public ?string $tsn,
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
        /**
         * The car as the vehicle data has it, when the customer's own figures were laid over it (C10) — so
         * the verdict can say whether their figures made the answer stricter, and open its sum (the
         * operator's decision of 29.09.2026).
         */
        public ?VehicleRecord $beforePapers = null,
        /**
         * Where `bodyForm` and `driveAxle` came from, where the vehicle data held none (the operator's last
         * prompt §1.1): VehicleBuild::FROM_CUSTOMER — the owner said so; VehicleBuild::FROM_NAME — derived from
         * an unambiguous word of the car's name. Null: the vehicle data's own, or not known. Frozen with every
         * verdict, so a wrong answer can be traced to the assumption that produced it.
         */
        public ?string $bodyFormSource = null,
        public ?string $driveAxleSource = null,
        /**
         * The tyre index the papers name, 15.1 and 15.2, as the customer typed them (D-242): a floor for the tyre minimum
         * that can only raise it, read only where the car's axle loads and top speed are known (R-03).
         */
        public ?PapersIndex $papersIndex = null,
    ) {}

    /** This car with its body style and drive as given, and where each came from (VehicleBuild::overlay()). */
    public function withBuild(?string $bodyForm, ?string $bodyFormSource, ?string $driveAxle, ?string $driveAxleSource): self
    {
        return new self(
            id: $this->id,
            hsn: $this->hsn,
            tsn: $this->tsn,
            vsn: $this->vsn,
            make: $this->make,
            model: $this->model,
            variant: $this->variant,
            typeDesignation: $this->typeDesignation,
            buildWindow: $this->buildWindow,
            axleLoadFrontKg: $this->axleLoadFrontKg,
            axleLoadRearKg: $this->axleLoadRearKg,
            maxSpeedKmh: $this->maxSpeedKmh,
            powerKw: $this->powerKw,
            powerPs: $this->powerPs,
            bodyForm: $bodyForm,
            driveAxle: $driveAxle,
            doors: $this->doors,
            seats: $this->seats,
            needsReview: $this->needsReview,
            isDeleted: $this->isDeleted,
            beforePapers: $this->beforePapers,
            bodyFormSource: $bodyFormSource,
            driveAxleSource: $driveAxleSource,
            papersIndex: $this->papersIndex,
        );
    }

    /**
     * R-03, asked before anything else: a vehicle whose axle loads or top speed could not be
     * parsed can never produce a positive verdict, because both derivations would return null and
     * a null minimum is not "no minimum".
     */
    /** Both permitted axle loads, the papers' fields 8.1 and 8.2: what a tyre's load index and the wheel's load are checked against. */
    public function hasAxleLoads(): bool
    {
        return ! $this->isDeleted
            && $this->axleLoadFrontKg !== null && $this->axleLoadFrontKg > 0
            && $this->axleLoadRearKg !== null && $this->axleLoadRearKg > 0;
    }

    /** The top speed, the papers' field T: what a tyre's speed symbol and its derating follow from (D-277). */
    public function hasTopSpeed(): bool
    {
        return $this->maxSpeedKmh !== null && $this->maxSpeedKmh > 0;
    }

    public function hasCompleteLegalData(): bool
    {
        return ! $this->needsReview
            && ! $this->isDeleted
            && $this->axleLoadFrontKg !== null && $this->axleLoadFrontKg > 0
            && $this->axleLoadRearKg !== null && $this->axleLoadRearKg > 0
            && $this->maxSpeedKmh !== null && $this->maxSpeedKmh > 0;
    }

    /**
     * `Audi RS 4 Avant Quattro (B9)`. A car typed from a Gutachten is named by its Fahrzeugtyp, so it keeps its
     * model and needs no type after it: `BMW 1er-Reihe 187`, never `BMW 187 (187)` (Block D, D-02).
     */
    public function label(): string
    {
        $label = VehicleName::forShop($this->make, $this->model, $this->variant, $this->typeDesignation);
        $type = trim((string) $this->typeDesignation);

        return $type === '' || str_starts_with(trim($this->variant), $type) ? $label : $label.' ('.$type.')';
    }

    /** `Audi RS 4 Avant Quattro (B9), 03/2018–11/2019` — what the chooser shows. */
    public function labelWithPeriod(): string
    {
        return $this->label().', '.$this->buildWindow->labelDe();
    }

    /** `0005/BGU`, or null while no source has given the key numbers. */
    public function keyNumbers(): ?string
    {
        return $this->hsn === null || $this->tsn === null ? null : $this->hsn.'/'.$this->tsn;
    }
}
