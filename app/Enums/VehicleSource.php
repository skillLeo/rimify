<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Where a car's record came from (the user's decision of 2026-09-28 on BUGS.md DATA-01).
 *
 * What makes a car nameable by a freigegebenes Gutachten is an authoritative source, not a TSN: a car
 * typed from a real Gutachten is real vehicle data without key numbers. Only the development seeder's
 * cars — invented type keys — are never nameable, in any environment and in any test (DocumentRelease).
 */
enum VehicleSource: string
{
    case ImportKba = 'import_kba';
    case ImportTecdoc = 'import_tecdoc';
    case ImportDat = 'import_dat';
    /** Typed from a Gutachten in the admin, with the document and page it came from. */
    case Gutachten = 'gutachten';
    case ManuellGeprueft = 'manuell_geprueft';
    /** VehicleSeeder's development cars. */
    case Entwicklung = 'entwicklung';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $source): string => $source->value, self::cases());
    }

    /**
     * The sources a freigegebenes Gutachten may name. An allow-list: a source added later is refused
     * until it is put here.
     *
     * @return list<string>
     */
    public static function releasable(): array
    {
        return [
            self::ImportKba->value,
            self::ImportTecdoc->value,
            self::ImportDat->value,
            self::Gutachten->value,
            self::ManuellGeprueft->value,
        ];
    }
}
