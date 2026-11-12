<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Derivation;

/**
 * The load a V, W or Y tyre carries at speed: ETRTO's table, the same for every Gutachten (ReferenceTables::SPEED_LOAD_PERCENT,
 * D-459). Nothing is typed or kept per paper.
 *
 * Read with three different answers, because they are three different facts:
 * - a percentage: apply it;
 * - the table's „–“ for the symbol: a tyre of that symbol may not be used at that speed, and the row names the symbol it
 *   asks for instead;
 * - no row for the speed, or no cell for the symbol: the table does not say — UNKNOWN, never estimated.
 *
 * The speed is rounded UP to the next row, never down and never interpolated (the operator's review of C9, §2): 235 km/h
 * reads the 240 row. Up to 210 km/h no tyre loses load, whatever its symbol.
 */
final class SpeedLoadTable
{
    public const FULL_LOAD_UP_TO_KMH = 210;

    private static ?self $etrto = null;

    /** @param  array<int, array<string, int|null>>  $rows  speed → symbol → percent (null = „–“) */
    private function __construct(private readonly array $rows) {}

    public static function etrto(): self
    {
        return self::$etrto ??= new self(ReferenceTables::SPEED_LOAD_PERCENT);
    }

    public function lookup(int $topSpeedKmh, string $symbol): SpeedLoadLookup
    {
        if ($topSpeedKmh <= self::FULL_LOAD_UP_TO_KMH) {
            return SpeedLoadLookup::percent(100);
        }

        $speeds = array_keys($this->rows);
        sort($speeds);
        $needle = mb_strtoupper(trim($symbol));

        foreach ($speeds as $rowKmh) {
            if ($topSpeedKmh > $rowKmh) {
                continue;
            }

            $row = $this->rows[$rowKmh];

            if (! array_key_exists($needle, $row)) {
                return SpeedLoadLookup::absent($rowKmh);
            }

            if ($row[$needle] !== null) {
                return SpeedLoadLookup::percent($row[$needle], $rowKmh);
            }

            $required = $this->firstPermitted($row);

            return $required === null ? SpeedLoadLookup::absent($rowKmh) : SpeedLoadLookup::notPermitted($rowKmh, $required);
        }

        return SpeedLoadLookup::absent(null);
    }

    /**
     * The first symbol the row lets carry a load — the slowest, since the columns run V, W, Y.
     *
     * @param  array<string, int|null>  $row
     */
    private function firstPermitted(array $row): ?string
    {
        foreach ($row as $symbol => $percent) {
            if ($percent !== null) {
                return $symbol;
            }
        }

        return null;
    }
}
