<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Models\Vehicle;

/**
 * How a car is written in an address (the client's #8, the operator's brief „THE 34“): `?fahrzeug=0005-Z90-00001` — the
 * Herstellerschlüssel, the Typschlüssel and the Variante/Version (VVS) from the Zulassungsbescheinigung, the three numbers
 * that name a car in Germany. They survive a new import of the vehicle data, which renumbers every row, so a link sent
 * today still names the same car next year. A car without all three (a row taken from a Gutachten) is written by its
 * number in the catalogue, as before; that older form is still read.
 *
 * The key names the car and nothing else: whatever the page says about the car is computed from the Gutachten when the
 * page is asked for, never read from the link.
 */
final class VehicleKey
{
    /** `0005-Z90-00001`, or the car's number where it has no complete key numbers. */
    public static function of(VehicleRecord|Vehicle $vehicle): string
    {
        [$id, $hsn, $tsn, $vsn] = $vehicle instanceof VehicleRecord
            ? [$vehicle->id, $vehicle->hsn, $vehicle->tsn, $vehicle->vsn]
            : [(int) $vehicle->id, $vehicle->hsn, $vehicle->tsn, $vehicle->vsn];

        $hsn = $hsn === null ? null : VehicleResolver::normaliseHsn($hsn);
        $tsn = $tsn === null ? null : VehicleResolver::normaliseTsn($tsn);
        $vsn = $vsn === null ? '' : mb_strtoupper(trim($vsn));

        if ($hsn === null || $tsn === null || preg_match('/^[0-9A-Z]{1,10}$/', $vsn) !== 1) {
            return (string) $id;
        }

        return "{$hsn}-{$tsn}-{$vsn}";
    }

    /**
     * What an address's `fahrzeug=` names: a car's number, or its three key numbers — null for anything else, which is
     * then ignored rather than answered with an error.
     *
     * @return array{id: int}|array{hsn: string, tsn: string, vsn: string}|null
     */
    public static function parse(mixed $raw): ?array
    {
        if (! is_string($raw)) {
            return null;
        }

        if (preg_match('/^[1-9]\d{0,9}$/', $raw) === 1) {
            return ['id' => (int) $raw];
        }

        if (preg_match('/^([0-9A-Za-z]{4})-([0-9A-Za-z]{1,3})-([0-9A-Za-z]{1,10})$/', $raw, $m) !== 1) {
            return null;
        }

        $hsn = VehicleResolver::normaliseHsn($m[1]);
        $tsn = VehicleResolver::normaliseTsn($m[2]);

        return $hsn === null || $tsn === null ? null : ['hsn' => $hsn, 'tsn' => $tsn, 'vsn' => mb_strtoupper($m[3])];
    }

    /**
     * The cars an address's key numbers name (R-01: never „the first“): one for a known car, none for an unknown one,
     * and more than one only where the data holds two cars under the same three numbers — which the page then asks about.
     *
     * @param  array{id: int}|array{hsn: string, tsn: string, vsn: string}  $key
     * @return list<VehicleRecord>
     */
    public static function candidates(array $key, VehicleResolver $vehicles): array
    {
        if (isset($key['id'])) {
            $record = $vehicles->find($key['id']);

            return $record === null || $record->isDeleted ? [] : [$record];
        }

        return array_values($vehicles->byKeyNumbers($key['hsn'], $key['tsn'])
            ->filter(static fn (VehicleRecord $v): bool => ! $v->isDeleted && $v->vsn !== null && mb_strtoupper(trim($v->vsn)) === $key['vsn'])
            ->all());
    }
}
