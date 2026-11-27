<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\ResetFixture;

/*
 * D-516/D-519: the build period's year and month beside the dates, and the dataset's own form name. Up fills year and month
 * from the dates already stored; down drops the columns and puts the old window check back — a car whose certain window is
 * empty keeps its start as its end then. The round trip leaves the schema as it was. In a database of its own.
 */

function buildPartsMigration(): Migration
{
    return require database_path('migrations/2026_11_27_000100_vehicle_build_parts_and_form.php');
}

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('fills year and month from the dates already stored, and goes down and up again to the same schema', function (): void {
    $migration = buildPartsMigration();
    $migration->down();

    $base = ['make' => 'Prüfmarke', 'model' => 'Alt', 'source' => 'import_kba', 'hsn' => '9990', 'tsn' => 'A01', 'needs_review' => false, 'raw' => '{}', 'created_at' => now(), 'updated_at' => now()];
    $id = DB::table('vehicles')->insertGetId([...$base, 'variant' => 'Alt 1', 'source_vehicle_id' => 990001, 'build_from' => '2001-01-01', 'build_to' => '2004-11-30']);
    $open = DB::table('vehicles')->insertGetId([...$base, 'tsn' => 'A02', 'variant' => 'Alt 2', 'source_vehicle_id' => 990002, 'build_from' => '2020-12-01', 'build_to' => null]);

    $migration->up();
    $before = SchemaFingerprint::of(DB::connection());

    expect((array) DB::table('vehicles')->where('id', $id)->first(['build_from_year', 'build_from_month', 'build_to_year', 'build_to_month']))
        ->toBe(['build_from_year' => 2001, 'build_from_month' => 1, 'build_to_year' => 2004, 'build_to_month' => 11])
        ->and(DB::table('vehicles')->where('id', $open)->value('build_to_year'))->toBeNull();

    // One build year, months unknown: the certain window is empty, which only the new check allows.
    DB::table('vehicles')->where('id', $id)->update(['build_from' => '2004-12-01', 'build_to' => '2004-01-31', 'build_from_year' => 2004, 'build_from_month' => null, 'build_to_year' => 2004, 'build_to_month' => null]);

    $migration->down();

    expect(Schema::hasColumn('vehicles', 'build_from_year'))->toBeFalse()
        ->and(Schema::hasColumn('vehicle_import_stage', 'body_form_raw'))->toBeFalse()
        ->and(DB::table('vehicles')->where('id', $id)->value('build_to'))->toBe('2004-12-01');

    $migration->up();

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before);
});
