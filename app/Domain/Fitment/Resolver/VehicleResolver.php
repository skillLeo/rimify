<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\VehicleRecord;
use Illuminate\Support\Collection;

/**
 * Resolves what the customer typed into the set of vehicles it could mean.
 *
 * R-01: this returns a Collection, always. The single-result case is a special case of the
 * collection, not a separate branch, and there is no accessor anywhere that hands back "the first
 * match" — because in the client's own data HSN 1860 + TSN AAS is two different cars whose top
 * speeds are 280 and 290 km/h and whose front axle loads are 1210 and 1225 kg. Those are precisely
 * the two fields the legal tyre specification is derived from, so picking one silently computes
 * the requirement from the wrong car, with no error, on a page headed *passend für dein Fahrzeug*.
 */
final readonly class VehicleResolver
{
    public function __construct(private VehicleRepository $vehicles) {}

    /**
     * @return Collection<int, VehicleRecord> never null, and empty rather than throwing when the
     *                                        input is malformed — a typo is not an exception
     */
    public function byKeyNumbers(string $hsn, string $tsn): Collection
    {
        $normalisedHsn = self::normaliseHsn($hsn);
        $normalisedTsn = self::normaliseTsn($tsn);

        if ($normalisedHsn === null || $normalisedTsn === null) {
            return new Collection;
        }

        return $this->vehicles->byKeyNumbers($normalisedHsn, $normalisedTsn);
    }

    /** True when the UI must show the disambiguation step before any fitment question is asked. */
    public function needsDisambiguation(string $hsn, string $tsn): bool
    {
        return $this->byKeyNumbers($hsn, $tsn)->count() > 1;
    }

    public function find(int $id): ?VehicleRecord
    {
        return $this->vehicles->find($id);
    }

    /**
     * Four characters, upper-case, leading zeros intact. A source that supplies three is padded
     * rather than accepted: `005` and `0005` are different manufacturers.
     */
    public static function normaliseHsn(string $hsn): ?string
    {
        $value = mb_strtoupper(preg_replace('/\s+/u', '', $hsn) ?? '');

        if ($value === '' || mb_strlen($value) > 4 || preg_match('/^[0-9A-Z]+$/', $value) !== 1) {
            return null;
        }

        return str_pad($value, 4, '0', STR_PAD_LEFT);
    }

    /** One to three characters, upper-cased. `307` and `AAS` are both valid and both text. */
    public static function normaliseTsn(string $tsn): ?string
    {
        $value = mb_strtoupper(preg_replace('/\s+/u', '', $tsn) ?? '');

        if ($value === '' || mb_strlen($value) > 3 || preg_match('/^[0-9A-Z]+$/', $value) !== 1) {
            return null;
        }

        return $value;
    }
}
