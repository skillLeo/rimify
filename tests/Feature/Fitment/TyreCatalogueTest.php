<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\TyreCatalogue;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Infrastructure\EloquentTyreCatalogue;
use App\Models\Brand;
use App\Models\TyreVariant;
use Illuminate\Support\Facades\DB;

/*
 * The engine's tyre catalogue against real MySQL (spec §3.1). The unit tests exercise
 * TyreEligibility through an in-memory fake that mirrors this contract; these tests hold the
 * real implementation to the same contract — size identity, the in-stock filter, soft deletes,
 * cheapest first — and to R-14: every size value is bound, never written into the SQL.
 */

/** @return list<array{query: string, bindings: list<mixed>}> */
function tyreVariantQueries(): array
{
    /** @var list<array{query: string, bindings: list<mixed>, time: float|null}> $log */
    $log = DB::getQueryLog();

    return array_values(array_filter(
        $log,
        static fn (array $entry): bool => str_contains($entry['query'], 'tyre_variants'),
    ));
}

/** The catalogue exactly as every surface receives it: through the container binding. */
function tyreCatalogue(): TyreCatalogue
{
    return app(TyreCatalogue::class);
}

/** `245/45 R18` — the size every case below asks for. */
function size245(): TyreSize
{
    return new TyreSize(245, 45, 18.0);
}

it('binds the tyre catalogue contract to the Eloquent implementation', function (): void {
    expect(tyreCatalogue())->toBeInstanceOf(EloquentTyreCatalogue::class)
        ->and(app(TyreCatalogue::class))->toBe(tyreCatalogue());
});

it('returns nothing for an empty size list without asking the database', function (): void {
    TyreVariant::factory()->size(245, 45, 18.0)->create();

    DB::enableQueryLog();

    expect(tyreCatalogue()->inSizes([]))->toBe([])
        ->and(tyreVariantQueries())->toBe([]);
});

it('finds the tyres in the requested sizes and no others', function (): void {
    $wanted = TyreVariant::factory()->size(245, 45, 18.0)->count(2)->create();
    $alsoWanted = TyreVariant::factory()->size(225, 40, 18.0)->create();
    // Same width and aspect, one inch larger: a different tyre, never a match.
    TyreVariant::factory()->size(245, 45, 19.0)->create();
    TyreVariant::factory()->size(255, 45, 18.0)->create();

    $found = tyreCatalogue()->inSizes([size245(), new TyreSize(225, 40, 18.0)]);
    $ids = array_map(static fn (TyreRecord $tyre): int => $tyre->id, $found);

    expect($found)->toHaveCount(3)
        ->and($found)->each->toBeInstanceOf(TyreRecord::class)
        ->and($ids)->toContain(...$wanted->modelKeys())
        ->and($ids)->toContain($alsoWanted->id);
});

it('binds every size value rather than writing it into the SQL', function (): void {
    TyreVariant::factory()->size(245, 45, 18.0)->create();

    DB::enableQueryLog();
    tyreCatalogue()->inSizes([size245()]);

    $queries = tyreVariantQueries();

    expect($queries)->toHaveCount(1);

    ['query' => $sql, 'bindings' => $bindings] = $queries[0];

    // Three bound equalities per size plus the bound stock threshold; nothing else carries a value.
    expect($bindings)->toBe([245, 45, 18.0, 0])
        ->and($sql)->not->toMatch('/\b(245|45|18)\b/')
        ->and($sql)->toContain('`width_mm` = ?', '`aspect` = ?', '`diameter_in` = ?', '`stock_qty` > ?')
        ->and($sql)->not->toContain('(width_mm, aspect, diameter_in)');
});

it('asks for a size once, however often it is listed', function (): void {
    TyreVariant::factory()->size(245, 45, 18.0)->create();

    DB::enableQueryLog();
    $found = tyreCatalogue()->inSizes([size245(), new TyreSize(245, 45, 18.0), size245()]);

    expect($found)->toHaveCount(1)
        ->and(substr_count(tyreVariantQueries()[0]['query'], '`width_mm` = ?'))->toBe(1);
});

