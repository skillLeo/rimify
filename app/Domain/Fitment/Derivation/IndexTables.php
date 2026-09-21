<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Derivation;

use App\Domain\Fitment\Exceptions\ReferenceDataMissing;

/**
 * The two reference tables, loaded once and queried by the derivations.
 *
 * An EMPTY table throws rather than returning null. The difference matters: null from a deriver
 * means "this vehicle's data is unusable", which the engine turns into UNKNOWN; an empty table
 * means the application is misconfigured, and silently treating that as "no minimum" would let
 * every tyre through on every car.
 */
final readonly class IndexTables
{
    /** @var list<LoadIndex> ascending by index */
    public array $loadIndices;

    /** @var list<SpeedSymbol> ascending by rank */
    public array $speedSymbols;

    /**
     * @param  list<LoadIndex>  $loadIndices
     * @param  list<SpeedSymbol>  $speedSymbols
     */
    public function __construct(array $loadIndices, array $speedSymbols)
    {
        if ($loadIndices === []) {
            throw ReferenceDataMissing::loadIndexTable();
        }

        if ($speedSymbols === []) {
            throw ReferenceDataMissing::speedSymbolTable();
        }

        usort($loadIndices, static fn (LoadIndex $a, LoadIndex $b): int => $a->index <=> $b->index);
        usort($speedSymbols, static fn (SpeedSymbol $a, SpeedSymbol $b): int => $a->rank <=> $b->rank);

        $this->loadIndices = $loadIndices;
        $this->speedSymbols = $speedSymbols;
    }

    /** Build from the canonical constants — used by tests and by the seeder's verification. */
    public static function fromReferenceTables(): self
    {
        $loadIndices = [];

        foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
            $loadIndices[] = new LoadIndex($index, $capacity);
        }

        $symbols = [];

        foreach (ReferenceTables::SPEED_SYMBOLS as $row) {
            $symbols[] = new SpeedSymbol($row['symbol'], $row['rank'], $row['max_kmh']);
        }

        return new self($loadIndices, $symbols);
    }

    public function loadIndex(int $index): ?LoadIndex
    {
        foreach ($this->loadIndices as $entry) {
            if ($entry->index === $index) {
                return $entry;
            }
        }

        return null;
    }

    /**
     * Resolve a symbol a document printed. Input is trimmed and upper-cased, because a document
     * transcribed by hand may carry ` y ` where the table has `Y`.
     *
     * An unrecognised symbol returns null — NEVER rank 0, which would compare as "no requirement"
     * and let every tyre through.
     */
    public function speedSymbol(?string $symbol): ?SpeedSymbol
    {
        if ($symbol === null) {
            return null;
        }

        $needle = mb_strtoupper(trim($symbol));

        if ($needle === '') {
            return null;
        }

        foreach ($this->speedSymbols as $entry) {
            if (mb_strtoupper($entry->symbol) === $needle) {
                return $entry;
            }
        }

        return null;
    }

    public function highestSpeedSymbol(): SpeedSymbol
    {
        return $this->speedSymbols[count($this->speedSymbols) - 1];
    }
}
