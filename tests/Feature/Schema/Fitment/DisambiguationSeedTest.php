<?php

declare(strict_types=1);

use App\Models\Vehicle;
use Database\Seeders\VehicleSeeder;

/*
 * The single most convincing detail in the product, asserted as data before any resolver exists:
 * one key-number pair, two genuinely different cars.
 */

beforeEach(function (): void {
    $this->seed(VehicleSeeder::class);
});

it('resolves HSN 1860 + TSN AAS to two different vehicles', function (): void {
    $matches = Vehicle::where('hsn', '1860')->where('tsn', 'AAS')->get();

    expect($matches)->toHaveCount(2);
});

it('differs on exactly the two fields the tyre specification is derived from', function (): void {
    $matches = Vehicle::where('hsn', '1860')->where('tsn', 'AAS')->orderBy('vsn')->get();

    [$first, $second] = [$matches[0], $matches[1]];

    // Same name, same key numbers — showing the name would not help a customer choose.
    expect($first->variant)->toBe($second->variant);

    // Different in the two fields that decide the legal answer.
    expect($first->max_speed_kmh)->toBe(280)
        ->and($second->max_speed_kmh)->toBe(290)
        ->and($first->axle_load_front_kg)->toBe(1210)
        ->and($second->axle_load_front_kg)->toBe(1225);

    // And in the build window, which is what a customer can actually recognise.
    expect($first->build_to)->not->toBeNull()
        ->and($second->build_to)->toBeNull();

    // VSN is the only identifier that separates them, and it is not in what the customer types.
    expect($first->vsn)->toBe('00001')->and($second->vsn)->toBe('00017');
});

it('seeds a needs_review vehicle that can never produce a positive verdict', function (): void {
    $vehicle = Vehicle::where('needs_review', true)->firstOrFail();

    expect($vehicle->hasCompleteLegalData())->toBeFalse()
        ->and($vehicle->axle_load_front_kg)->toBeNull()
        ->and($vehicle->max_speed_kmh)->toBeNull();
});

it('keeps leading zeros across the whole seeded tree', function (): void {
    // Counts are not asserted: the fleet grows whenever a make is added, and a test that has to be
    // edited for that teaches people to edit tests. What must never change is the SHAPE — an HSN
    // read back as `5` instead of `0005` is the defect this guards.
    expect(Vehicle::where('hsn', '0005')->count())->toBeGreaterThanOrEqual(3)
        ->and(Vehicle::where('hsn', '0603')->count())->toBeGreaterThanOrEqual(2)
        ->and(Vehicle::whereIn('hsn', ['0005', '0035', '0583', '0603'])->pluck('hsn')->unique()->sort()->values()->all())
        ->toBe(['0005', '0035', '0583', '0603']);

    foreach (Vehicle::pluck('hsn') as $hsn) {
        expect($hsn)->toHaveLength(4);
    }
});

it('gives every car its own maker\'s HSN and its real generation', function (): void {
    // 0035 is Opel's and 1313 Mercedes-Benz's; they were once seeded the wrong way round.
    expect(Vehicle::where('make', 'Opel')->where('model', 'Astra')->value('hsn'))->toBe('0035')
        ->and(Vehicle::where('variant', 'C 43 AMG')->value('hsn'))->toBe('1313')
        ->and(Vehicle::where('make', 'Mercedes-Benz')->pluck('hsn')->unique()->values()->all())->toBe(['1313'])
        ->and(Vehicle::where('hsn', '0035')->pluck('make')->unique()->values()->all())->toBe(['Opel']);

    // The 4,2-litre RS 4 of 2005–2008 is the B7, with a 4.2 FSI.
    $rs4 = Vehicle::where('hsn', '7967')->where('tsn', 'AAE')->firstOrFail();

    expect($rs4->type_designation)->toBe('B7')
        ->and($rs4->variant)->toBe('RS4 4.2 FSI Quattro');
});

it('seeds both a still-built and a discontinued model', function (): void {
    expect(Vehicle::whereNull('build_to')->count())->toBeGreaterThan(0)
        ->and(Vehicle::whereNotNull('build_to')->count())->toBeGreaterThan(0);
});

it('normalises every seeded EC number into the join column', function (): void {
    // The four incompatible source formats must all reduce to something joinable.
    $normalised = Vehicle::pluck('eg_nummer_norm')->filter()->all();

    expect($normalised)->not->toBeEmpty();

    foreach ($normalised as $value) {
        expect($value)->toBe(mb_strtolower($value))
            ->and($value)->not->toEndWith('*')
            ->and($value)->not->toContain('**')
            ->and($value)->not->toContain(' ');
    }
});

it('is idempotent, so a re-seed does not duplicate the disambiguation pair', function (): void {
    $before = Vehicle::count();

    $this->seed(VehicleSeeder::class);

    expect(Vehicle::where('hsn', '1860')->where('tsn', 'AAS')->count())->toBe(2)
        ->and(Vehicle::count())->toBe($before);
});
