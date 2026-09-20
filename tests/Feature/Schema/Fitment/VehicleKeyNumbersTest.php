<?php

declare(strict_types=1);

use App\Models\Vehicle;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/*
 * The three traps from the client's own demo export, as executable assertions.
 */

function vehicleRow(array $overrides = []): array
{
    return array_merge([
        'source_vehicle_id' => random_int(1, 1_000_000),
        'hsn' => '1860',
        'tsn' => 'AAS',
        'make' => 'Audi',
        'model' => 'RS 4',
        'variant' => 'RS 4 Avant Quattro',
        'build_from' => '2018-03-01',
        'build_to' => '2019-11-30',
        'axle_load_front_kg' => 1210,
        'axle_load_rear_kg' => 1235,
        'max_speed_kmh' => 280,
        'raw' => [],
    ], $overrides);
}

it('keeps the leading zeros on an HSN', function (): void {
    $vehicle = Vehicle::create(vehicleRow(['hsn' => '0005', 'tsn' => '582']));

    expect($vehicle->fresh()->hsn)->toBe('0005')
        ->and(DB::table('vehicles')->where('id', $vehicle->id)->value('hsn'))->toBe('0005');
});

it('left-pads a short HSN instead of storing a different manufacturer', function (): void {
    // An integer cast somewhere upstream turns '0005' into 5; padding restores the real key
    // rather than silently querying manufacturer 5000 or failing forever.
    expect(Vehicle::create(vehicleRow(['hsn' => '5']))->hsn)->toBe('0005')
        ->and(Vehicle::create(vehicleRow(['hsn' => '35']))->hsn)->toBe('0035');
});

it('stores a TSN upper-cased and still finds it when typed in lower case', function (): void {
    $vehicle = Vehicle::create(vehicleRow(['tsn' => 'aas']));

    expect($vehicle->fresh()->tsn)->toBe('AAS');

    // utf8mb4_0900_ai_ci matches case-insensitively, so the lookup needs no UPPER() and stays
    // index-eligible.
    expect(Vehicle::where('hsn', '1860')->where('tsn', 'aas')->exists())->toBeTrue()
        ->and(Vehicle::where('hsn', '1860')->where('tsn', 'AaS')->exists())->toBeTrue();
});

it('accepts a purely numeric TSN and an alphanumeric one in the same column', function (): void {
    Vehicle::create(vehicleRow(['hsn' => '7967', 'tsn' => '307']));
    Vehicle::create(vehicleRow(['hsn' => '7967', 'tsn' => 'AAE']));

    expect(Vehicle::where('hsn', '7967')->pluck('tsn')->sort()->values()->all())->toBe(['307', 'AAE']);
});

it('rejects a malformed HSN or TSN at the database level', function (array $row): void {
    // Written raw, so the model's mutators cannot rescue it: the constraint itself must hold.
    expect(fn () => DB::table('vehicles')->insert(array_merge(vehicleRow(), $row, [
        'raw' => '{}',
        'created_at' => now(),
        'updated_at' => now(),
    ])))->toThrow(QueryException::class);
})->with([
    'five characters' => [['hsn' => '00055']],
    'lower case hsn' => [['hsn' => '00a5']],
    'punctuation' => [['hsn' => '00-5']],
    'empty tsn' => [['tsn' => '']],
    'lower case tsn' => [['tsn' => 'aas']],
]);

it('treats a missing end of the build window as still in production, not as today', function (): void {
    $vehicle = Vehicle::create(vehicleRow(['build_from' => '2019-12-01', 'build_to' => null]));

    expect($vehicle->fresh()->build_to)->toBeNull()
        ->and($vehicle->isStillBuilt())->toBeTrue();
});

it('rejects an inverted build window', function (): void {
    expect(fn () => Vehicle::create(vehicleRow(['build_from' => '2020-01-01', 'build_to' => '2019-01-01'])))
        ->toThrow(QueryException::class);
});

it('refuses a zero or negative axle load so it can never derive a load index of zero', function (string $column): void {
    // A zero axle load derives a minimum load index of zero, which permits EVERY tyre. The
    // column refuses it, so the importer must store NULL + needs_review instead (R-03).
    expect(fn () => Vehicle::create(vehicleRow([$column => 0])))->toThrow(QueryException::class);
})->with(['axle_load_front_kg', 'axle_load_rear_kg', 'max_speed_kmh']);

it('stores unparseable measurements as NULL with needs_review, and reports incomplete data', function (): void {
    $vehicle = Vehicle::create(vehicleRow([
        'axle_load_front_kg' => null,
        'max_speed_kmh' => null,
        'needs_review' => true,
    ]));

    expect($vehicle->hasCompleteLegalData())->toBeFalse()
        ->and($vehicle->fresh()->needs_review)->toBeTrue();
});

it('reports complete legal data only when every derivation input is present', function (): void {
    expect(Vehicle::create(vehicleRow())->hasCompleteLegalData())->toBeTrue()
        ->and(Vehicle::create(vehicleRow(['needs_review' => true]))->hasCompleteLegalData())->toBeFalse()
        ->and(Vehicle::create(vehicleRow(['axle_load_rear_kg' => null]))->hasCompleteLegalData())->toBeFalse();
});

it('normalises EC approval numbers across the four formats the source uses', function (?string $raw, ?string $expected): void {
    expect(Vehicle::normaliseEcNumber($raw))->toBe($expected);
})->with([
    ['e1*2001/116*0447*11', 'e1*2001/116*0447*11'],
    ['E1*98/14*0105*', 'e1*98/14*0105'],
    ['A333*', 'a333'],
    ['C640*', 'c640'],
    ['  e1**2007/46*0123  ', 'e1*2007/46*0123'],
    ['e1 * 2001/116 * 0447', 'e1*2001/116*0447'],
    ['***', null],
    ['', null],
    [null, null],
]);

it('fills the normalised join column whenever the raw EC number is written', function (): void {
    $vehicle = Vehicle::create(vehicleRow(['eg_nummer_raw' => 'E1*98/14*0105*']));

    expect(DB::table('vehicles')->where('id', $vehicle->id)->value('eg_nummer_norm'))
        ->toBe('e1*98/14*0105');

    // Two rows written in different formats join on the same normalised value.
    $other = Vehicle::create(vehicleRow(['eg_nummer_raw' => ' e1*98/14*0105 ']));

    expect(DB::table('vehicles')->where('id', $other->id)->value('eg_nummer_norm'))
        ->toBe('e1*98/14*0105');
});

it('soft-deletes a vehicle instead of removing it', function (): void {
    $vehicle = Vehicle::create(vehicleRow());
    $vehicle->delete();

    expect(Vehicle::find($vehicle->id))->toBeNull()
        ->and(Vehicle::withTrashed()->find($vehicle->id))->not->toBeNull()
        ->and(DB::table('vehicles')->where('id', $vehicle->id)->exists())->toBeTrue();
});
