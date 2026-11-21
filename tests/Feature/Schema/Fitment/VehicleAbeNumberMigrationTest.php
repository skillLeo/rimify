<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\ResetFixture;

/*
 * D-502: field K's national ABE number („C640*“) kept on the car, information only. Up fills it for cars already imported from
 * their own record of the row; down drops it; the round trip leaves the schema as it was. In a database of its own.
 */

function vehicleAbeMigration(): Migration
{
    return require database_path('migrations/2026_11_21_000300_vehicle_abe_number.php');
}

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('fills the ABE number of a car already imported from its record of the row, and leaves an EG number where it is', function (): void {
    $migration = vehicleAbeMigration();
    $migration->down();

    $base = ['make' => 'Prüfmarke', 'model' => 'Alt', 'source' => 'import_kba', 'build_from' => '1982-12-01', 'build_to' => '1987-01-31', 'needs_review' => true, 'created_at' => now(), 'updated_at' => now()];
    $old = DB::table('vehicles')->insertGetId([...$base, 'hsn' => '9990', 'tsn' => 'A01', 'variant' => 'Alt 1', 'source_vehicle_id' => 990001, 'raw' => json_encode(['import' => ['row' => ['eg_nummer' => 'C640*']]])]);
    $new = DB::table('vehicles')->insertGetId([...$base, 'hsn' => '9990', 'tsn' => 'A02', 'variant' => 'Neu 1', 'source_vehicle_id' => 990002, 'eg_nummer_raw' => 'e1*2001/116*0447*11', 'raw' => json_encode(['import' => ['row' => ['eg_nummer' => 'e1*2001/116*0447*11']]])]);

    $migration->up();

    expect(DB::table('vehicles')->where('id', $old)->value('abe_nummer_raw'))->toBe('C640*')
        ->and(DB::table('vehicles')->where('id', $new)->value('abe_nummer_raw'))->toBeNull()
        ->and(DB::table('vehicles')->where('id', $new)->value('eg_nummer_raw'))->toBe('e1*2001/116*0447*11');
});

it('goes down and up again: the schema as before, the record of the row untouched', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    $migration = vehicleAbeMigration();

    $migration->down();

    expect(Schema::hasColumn('vehicles', 'abe_nummer_raw'))->toBeFalse()
        ->and(Schema::hasColumn('vehicle_import_stage', 'abe_nummer_raw'))->toBeFalse();

    $migration->up();

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before);
});
