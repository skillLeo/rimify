<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\Vehicles\DatasetVehicle;
use App\Services\Admin\Vehicles\VehicleMerge;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;

/**
 * Block C, item 8: a bought vehicle dataset merged onto the cars typed from a Gutachten, on the EG number
 * AND the Fahrzeugtyp — a dry run first; empty fields filled, nothing a person entered overwritten; nothing
 * merged where it is not clear; no car created, re-keyed or removed, so released rows keep their car.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

/** @param array<string, mixed> $overrides */
function mergeCar(array $overrides = []): Vehicle
{
    return Vehicle::factory()->create([
        'source' => 'gutachten', 'source_document_id' => ApprovalDocument::factory()->create()->id, 'source_page' => 4,
        'source_vehicle_id' => null, 'hsn' => null, 'tsn' => null,
        'make' => 'BMW', 'model' => '4er Coupé', 'variant' => '3C', 'type_designation' => '3C',
        'eg_nummer_raw' => 'e1*2007/46*0563*..', 'build_from' => null, 'build_to' => null,
        'axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'power_kw' => null, 'needs_review' => true,
        ...$overrides,
    ]);
}

/** @param array<string, string> $overrides */
function datasetRow(array $overrides = []): DatasetVehicle
{
    return DatasetVehicle::fromRow([
        'quelle' => 'import_kba', 'fahrzeug_id' => '700001', 'hsn' => '5', 'tsn' => 'cda',
        'hersteller' => 'BMW', 'handelsname' => '4er Coupé', 'variante' => '420i', 'fahrzeugtyp' => '3C',
        'eg_nummer' => 'E1*2007/46*0563*07', 'baubeginn' => '2013-07', 'bauende' => '2020-06',
        'achslast_vorn_kg' => '1100', 'achslast_hinten_kg' => '1180', 'hoechstgeschwindigkeit_kmh' => '236', 'leistung_kw' => '135',
        ...$overrides,
    ]);
}

it('matches on EG number and Fahrzeugtyp and, in a dry run, only says what it would fill', function (): void {
    $car = mergeCar();
    $before = $car->fresh()?->toArray();

    [$entry] = app(VehicleMerge::class)->plan([datasetRow()]);

    expect($entry['status'])->toBe(VehicleMerge::MATCHED)
        ->and($entry['vehicle']?->id)->toBe($car->id)
        ->and($entry['fills'])->toBe([
            'hsn' => '0005', 'tsn' => 'CDA', 'axle_load_front_kg' => 1100, 'axle_load_rear_kg' => 1180,
            'max_speed_kmh' => 236, 'build_from' => '2013-07-01', 'build_to' => '2020-06-01', 'power_kw' => 135,
        ])
        ->and($car->fresh()?->toArray())->toBe($before);
});

it('fills the car in place — same id, released rows untouched — and it leaves „zur Prüfung“', function (): void {
    $car = mergeCar();
    $row = Fitment::factory()->create(['vehicle_id' => $car->id]);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $merge = app(VehicleMerge::class);
    $changed = $merge->apply($merge->plan([datasetRow()]), $admin);

    $car->refresh();

    expect($changed)->toBe(1)
        ->and($car->hsn)->toBe('0005')
        ->and($car->tsn)->toBe('CDA')
        ->and($car->axle_load_rear_kg)->toBe(1180)
        ->and($car->needs_review)->toBeFalse()
        // Still the car the document named, with its origin.
        ->and($car->source)->toBe('gutachten')
        ->and($row->fresh()?->vehicle_id)->toBe($car->id)
        ->and(Vehicle::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('description', 'vehicle.merged_from_dataset')->count())->toBe(1)
        ->and(AuditLog::query()->where('description', 'vehicle.merge_applied')->count())->toBe(1);
});

it('never overwrites what a person entered, and lists where the dataset says otherwise', function (): void {
    $car = mergeCar(['source' => 'manuell_geprueft', 'axle_load_front_kg' => 1120]);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $merge = app(VehicleMerge::class);
    $plan = $merge->plan([datasetRow()]);

    expect($plan[0]['kept'])->toBe(['axle_load_front_kg' => ['ours' => '1120', 'theirs' => '1100']])
        ->and($plan[0]['fills'])->not->toHaveKey('axle_load_front_kg');

    $merge->apply($plan, $admin);

    expect($car->fresh()?->axle_load_front_kg)->toBe(1120);
});

it('merges nothing where two cars fit, or where several dataset cars fit one car', function (): void {
    $a = mergeCar();
    mergeCar(['make' => 'BMW', 'model' => '4er Cabrio']);

    [$two] = app(VehicleMerge::class)->plan([datasetRow()]);

    expect($two['status'])->toBe(VehicleMerge::AMBIGUOUS)
        ->and($two['fills'])->toBe([]);

    $a->forceFill(['type_designation' => '3C-X'])->save();
    $b = Vehicle::query()->where('model', '4er Cabrio')->firstOrFail();

    // One EG number usually covers several engines: 420i and 430i both fit the one car.
    $plan = app(VehicleMerge::class)->plan([datasetRow(), datasetRow(['fahrzeug_id' => '700002', 'tsn' => 'CDB', 'variante' => '430i'])]);

    expect(array_column($plan, 'status'))->toBe([VehicleMerge::AMBIGUOUS, VehicleMerge::AMBIGUOUS])
        ->and($plan[0]['reason'])->toContain('2 Fahrzeuge des Datensatzes passen zu');

    app(VehicleMerge::class)->apply($plan, AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail());

    expect($b->fresh()?->hsn)->toBeNull();
});

