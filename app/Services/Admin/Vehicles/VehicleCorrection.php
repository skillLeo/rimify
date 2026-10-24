<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles;

use App\Enums\VehicleSource;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;

/**
 * A vehicle typed by hand is corrected, never deleted (R-04) — while nothing refers to it yet (the admin audit's F-17).
 * A typo in a car's make, power or build window stayed for good: the fields were read-only, there is no „Entfernen“, and
 * typing the car again was refused as a twin. Once a Gutachten row, a conflict, an enquiry, an order or a check in the
 * shop names the car, its details stay as they are, so every one of those stays explainable.
 */
final class VehicleCorrection
{
    /** What a correction may change: the papers' own details — never the axle loads and the top speed, which have their own form. */
    public const FIELDS = ['make', 'model', 'variant', 'type_designation', 'hsn', 'tsn', 'eg_nummer_raw', 'power_kw', 'build_from', 'build_to', 'body_form', 'drive_axle'];

    /** What refers to a vehicle, in the words the refusal uses. */
    private const REFERENCES = [
        'fitments' => 'eine Zeile eines Gutachtens',
        'fitment_conflicts' => 'ein Konflikt zwischen Gutachten',
        'fitment_subscriptions' => 'eine Anfrage',
        'orders' => 'eine Bestellung',
        'order_line_fitments' => 'die festgehaltene Freigabe einer Bestellung',
        'check_results' => 'eine Prüfung im Shop',
    ];

    /** Why this vehicle's details cannot be corrected here; null where they can. */
    public static function refusal(Vehicle $vehicle): ?string
    {
        if ($vehicle->getAttribute('source') !== VehicleSource::ManuellGeprueft->value) {
            return 'Korrigieren lassen sich hier nur Fahrzeuge, die von Hand angelegt wurden. Dieses stammt '
                .(($vehicle->getAttribute('source') === VehicleSource::Gutachten->value) ? 'aus einem Gutachten.' : 'aus einem Fahrzeugdatensatz.');
        }

        $used = [];

        foreach (self::REFERENCES as $table => $what) {
            if (DB::table($table)->where('vehicle_id', $vehicle->id)->exists()) {
                $used[] = $what;
            }
        }

        if ($used === []) {
            return null;
        }

        $last = array_pop($used);

        return 'Auf dieses Fahrzeug verweist schon '.($used === [] ? $last : implode(', ', $used).' und '.$last)
            .'. Seine Angaben lassen sich deshalb nicht mehr ändern, damit erklärbar bleibt, was darauf beruht.';
    }

    /**
     * The details as the correction form shows them: text, the build window as `MM.JJJJ`.
     *
     * @return array<string, string>
     */
    public static function form(Vehicle $vehicle): array
    {
        $month = static fn (mixed $date): string => $date instanceof \DateTimeInterface ? $date->format('m.Y') : '';

        return [
            'make' => (string) $vehicle->make,
            'model' => (string) $vehicle->model,
            'variant' => (string) $vehicle->variant,
            'type_designation' => (string) $vehicle->getAttribute('type_designation'),
            'hsn' => (string) $vehicle->hsn,
            'tsn' => (string) $vehicle->tsn,
            'eg_number' => (string) $vehicle->getAttribute('eg_nummer_raw'),
            'power_kw' => $vehicle->getAttribute('power_kw') === null ? '' : (string) $vehicle->getAttribute('power_kw'),
            'build_from' => $month($vehicle->build_from),
            'build_to' => $month($vehicle->build_to),
            'body_form' => (string) $vehicle->getAttribute('body_form'),
            'drive_axle' => (string) $vehicle->getAttribute('drive_axle'),
        ];
    }

    /**
     * The details as they are stored, for the EditStamp of the correction form.
     *
     * @return array<string, mixed>
     */
    public static function state(int $id, bool $lock = false): array
    {
        $row = DB::table('vehicles')->where('id', $id)->when($lock, static fn ($q) => $q->lockForUpdate())->first(self::FIELDS);

        return $row === null ? [] : (array) $row;
    }
}
