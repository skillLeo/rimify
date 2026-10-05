<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\VehicleSource;
use App\Models\Vehicle;

/**
 * Whether the shop can find a car by its key numbers (HSN/TSN, and the Fahrzeugschein scan that reads them). A car
 * typed from a Gutachten carries none, and the development seeds are no dataset: until an import or cars checked by
 * hand bring them, every lookup would end in „not found". So the path is closed, says so in one sentence and points
 * to Marke & Modell, and the server answers no lookup (the operator's brief of 05.10.2026, §8). `RIMIFY_FEATURE_KEY_NUMBERS`
 * forces it: `on` (the suites, whose cars are seeds), `off`, or `auto`.
 */
final class KeyNumberSearch
{
    /** What the key-number path says while it is closed. */
    public const CLOSED = 'Die Suche nach Schlüsselnummern ist erst möglich, wenn unsere Fahrzeugdaten hinterlegt sind – bis dahin findest du dein Auto über Marke & Modell.';

    /** The sources that are a dataset: what an import or a person brought, never a seed or a Gutachten's own car. */
    private const DATASETS = [
        VehicleSource::ImportKba,
        VehicleSource::ImportTecdoc,
        VehicleSource::ImportDat,
        VehicleSource::ManuellGeprueft,
    ];

    public static function available(): bool
    {
        $flag = config('rimify.features.key_numbers', 'auto');

        if ($flag === false || in_array($flag, ['off', 'false', '0'], true)) {
            return false;
        }

        if ($flag === true || in_array($flag, ['on', 'true', '1'], true)) {
            return true;
        }

        return Vehicle::query()
            ->whereIn('source', array_map(static fn (VehicleSource $s): string => $s->value, self::DATASETS))
            ->whereNotNull('hsn')
            ->whereNotNull('tsn')
            ->exists();
    }

    /** The sentence while the path is closed, or null while it is open — what the pages are given. */
    public static function closedSentence(): ?string
    {
        return self::available() ? null : self::CLOSED;
    }
}
