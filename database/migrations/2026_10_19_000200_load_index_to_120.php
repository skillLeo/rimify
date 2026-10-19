<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\ReferenceTables;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
 * The load-index table to 120 (D-310, the operator's brief of 19.10.2026 §1): the capacities Annex IV of UN/ECE Regulation
 * No 30 prints for 110 to 120, on a database that already holds the table. ReferenceDataSeeder writes it on a new one;
 * an existing one is seeded again only when ReleaseSeed's version rises, and that would run all seven of its seeders
 * on the client's preview for one table's eleven rows. This writes the table alone, from the same constant — the one
 * place the figures are written down — so the seed, the test oracle and this row set cannot drift apart.
 *
 * Only a table that holds rows is extended. A new database gets both reference tables from ReferenceDataSeeder, and a
 * seeder that finds this one filled takes the reference data for seeded: written here alone, the speed symbols stayed
 * empty, and every verdict refused to start (ReferenceDataMissing, the Feature run of 19.10.2026).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('load_index_table')->doesntExist()) {
            return;
        }

        $rows = [];

        foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
            $rows[] = ['load_index' => $index, 'capacity_kg' => $capacity];
        }

        DB::table('load_index_table')->upsert($rows, ['load_index'], ['capacity_kg']);
    }

    /** The eleven rows taken out again — where a document row still names one of them, the rollback stops there. */
    public function down(): void
    {
        DB::table('load_index_table')->whereBetween('load_index', [110, 120])->delete();
    }
};
