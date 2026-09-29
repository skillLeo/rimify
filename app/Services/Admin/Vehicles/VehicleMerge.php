<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles;

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\Vehicle;
use App\Services\Admin\AuditTrail;
use App\Support\EgNumber;
use App\Support\GermanFormat;
use App\Support\VehicleName;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;

/**
 * The later merge (Block C, item 8; docs/specs/vehicles-and-tyres.md, C8): when a vehicle dataset arrives,
 * each of its cars is matched to a car typed from a Gutachten (or checked by hand) on the normalised EG
 * number AND the Fahrzeugtyp — nothing looser. The extensions a document prints — `..`, `00-09`, `04-..`, `11`
 * — decide which dataset cars a car takes in (EgNumber::covers()).
 *
 * Always a dry run first. Per dataset car:
 * - matched — exactly one car, and no other dataset car points at it: its empty fields are filled (key
 *   numbers, axle loads, top speed, build window, power). A value a person entered is never overwritten;
 *   where the dataset says otherwise, the difference is listed for a person.
 * - ambiguous — two cars fit, or several dataset cars fit one car (an EG number usually covers several
 *   engines): nothing is merged; the row waits for a person.
 * - new — no car fits: the dataset's import creates it; the merge never does.
 * - known — this dataset car was imported before: the import's own update path, not the merge's.
 *
 * Applying changes only the matched cars, in place: the id stays, so every fitment row — released or not —
 * and every order keeps pointing at the same car. No car is created, re-keyed or removed here.
 */
final class VehicleMerge
{
    public const MATCHED = 'matched';

    public const AMBIGUOUS = 'ambiguous';

    public const NEW = 'new';

    public const KNOWN = 'known';

    /** The fields a dataset may fill, dataset property → vehicle column. */
    private const FILLABLE = [
        'hsn' => 'hsn',
        'tsn' => 'tsn',
        'axleLoadFrontKg' => 'axle_load_front_kg',
        'axleLoadRearKg' => 'axle_load_rear_kg',
        'maxSpeedKmh' => 'max_speed_kmh',
        'buildFrom' => 'build_from',
        'buildTo' => 'build_to',
        'powerKw' => 'power_kw',
    ];

    /**
     * @param  iterable<DatasetVehicle>  $dataset
     * @return list<array{row: DatasetVehicle, status: string, vehicle: Vehicle|null, fills: array<string, mixed>, kept: array<string, array{ours: string, theirs: string}>, reason: string|null}>
     */
    public function plan(iterable $dataset): array
    {
        $entries = [];
        $claims = [];

        foreach ($dataset as $row) {
            $entry = $this->match($row);
            $entries[] = $entry;

            if ($entry['status'] === self::MATCHED && $entry['vehicle'] !== null) {
                $claims[$entry['vehicle']->id][] = array_key_last($entries);
            }
        }

        // Several dataset cars for one car: which engine the document meant is a person's call.
        foreach ($claims as $vehicleId => $indices) {
            if (count($indices) < 2) {
                continue;
            }

            foreach ($indices as $i) {
                $entries[$i] = [
                    ...$entries[$i],
                    'status' => self::AMBIGUOUS,
                    'fills' => [],
                    'kept' => [],
                    'reason' => sprintf('%d Fahrzeuge des Datensatzes passen zu %s. Welches gemeint ist, entscheidet eine Person.', count($indices), VehicleName::from($entries[$i]['vehicle'] ?? new Vehicle)),
                ];
            }
        }

        return $entries;
    }

    /**
     * @return array{row: DatasetVehicle, status: string, vehicle: Vehicle|null, fills: array<string, mixed>, kept: array<string, array{ours: string, theirs: string}>, reason: string|null}
     */
    private function match(DatasetVehicle $row): array
    {
        $entry = ['row' => $row, 'status' => self::NEW, 'vehicle' => null, 'fills' => [], 'kept' => [], 'reason' => null];

        if ($row->sourceVehicleId !== null && Vehicle::query()->where('source', $row->source->value)->where('source_vehicle_id', $row->sourceVehicleId)->exists()) {
            return [...$entry, 'status' => self::KNOWN, 'reason' => 'Schon aus diesem Datensatz übernommen.'];
        }

        $eg = EgNumber::parse($row->egNumber);

        if ($eg === null || $row->typeDesignation === null) {
            return [...$entry, 'reason' => 'Ohne EG-Nummer und Fahrzeugtyp wird nichts zusammengeführt.'];
        }

        // Same approval and Fahrzeugtyp, and the car's range takes in this dataset car's extension (EgNumber).
        $candidates = Vehicle::query()
            ->whereIn('source', [VehicleSource::Gutachten->value, VehicleSource::ManuellGeprueft->value])
            ->where('eg_nummer_norm', 'like', addcslashes($eg->base, '%_\\').'%')
            ->where('type_designation', $row->typeDesignation)
            ->orderBy('id')
            ->get()
            ->filter(static fn (Vehicle $v): bool => EgNumber::parse($v->getAttribute('eg_nummer_norm'))?->covers($eg) ?? false)
            ->values();

        if ($candidates->count() > 1) {
            return [...$entry, 'status' => self::AMBIGUOUS, 'reason' => sprintf(
                '%d Fahrzeuge tragen diese EG-Nummer und diesen Fahrzeugtyp: %s. Nichts wird zusammengeführt.',
                $candidates->count(),
                $candidates->map(static fn (Vehicle $v): string => VehicleName::from($v).' (#'.$v->id.')')->implode(', '),
            )];
        }

        $vehicle = $candidates->first();

        if ($vehicle === null) {
            return $entry;
        }

        [$fills, $kept] = $this->diff($vehicle, $row);

        return [...$entry, 'status' => self::MATCHED, 'vehicle' => $vehicle, 'fills' => $fills, 'kept' => $kept];
    }

