<?php

declare(strict_types=1);

namespace Tests\Support\Fitment;

use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Support\BuildWindow;
use DateTimeImmutable;

/**
 * The vehicles the engine's unit tests reason about, matching the seeded rows exactly so a unit
 * test and a feature test cannot disagree about what `1860`/`AAS` means.
 */
final class VehicleFixtures
{
    /** Audi RS 4 Avant B9, pre-facelift: 280 km/h, 1210 kg front, build window closed. */
    public static function rs4First(): VehicleRecord
    {
        return new VehicleRecord(
            id: 1, hsn: '1860', tsn: 'AAS', vsn: '00001',
            make: 'Audi', model: 'RS 4', variant: 'RS 4 Avant Quattro', typeDesignation: 'B9',
            buildWindow: new BuildWindow(new DateTimeImmutable('2018-03-01'), new DateTimeImmutable('2019-11-30')),
            axleLoadFrontKg: 1210, axleLoadRearKg: 1235, maxSpeedKmh: 280,
            powerKw: 331, powerPs: 450, bodyForm: 'Kombi', driveAxle: 'Allrad', doors: 5, seats: 5,
        );
    }

    /** The facelift: 290 km/h, 1225 kg front, still in production. Same name, different car. */
    public static function rs4Second(): VehicleRecord
    {
        return new VehicleRecord(
            id: 2, hsn: '1860', tsn: 'AAS', vsn: '00017',
            make: 'Audi', model: 'RS 4', variant: 'RS 4 Avant Quattro', typeDesignation: 'B9',
            buildWindow: new BuildWindow(new DateTimeImmutable('2019-12-01'), null),
            axleLoadFrontKg: 1225, axleLoadRearKg: 1235, maxSpeedKmh: 290,
            powerKw: 331, powerPs: 450, bodyForm: 'Kombi', driveAxle: 'Allrad', doors: 5, seats: 5,
        );
    }

    /** BMW 3er Coupe — the HSN with significant leading zeros. */
    public static function bmw3er(): VehicleRecord
    {
        return new VehicleRecord(
            id: 3, hsn: '0005', tsn: '582', vsn: '00003',
            make: 'BMW', model: '3er', variant: '3er Coupe', typeDesignation: 'E36',
            buildWindow: new BuildWindow(new DateTimeImmutable('1995-01-01'), new DateTimeImmutable('1999-12-31')),
            axleLoadFrontKg: 900, axleLoadRearKg: 1020, maxSpeedKmh: 225,
            powerKw: 142, powerPs: 193, bodyForm: 'Coupe', driveAxle: 'Hinterachse', doors: 2, seats: 4,
        );
    }

    /** Unparseable source data: NULL loads and speed, flagged for review (R-03). */
    public static function needsReview(): VehicleRecord
    {
        return new VehicleRecord(
            id: 8, hsn: '1313', tsn: 'AKJ', vsn: '00008',
            make: 'Mercedes-Benz', model: 'C-Klasse', variant: 'C 43 AMG', typeDesignation: 'W205',
            buildWindow: new BuildWindow(new DateTimeImmutable('2016-06-01'), null),
            axleLoadFrontKg: null, axleLoadRearKg: null, maxSpeedKmh: null,
            powerKw: 287, powerPs: 390, bodyForm: 'Limousine', driveAxle: 'Allrad', doors: 4, seats: 5,
            needsReview: true,
        );
    }

    /**
     * Two candidates that differ in NOTHING a customer could see. The only separator is the VSN,
     * which is not in what they typed.
     *
     * @return array{VehicleRecord, VehicleRecord}
     */
    public static function indistinguishablePair(): array
    {
        $make = fn (int $id, string $vsn): VehicleRecord => new VehicleRecord(
            id: $id, hsn: '9999', tsn: 'ZZZ', vsn: $vsn,
            make: 'Opel', model: 'Astra', variant: 'Astra 1.4 Turbo', typeDesignation: 'K',
            buildWindow: new BuildWindow(new DateTimeImmutable('2015-10-01'), new DateTimeImmutable('2021-08-31')),
            axleLoadFrontKg: 950, axleLoadRearKg: 900, maxSpeedKmh: 210,
            powerKw: 92, powerPs: 125, bodyForm: 'Schrägheck', driveAxle: 'Vorderachse', doors: 5, seats: 5,
        );

        return [$make(20, '00020'), $make(21, '00021')];
    }

    public static function repository(): InMemoryVehicleRepository
    {
        return new InMemoryVehicleRepository([
            self::rs4First(),
            self::rs4Second(),
            self::bmw3er(),
            self::needsReview(),
        ]);
    }
}
