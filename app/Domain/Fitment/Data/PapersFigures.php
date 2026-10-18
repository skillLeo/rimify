<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * The figures a customer types from their own Zulassungsbescheinigung Teil I for one car (Block C, item 10): 8.1 and
 * 8.2, the permitted axle loads front and rear, and T, the top speed. They are what the tyre half of a verdict needs
 * (R-03, amended in `9cd02ace`).
 *
 * Only what the customer gave (D-291): the form asks for what the answer is missing and shows what is known with where
 * it came from, so a record may hold T alone, or 8.2 alone where the data knows 8.1 — never nothing. The vehicle data's
 * own figures stay the data's, never copied in here; the engine lays the customer's over them (`applyTo`).
 *
 * Only whole numbers inside a range a road car can have are ever held — anything else was mistyped or made up, and is
 * refused where it is typed and dropped where it is read back. The ranges are the same in the form, the scanner
 * (`parsePapers()`) and here.
 */
final readonly class PapersFigures
{
    public const AXLE_MIN_KG = 300;

    public const AXLE_MAX_KG = 4000;

    public const SPEED_MIN_KMH = 60;

    public const SPEED_MAX_KMH = 420;

    public const POWER_MIN_KW = 10;

    public const POWER_MAX_KW = 1000;

    private function __construct(
        public ?int $axleFrontKg,
        public ?int $axleRearKg,
        public ?int $topSpeedKmh,
        /** P.2, optional: the power a Gutachten's kW band is read against (Block D), where the data has none. */
        public ?int $powerKw = null,
        /** 15.1 and 15.2, optional: the index the papers name, a floor that can only raise (D-242). */
        public ?PapersIndex $index = null,
    ) {}

    /** Null when any figure lies outside its range, or when nothing is given: no figures rather than a wrong one. */
    public static function tryFrom(?int $axleFrontKg, ?int $axleRearKg, ?int $topSpeedKmh, ?int $powerKw = null, ?PapersIndex $index = null): ?self
    {
        foreach ([$axleFrontKg, $axleRearKg] as $kg) {
            if ($kg !== null && ($kg < self::AXLE_MIN_KG || $kg > self::AXLE_MAX_KG)) {
                return null;
            }
        }

        if ($topSpeedKmh !== null && ($topSpeedKmh < self::SPEED_MIN_KMH || $topSpeedKmh > self::SPEED_MAX_KMH)) {
            return null;
        }

        if ($powerKw !== null && ($powerKw < self::POWER_MIN_KW || $powerKw > self::POWER_MAX_KW)) {
            return null;
        }

        if ($axleFrontKg === null && $axleRearKg === null && $topSpeedKmh === null && $powerKw === null && $index === null) {
            return null;
        }

        return new self($axleFrontKg, $axleRearKg, $topSpeedKmh, $powerKw, $index);
    }

    /**
     * The car as the engine reads it once its owner has typed the papers.
     *
     * Each figure the customer gave is laid over the vehicle data's, the larger of the two winning. A heavier axle and a
     * faster car only ever ask for a stronger, faster tyre, so the customer's figures can make an answer stricter and
     * never looser: a mistyped 900 kg on a car the data knows at 1.100 kg is answered for 1.100 kg. A figure the
     * customer did not give stays the data's. With all three known the car no longer waits for its legal data (R-03) —
     * that wait was for exactly these figures. A removed car stays removed.
     */
    public function applyTo(VehicleRecord $vehicle): VehicleRecord
    {
        $larger = static fn (?int $data, ?int $theirs): ?int => $theirs === null ? $data : max((int) $data, $theirs);
        $front = $larger($vehicle->axleLoadFrontKg, $this->axleFrontKg);
        $rear = $larger($vehicle->axleLoadRearKg, $this->axleRearKg);
        $speed = $larger($vehicle->maxSpeedKmh, $this->topSpeedKmh);

        return new VehicleRecord(
            id: $vehicle->id,
            hsn: $vehicle->hsn,
            tsn: $vehicle->tsn,
            vsn: $vehicle->vsn,
            make: $vehicle->make,
            model: $vehicle->model,
            variant: $vehicle->variant,
            typeDesignation: $vehicle->typeDesignation,
            buildWindow: $vehicle->buildWindow,
            axleLoadFrontKg: $front,
            axleLoadRearKg: $rear,
            maxSpeedKmh: $speed,
            // The power fills a gap and never replaces the data's: a car typed from a Gutachten has none, and a
            // size's kW band is read against P.2 then (Block D). Where the data knows it, a different P.2 is
            // the wrong variant chosen — the form says so — not a figure to answer with.
            powerKw: $vehicle->powerKw ?? $this->powerKw,
            powerPs: $vehicle->powerPs,
            bodyForm: $vehicle->bodyForm,
            driveAxle: $vehicle->driveAxle,
            doors: $vehicle->doors,
            seats: $vehicle->seats,
            needsReview: $front === null || $rear === null || $speed === null,
            isDeleted: $vehicle->isDeleted,
            beforePapers: $vehicle,
            bodyFormSource: $vehicle->bodyFormSource,
            driveAxleSource: $vehicle->driveAxleSource,
            papersIndex: $this->index,
        );
    }
}