it('orders cheapest first, then by id, so the offer is stable between renders', function (): void {
    $dearer = TyreVariant::factory()->size(245, 45, 18.0)->create(['price_cents' => 15_900]);
    $cheapFirst = TyreVariant::factory()->size(245, 45, 18.0)->create(['price_cents' => 9_900]);
    $cheapSecond = TyreVariant::factory()->size(245, 45, 18.0)->create(['price_cents' => 9_900]);

    $found = tyreCatalogue()->inSizes([size245()]);

    expect(array_map(static fn (TyreRecord $tyre): int => $tyre->id, $found))
        ->toBe([$cheapFirst->id, $cheapSecond->id, $dearer->id])
        ->and($found[0]->priceCents)->toBe(9_900)
        ->and($found[2]->priceCents)->toBe(15_900);
});

it('leaves out-of-stock tyres out unless asked for them', function (): void {
    $inStock = TyreVariant::factory()->size(245, 45, 18.0)->create(['stock_qty' => 4]);
    $soldOut = TyreVariant::factory()->size(245, 45, 18.0)->outOfStock()->create();

    $offered = tyreCatalogue()->inSizes([size245()]);
    $listed = tyreCatalogue()->inSizes([size245()], inStockOnly: false);

    expect(array_map(static fn (TyreRecord $tyre): int => $tyre->id, $offered))->toBe([$inStock->id])
        ->and(array_map(static fn (TyreRecord $tyre): int => $tyre->id, $listed))
        ->toContain($inStock->id, $soldOut->id)
        ->and($listed)->toHaveCount(2);

    // The record carries the truth the caller then compares against the quantity.
    $soldOutRecord = array_values(array_filter($listed, static fn (TyreRecord $t): bool => $t->id === $soldOut->id))[0];

    expect($soldOutRecord->stockQty)->toBe(0)
        ->and($soldOutRecord->isInStock())->toBeFalse();
});

it('never returns a soft-deleted tyre, with or without the stock filter', function (): void {
    $live = TyreVariant::factory()->size(245, 45, 18.0)->create(['stock_qty' => 4]);
    $gone = TyreVariant::factory()->size(245, 45, 18.0)->create(['stock_qty' => 4]);
    $gone->delete();

    // Soft-deleted: gone from the default scope, still on disk for the compliance trail.
    expect(TyreVariant::find($gone->id))->toBeNull()
        ->and(TyreVariant::withTrashed()->find($gone->id))->not->toBeNull();

    foreach ([true, false] as $inStockOnly) {
        $ids = array_map(
            static fn (TyreRecord $tyre): int => $tyre->id,
            tyreCatalogue()->inSizes([size245()], $inStockOnly),
        );

        expect($ids)->toBe([$live->id]);
    }
});

it('carries brand, name, season and the comparison fields onto the record', function (): void {
    $brand = Brand::factory()->named('Bridgestone')->create();
    $tyre = TyreVariant::factory()
        ->for($brand)
        ->size(245, 45, 18.0)
        ->withSpeedSymbol('Y')
        ->create([
            'name' => 'Potenza Sport',
            'season' => 'sommer',
            'load_index' => 100,
            'price_cents' => 18_900,
            'stock_qty' => 12,
        ]);

    $found = tyreCatalogue()->inSizes([size245()]);

    expect($found)->toHaveCount(1)
        ->and($found[0]->id)->toBe($tyre->id)
        ->and($found[0]->brandName)->toBe('Bridgestone')
        ->and($found[0]->name)->toBe('Potenza Sport')
        ->and($found[0]->season)->toBe('sommer')
        ->and($found[0]->widthMm)->toBe(245)
        ->and($found[0]->aspect)->toBe(45)
        ->and($found[0]->diameterIn)->toBe(18.0)
        ->and($found[0]->loadIndex)->toBe(100)
        ->and($found[0]->speedSymbol)->toBe('Y')
        ->and($found[0]->speedRank)->toBe($tyre->speed_rank)
        ->and($found[0]->priceCents)->toBe(18_900)
        ->and($found[0]->stockQty)->toBe(12)
        ->and($found[0]->size()->matches(size245()))->toBeTrue()
        ->and($found[0]->label())->toBe('245/45 R18 100Y');
});

it('maps a model without its brand loaded to a record with no brand name', function (): void {
    $tyre = TyreVariant::factory()->size(225, 40, 18.0)->make(['name' => 'PremiumContact 7']);

    $record = EloquentTyreCatalogue::toRecord($tyre);

    expect($record->brandName)->toBeNull()
        ->and($record->name)->toBe('PremiumContact 7')
        ->and($record->widthMm)->toBe(225);
});