    /**
     * What the dataset fills (the car's field is empty) and what it would change (the car's field is set and
     * differs — kept as it is, listed for a person). Key numbers go together or not at all.
     *
     * @return array{0: array<string, mixed>, 1: array<string, array{ours: string, theirs: string}>}
     */
    private function diff(Vehicle $vehicle, DatasetVehicle $row): array
    {
        $fills = [];
        $kept = [];

        foreach (self::FILLABLE as $property => $column) {
            $theirs = $row->{$property};
            $ours = $vehicle->getAttribute($column);

            if ($theirs === null) {
                continue;
            }

            if ($ours === null) {
                $fills[$column] = $theirs instanceof DateTimeInterface ? $theirs->format('Y-m-d') : $theirs;

                continue;
            }

            if (self::shown($ours) !== self::shown($theirs)) {
                $kept[$column] = ['ours' => self::shown($ours), 'theirs' => self::shown($theirs)];
            }
        }

        // Half a pair names no car: both key numbers are filled, or neither.
        if (array_key_exists('hsn', $fills) !== array_key_exists('tsn', $fills)) {
            unset($fills['hsn'], $fills['tsn']);
        }

        return [$fills, $kept];
    }

    private static function shown(mixed $value): string
    {
        return $value instanceof DateTimeInterface ? $value->format('m/Y') : (string) $value;
    }

    /**
     * Fills the matched cars' empty fields, in place, and nothing else. A car with its axle loads and top
     * speed now complete leaves „zur Prüfung“ (R-03). One Protokoll entry per car and one for the run.
     *
     * @param  list<array{row: DatasetVehicle, status: string, vehicle: Vehicle|null, fills: array<string, mixed>, kept: array<string, array{ours: string, theirs: string}>, reason: string|null}>  $plan
     * @return int the cars changed
     */
    public function apply(array $plan, AdminUser $admin): int
    {
        return DB::transaction(static function () use ($plan, $admin): int {
            $changed = 0;

            foreach ($plan as $entry) {
                $vehicle = $entry['vehicle'];

                if ($entry['status'] !== self::MATCHED || $vehicle === null || $entry['fills'] === []) {
                    continue;
                }

                // Read again under a lock: a person may have filled a field since the dry run.
                $fresh = Vehicle::query()->lockForUpdate()->findOrFail($vehicle->id);
                $fills = array_filter($entry['fills'], static fn (string $column): bool => $fresh->getAttribute($column) === null, ARRAY_FILTER_USE_KEY);

                if (array_key_exists('hsn', $fills) !== array_key_exists('tsn', $fills)) {
                    unset($fills['hsn'], $fills['tsn']);
                }

                if ($fills === []) {
                    continue;
                }

                $fresh->forceFill($fills);
                $fresh->needs_review = ! ($fresh->axle_load_front_kg !== null && $fresh->axle_load_rear_kg !== null && $fresh->max_speed_kmh !== null);
                $fresh->save();
                $changed++;

                AuditTrail::record($admin, 'vehicle.merged_from_dataset', [
                    'vehicle' => VehicleName::from($fresh).' · '.GermanFormat::keyNumbers($fresh->hsn, $fresh->tsn),
                    'source' => $entry['row']->source->value,
                    'fields' => array_keys($fills),
                    'kept' => array_keys($entry['kept']),
                ], $fresh);
            }

            AuditTrail::record($admin, 'vehicle.merge_applied', [
                'changed' => $changed,
                'matched' => count(array_filter($plan, static fn (array $e): bool => $e['status'] === self::MATCHED)),
                'ambiguous' => count(array_filter($plan, static fn (array $e): bool => $e['status'] === self::AMBIGUOUS)),
                'new' => count(array_filter($plan, static fn (array $e): bool => $e['status'] === self::NEW)),
            ]);

            return $changed;
        });
    }
}