it('never matches a development car, never matches without EG number and type, and never creates a car', function (): void {
    Vehicle::factory()->development()->create(['type_designation' => '3C', 'eg_nummer_raw' => 'e1*2007/46*0563*..']);
    $count = Vehicle::query()->count();

    $plan = app(VehicleMerge::class)->plan([datasetRow(), datasetRow(['fahrzeugtyp' => '', 'fahrzeug_id' => '700003'])]);

    expect(array_column($plan, 'status'))->toBe([VehicleMerge::NEW, VehicleMerge::NEW])
        ->and($plan[1]['reason'])->toBe('Ohne EG-Nummer und Fahrzeugtyp wird nichts zusammengeführt.');

    app(VehicleMerge::class)->apply($plan, AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail());

    expect(Vehicle::query()->count())->toBe($count);
});

it('reads a document’s „..“ as every extension, and a named extension as that one only', function (): void {
    $narrow = mergeCar(['eg_nummer_raw' => 'e1*2007/46*0563*11']);

    [$other] = app(VehicleMerge::class)->plan([datasetRow(['eg_nummer' => 'e1*2007/46*0563*07'])]);
    [$same] = app(VehicleMerge::class)->plan([datasetRow(['eg_nummer' => 'e1*2007/46*0563*11'])]);

    expect($other['status'])->toBe(VehicleMerge::NEW)
        ->and($same['vehicle']?->id)->toBe($narrow->id);
});

it('takes in a dataset car whose extension lies in a document’s printed range, and none outside it', function (): void {
    // ABE 55255 prints BMW 1er 187 as e1*2001/116*0287*00-09 before the facelift and *10-.. after it.
    $early = mergeCar(['make' => 'BMW', 'model' => '1er-Reihe', 'variant' => '187', 'type_designation' => '187', 'eg_nummer_raw' => 'e1*2001/116*0287*00-09']);
    $late = mergeCar(['make' => 'BMW', 'model' => '1er-Reihe', 'variant' => '187 Facelift', 'type_designation' => '187', 'eg_nummer_raw' => 'e1*2001/116*0287*10-..']);

    [$five] = app(VehicleMerge::class)->plan([datasetRow(['fahrzeugtyp' => '187', 'eg_nummer' => 'e1*2001/116*0287*05'])]);
    [$twelve] = app(VehicleMerge::class)->plan([datasetRow(['fahrzeugtyp' => '187', 'eg_nummer' => 'e1*2001/116*0287*12', 'fahrzeug_id' => '700009'])]);

    expect($five['vehicle']?->id)->toBe($early->id)
        ->and($twelve['vehicle']?->id)->toBe($late->id);
});

it('fills both key numbers or neither, and reads nothing it cannot read', function (): void {
    mergeCar();

    [$entry] = app(VehicleMerge::class)->plan([datasetRow(['tsn' => 'C?', 'achslast_vorn_kg' => '1.100', 'baubeginn' => '07/2013'])]);

    expect($entry['fills'])->not->toHaveKey('hsn')
        ->and($entry['fills'])->not->toHaveKey('tsn')
        ->and($entry['fills'])->not->toHaveKey('axle_load_front_kg')
        ->and($entry['fills'])->not->toHaveKey('build_from');
});

it('runs as a dry run from the command line, and applies only for an admin who may edit vehicles', function (): void {
    $car = mergeCar();
    $csv = tempnam(sys_get_temp_dir(), 'merge').'.csv';
    file_put_contents($csv, "\u{FEFF}quelle,fahrzeug_id,hsn,tsn,hersteller,handelsname,variante,fahrzeugtyp,eg_nummer,baubeginn,bauende,achslast_vorn_kg,achslast_hinten_kg,hoechstgeschwindigkeit_kmh,leistung_kw\n"
        ."import_kba,700001,0005,CDA,BMW,4er Coupé,420i,3C,e1*2007/46*0563*07,2013-07,,1100,1180,236,135\n");

    $this->artisan('vehicles:merge', ['file' => $csv])
        ->expectsOutputToContain('passt 1 · unklar 0 · neu 0 · bekannt 0')
        ->expectsOutputToContain('Probelauf: nichts geändert.')
        ->assertSuccessful();

    expect($car->fresh()?->hsn)->toBeNull();

    $this->artisan('vehicles:merge', ['file' => $csv, '--apply' => true, '--by' => 'support-agent@rimify.test'])->assertFailed();
    expect($car->fresh()?->hsn)->toBeNull();

    $this->artisan('vehicles:merge', ['file' => $csv, '--apply' => true, '--by' => 'super-admin@rimify.test'])
        ->expectsOutputToContain('1 Fahrzeuge ergänzt.')
        ->assertSuccessful();

    expect($car->fresh()?->hsn)->toBe('0005');
    @unlink($csv);
});
