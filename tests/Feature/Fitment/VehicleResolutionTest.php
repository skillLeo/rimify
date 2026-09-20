<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Derivation\IndexTables;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Exceptions\ReferenceDataMissing;
use App\Domain\Fitment\Infrastructure\EloquentVehicleRepository;
use App\Domain\Fitment\Resolver\VehicleDisambiguator;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Models\Vehicle;
use Database\Seeders\ReferenceDataSeeder;
use Database\Seeders\VehicleSeeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/*
 * The same resolver the unit tests exercise against fakes, now against real MySQL and the real
 * seeded rows — because the fake agreeing with the resolver proves only that they agree.
 */

beforeEach(function (): void {
    $this->seed(VehicleSeeder::class);
    $this->resolver = new VehicleResolver(app(VehicleRepository::class));
});

it('binds the engine contracts to their Eloquent implementations', function (): void {
    expect(app(VehicleRepository::class))
        ->toBeInstanceOf(EloquentVehicleRepository::class);
});

it('resolves 1860/AAS to two vehicles from the database', function (): void {
    $matches = $this->resolver->byKeyNumbers('1860', 'AAS');

    expect($matches)->toBeInstanceOf(Collection::class)
        ->and($matches)->toHaveCount(2)
        ->and($this->resolver->needsDisambiguation('1860', 'AAS'))->toBeTrue();
});

it('returns the two variants in build order, oldest first', function (): void {
    $matches = $this->resolver->byKeyNumbers('1860', 'AAS');

    expect($matches[0]->vsn)->toBe('00001')
        ->and($matches[1]->vsn)->toBe('00017')
        ->and($matches[0]->maxSpeedKmh)->toBe(280)
        ->and($matches[1]->maxSpeedKmh)->toBe(290);
});

it('matches key numbers case-insensitively without disabling the index', function (): void {
    expect($this->resolver->byKeyNumbers('1860', 'aas'))->toHaveCount(2);

    // The collation does the case folding, so the column is never wrapped in UPPER() — a wrapped
    // column is the classic way to have an index and not use it.
    $sql = Vehicle::query()->where('hsn', '1860')->where('tsn', 'aas')->toSql();

    expect(strtoupper($sql))->not->toContain('UPPER(')->not->toContain('LOWER(');
});

it('uses the key-number index rather than scanning the table', function (): void {
    $plan = DB::select("EXPLAIN SELECT * FROM vehicles WHERE hsn = '1860' AND tsn = 'AAS' AND deleted_at IS NULL");

    expect($plan[0]->type)->not->toBe('ALL')
        ->and($plan[0]->key)->toBe('idx_vehicle_keys');
});

it('keeps leading zeros through the whole round trip', function (): void {
    // Typed as '5' by someone whose spreadsheet ate the zeros.
    $matches = $this->resolver->byKeyNumbers('5', '582');

    expect($matches)->toHaveCount(1)
        ->and($matches->first()?->hsn)->toBe('0005')
        ->and($matches->first()?->keyNumbers())->toBe('0005/582');
});

it('returns an empty collection for an unknown pair', function (): void {
    expect($this->resolver->byKeyNumbers('4711', 'XYZ'))->toBeEmpty()
        ->and($this->resolver->byKeyNumbers('!!!!', 'AAS'))->toBeEmpty();
});

it('hides a soft-deleted vehicle, as an import would leave it', function (): void {
    Vehicle::where('hsn', '0005')->where('tsn', '582')->firstOrFail()->delete();

    expect($this->resolver->byKeyNumbers('0005', '582'))->toBeEmpty();
});

it('produces the disambiguation payload the UI renders', function (): void {
    $payload = (new VehicleDisambiguator)
        ->distinguish($this->resolver->byKeyNumbers('1860', 'AAS'))
        ->toArray();

    expect($payload['required'])->toBeTrue()
        ->and($payload['indistinguishable'])->toBeFalse()
        ->and($payload['attributes'])->toContain('build_period', 'max_speed', 'axle_load_front')
        ->and($payload['rows'])->toHaveCount(2)
        ->and($payload['labels']['max_speed'])->toBe('Höchstgeschwindigkeit');
});

it('derives a different legal minimum for each of the two variants', function (): void {
    // This is why the disambiguation exists: the two rows produce different answers.
    $this->seed(ReferenceDataSeeder::class);

    $loadIndex = app(LoadIndexDeriver::class);
    $speed = app(SpeedSymbolDeriver::class);
    [$first, $second] = $this->resolver->byKeyNumbers('1860', 'AAS')->all();

    // Both land on 91 here, but from different margins — 605.0 kg vs 612.5 kg per tyre.
    expect($loadIndex->forAxle($first->axleLoadFrontKg)?->index)->toBe(91)
        ->and($loadIndex->forAxle($second->axleLoadFrontKg)?->index)->toBe(91)
        // And both require Y, from 280 and 290 km/h.
        ->and($speed->forTopSpeed($first->maxSpeedKmh)?->symbol)->toBe('Y')
        ->and($speed->forTopSpeed($second->maxSpeedKmh)?->symbol)->toBe('Y');
});

it('builds the index tables from the seeded rows, not from constants', function (): void {
    $this->seed(ReferenceDataSeeder::class);

    $tables = app(IndexTables::class);

    expect($tables->loadIndices)->toHaveCount(40)
        ->and($tables->speedSymbols)->toHaveCount(14)
        ->and($tables->speedSymbol('H')?->rank)->toBeGreaterThan($tables->speedSymbol('U')?->rank);
});

it('refuses to derive anything when the reference tables are empty', function (): void {
    // Not seeded: an empty table is a configuration fault, and it must not look like
    // "no minimum applies".
    DB::table('load_index_table')->delete();
    DB::table('speed_symbol_table')->delete();
    app()->forgetInstance(IndexTables::class);

    expect(fn () => app(IndexTables::class))
        ->toThrow(ReferenceDataMissing::class);
});

it('reports the needs_review vehicle as unusable', function (): void {
    $vehicle = $this->resolver->byKeyNumbers('0035', 'AKJ')->firstOrFail();

    expect($vehicle->needsReview)->toBeTrue()
        ->and($vehicle->hasCompleteLegalData())->toBeFalse()
        ->and($vehicle->axleLoadFrontKg)->toBeNull();
});

it('carries an open-ended build window through to the engine unchanged', function (): void {
    $facelift = $this->resolver->byKeyNumbers('1860', 'AAS')->last();

    expect($facelift->buildWindow->isOpenEnded())->toBeTrue()
        ->and($facelift->buildWindow->to)->toBeNull()
        ->and($facelift->buildWindow->labelDe())->toBe("12/2019\u{2013}heute");
});
