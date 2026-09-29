<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Fitment\Derivation\ReferenceTables;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The reference data every verdict depends on.
 *
 * The load-index and speed-symbol rows come from ReferenceTables — the one place those figures
 * are written down — so the seed and the test oracle cannot drift apart. There is no Auflagen
 * catalogue to seed: every document brings its own list (the corrections memo §1).
 */
class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedLoadIndexTable();
        $this->seedSpeedSymbolTable();
    }

    private function seedLoadIndexTable(): void
    {
        $rows = [];

        foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
            $rows[] = ['load_index' => $index, 'capacity_kg' => $capacity];
        }

        DB::table('load_index_table')->upsert($rows, ['load_index'], ['capacity_kg']);
    }

    private function seedSpeedSymbolTable(): void
    {
        $rows = [];

        // The reference table calls it `rank`; the column is `speed_rank`, because `rank` is a
        // reserved word in MySQL 8 and an unquoted one would be a syntax error.
        foreach (ReferenceTables::SPEED_SYMBOLS as $symbol) {
            $rows[] = [
                'symbol' => $symbol['symbol'],
                'speed_rank' => $symbol['rank'],
                'max_kmh' => $symbol['max_kmh'],
            ];
        }

        DB::table('speed_symbol_table')->upsert($rows, ['symbol'], ['speed_rank', 'max_kmh']);
    }
}
