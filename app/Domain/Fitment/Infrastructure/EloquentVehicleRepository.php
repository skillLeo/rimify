<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Infrastructure;

use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Support\BuildWindow;
use App\Models\Vehicle;
use Illuminate\Support\Collection;

/**
 * The only place the engine's vehicle contract meets Eloquent.
 *
 * Everything above this line is framework-free (R-13), which is what makes it structurally
 * impossible for the storefront, the admin panel, Rimify Check and the order pipeline to disagree
 * about what a key-number pair means: there is one translation, here.
 *
 * The key-number lookup is left to the collation. `utf8mb4_0900_ai_ci` matches `aas` against `AAS`
 * natively, so no `UPPER()` is applied — which keeps `idx_vehicle_keys` usable. Wrapping the
 * column in a function is the classic way to have an index and not use it.
 */
final readonly class EloquentVehicleRepository implements VehicleRepository
{
    /** @return Collection<int, VehicleRecord> */
    public function byKeyNumbers(string $hsn, string $tsn): Collection
    {
        return Vehicle::query()
            ->where('hsn', $hsn)
            ->where('tsn', $tsn)
            ->orderBy('build_from')
            ->orderBy('id')
            ->get()
            ->map(self::toRecord(...))
            ->values();
    }

    public function find(int $id): ?VehicleRecord
    {
        $vehicle = Vehicle::query()->find($id);

        return $vehicle === null ? null : self::toRecord($vehicle);
    }

    public static function toRecord(Vehicle $vehicle): VehicleRecord
    {
        return new VehicleRecord(
            id: $vehicle->id,
            hsn: $vehicle->hsn,
            tsn: $vehicle->tsn,
            vsn: $vehicle->vsn,
            make: $vehicle->make,
            model: $vehicle->model,
            variant: $vehicle->variant,
            typeDesignation: $vehicle->type_designation,
            buildWindow: BuildWindow::fromDates($vehicle->build_from, $vehicle->build_to),
            axleLoadFrontKg: $vehicle->axle_load_front_kg,
            axleLoadRearKg: $vehicle->axle_load_rear_kg,
            maxSpeedKmh: $vehicle->max_speed_kmh,
            powerKw: $vehicle->power_kw,
            powerPs: $vehicle->power_ps,
            bodyForm: $vehicle->body_form,
            driveAxle: $vehicle->drive_axle,
            doors: $vehicle->doors,
            seats: $vehicle->seats,
            needsReview: $vehicle->needs_review,
            // SoftDeletes already excludes these from the query; the flag is carried so a record
            // fetched withTrashed() elsewhere still reports the truth about itself.
            isDeleted: $vehicle->trashed(),
        );
    }
}
