<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Models\LoadIndexEntry;
use App\Models\SpeedSymbolEntry;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * The index tables are real rows so the compliance owner can check them against a printed
 * reference, and they are seeded from ReferenceTables so the seed and the engine's oracle cannot
 * drift apart. These tests are what keeps that promise true.
 */

beforeEach(function (): void {
    $this->seed(ReferenceDataSeeder::class);
});

it('seeds every load index exactly as the reference table states', function (): void {
    expect(LoadIndexEntry::count())->toBe(count(ReferenceTables::LOAD_INDEX_CAPACITY_KG));

    foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
        expect(LoadIndexEntry::find($index)?->capacity_kg)->toBe($capacity);
    }
});

it('carries the load capacities the worked examples depend on', function (): void {
    // These three decide the verdicts in the spec's own worked vehicles.
    expect(LoadIndexEntry::find(91)?->capacity_kg)->toBe(615)
        ->and(LoadIndexEntry::find(92)?->capacity_kg)->toBe(630)
        ->and(LoadIndexEntry::find(75)?->capacity_kg)->toBe(387)
        ->and(LoadIndexEntry::find(89)?->capacity_kg)->toBe(580)
        ->and(LoadIndexEntry::find(88)?->capacity_kg)->toBe(560);
});

it('increases capacity monotonically with the load index', function (): void {
    $rows = LoadIndexEntry::orderBy('load_index')->pluck('capacity_kg', 'load_index')->all();
    $previous = 0;

    foreach ($rows as $capacity) {
        expect($capacity)->toBeGreaterThan($previous);
        $previous = $capacity;
    }
});

it('seeds the speed symbols with H between U and V', function (): void {
    $u = SpeedSymbolEntry::find('U');
    $h = SpeedSymbolEntry::find('H');
    $v = SpeedSymbolEntry::find('V');

    // The whole reason the rank exists: alphabetically H comes before U, and using the letters
    // would let a 210 km/h car be sold a tyre rated for 200.
    expect($h?->speed_rank)->toBeGreaterThan($u?->speed_rank)
        ->and($h?->speed_rank)->toBeLessThan($v?->speed_rank)
        ->and($h?->max_kmh)->toBe(210)
        ->and($u?->max_kmh)->toBe(200)
        ->and($v?->max_kmh)->toBe(240);
});

it('seeds the complete symbol table, not a subset', function (): void {
    // A truncated table does not fail loudly — it silently derives the next symbol that happens
    // to be present. That is what produced the wrong worked example in the source document
    // (docs/decisions.md D-018), so the seeded rows are asserted against the source of truth.
    expect(SpeedSymbolEntry::orderBy('speed_rank')->pluck('symbol')->all())
        ->toBe(array_column(ReferenceTables::SPEED_SYMBOLS, 'symbol'))
        ->toContain('L', 'M', 'N', 'P', 'Q', 'R', 'S', 'U');
});

it('orders every speed symbol by rank, not alphabetically', function (): void {
    $byRank = SpeedSymbolEntry::orderBy('speed_rank')->pluck('symbol')->all();

    expect($byRank)->toBe(['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', '(Y)']);

    // Sorting the same symbols as strings gives a different, wrong order.
    $alphabetical = $byRank;
    sort($alphabetical);
    expect($alphabetical)->not->toBe($byRank);
});

it('treats the open-ended top symbol as above 300, not as unknown', function (): void {
    $top = SpeedSymbolEntry::find('(Y)');

    expect($top?->max_kmh)->toBeNull()
        ->and($top?->speed_rank)->toBe(count(ReferenceTables::SPEED_SYMBOLS))
        ->and(SpeedSymbolEntry::find('Y')?->max_kmh)->toBe(300);
});

it('seeds no Auflagen catalogue: every document brings its own list (the corrections memo §1)', function (): void {
    expect(Schema::hasTable('condition_codes'))->toBeFalse()
        ->and(Schema::hasTable('condition_code_aliases'))->toBeFalse()
        ->and(Schema::hasTable('document_conditions'))->toBeTrue()
        ->and(DB::table('document_conditions')->count())->toBe(0);
});

it('is safe to run twice', function (): void {
    $this->seed(ReferenceDataSeeder::class);

    expect(LoadIndexEntry::count())->toBe(count(ReferenceTables::LOAD_INDEX_CAPACITY_KG))
        ->and(SpeedSymbolEntry::count())->toBe(count(ReferenceTables::SPEED_SYMBOLS));
});
