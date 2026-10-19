<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Models\LoadIndexEntry;
use App\Models\SpeedSymbolEntry;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
 * D-310's data migration extends a load-index table that holds rows — the preview's, which stops at 109 — and leaves a
 * new database's empty one to ReferenceDataSeeder. Filled here alone on a new database, CatalogueSeeder took the
 * reference data for seeded, the speed symbols stayed empty, and every verdict refused to start (ReferenceDataMissing in
 * 473 Feature tests on 19.10.2026).
 */
function loadIndexMigration(): Migration
{
    return require database_path('migrations/2026_10_19_000200_load_index_to_120.php');
}

it('leaves an empty table to the seeder', function (): void {
    DB::table('load_index_table')->delete();

    loadIndexMigration()->up();

    expect(DB::table('load_index_table')->count())->toBe(0);
});

it('extends a table that stops at 109 to 120, from the one constant', function (): void {
    DB::table('load_index_table')->delete();

    foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
        if ($index <= 109) {
            DB::table('load_index_table')->insert(['load_index' => $index, 'capacity_kg' => $capacity]);
        }
    }

    loadIndexMigration()->up();

    $held = DB::table('load_index_table')->orderBy('load_index')->pluck('capacity_kg', 'load_index')
        ->map(static fn (mixed $kg): int => (int) $kg)
        ->all();

    expect($held)->toBe(ReferenceTables::LOAD_INDEX_CAPACITY_KG);
});

it('seeds the speed symbols when only the load indices are there', function (): void {
    DB::table('speed_symbol_table')->delete();
    DB::table('load_index_table')->delete();
    DB::table('load_index_table')->insert(['load_index' => 91, 'capacity_kg' => 615]);

    $this->seed(CatalogueSeeder::class);

    expect(SpeedSymbolEntry::query()->count())->toBe(count(ReferenceTables::SPEED_SYMBOLS))
        ->and(LoadIndexEntry::query()->count())->toBe(count(ReferenceTables::LOAD_INDEX_CAPACITY_KG));
});
