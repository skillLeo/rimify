<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * A document's own table of the load a V, W or Y tyre may carry at speed (ABE 55255, p. 6), as data of that
 * document — never a global constant (the operator's review of C9, §5).
 *
 * Read with three different answers, because they are three different facts (§1):
 * - a percentage: apply it;
 * - the table's „–“ for the symbol: a tyre of that symbol may not be used at that speed — NOT permitted;
 * - no row for the speed, or no column for the symbol: the document does not say — UNKNOWN.
 *
 * The speed is rounded UP to the next row, never down and never interpolated (§2): 235 km/h reads the
 * 240 row. Up to 210 km/h no tyre loses load, whatever its symbol and whatever the table.
 */
final readonly class SpeedDeratingTable
{
    public const NO_DERATING_UP_TO_KMH = 210;

    /**
     * @param  array<int, array<string, int|null>>  $rows  speed → symbol → percent (null = „–“)
     */
    public function __construct(
        public array $rows,
        public ?int $sourcePage = null,
    ) {}

    public function lookup(int $topSpeedKmh, string $symbol): DeratingLookup
    {
        if ($topSpeedKmh <= self::NO_DERATING_UP_TO_KMH) {
            return DeratingLookup::percent(100);
        }

        $speeds = array_keys($this->rows);
        sort($speeds);

        foreach ($speeds as $rowKmh) {
            if ($topSpeedKmh > $rowKmh) {
                continue;
            }

            $row = $this->rows[$rowKmh];
            $needle = mb_strtoupper(trim($symbol));

            if (! array_key_exists($needle, $row)) {
                return DeratingLookup::absent($rowKmh);
            }

            return $row[$needle] === null
                ? DeratingLookup::notPermitted($rowKmh, $this->firstPermitted($row))
                : DeratingLookup::percent($row[$needle], $rowKmh);
        }

        return DeratingLookup::absent(null);
    }

    /**
     * The symbols the row marks „–“, in the table's column order — for the sentence that says so.
     *
     * @return list<string>
     */
    public function notPermittedAt(int $topSpeedKmh): array
    {
        $lookup = $this->lookup($topSpeedKmh, 'Y');
        $rowKmh = $lookup->rowKmh;

        if ($rowKmh === null || ! isset($this->rows[$rowKmh])) {
            return [];
        }

        return array_keys(array_filter($this->rows[$rowKmh], static fn (?int $percent): bool => $percent === null));
    }

    /** @param array<string, int|null> $row */
    private function firstPermitted(array $row): ?string
    {
        foreach ($row as $symbol => $percent) {
            if ($percent !== null) {
                return $symbol;
            }
        }

        return null;
    }

    /**
     * The strictest reading of several documents' tables for one axle: a „–“ anywhere is not permitted, a
     * missing table or cell anywhere is unknown, else the smallest share. Documents are never blended in
     * the permissive direction.
     *
     * @param  list<self|null>  $tables
     */
    public static function strictest(array $tables, int $topSpeedKmh, string $symbol): DeratingLookup
    {
        if ($topSpeedKmh <= self::NO_DERATING_UP_TO_KMH) {
            return DeratingLookup::percent(100);
        }

        $answer = null;

        foreach ($tables as $table) {
            $lookup = $table === null ? DeratingLookup::absent(null) : $table->lookup($topSpeedKmh, $symbol);

            if ($lookup->isNotPermitted()) {
                return $lookup;
            }

            if ($lookup->isAbsent()) {
                $answer = $answer !== null && $answer->isAbsent() ? $answer : $lookup;

                continue;
            }

            if ($answer === null || (! $answer->isAbsent() && (int) $lookup->percent < (int) $answer->percent)) {
                $answer = $lookup;
            }
        }

        return $answer ?? DeratingLookup::absent(null);
    }
}
