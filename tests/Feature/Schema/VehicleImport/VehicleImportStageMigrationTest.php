<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\ResetFixture;

/*
 * D-469: the import's work table and the cars' fingerprint on a run. Down takes both away, up brings them back — in a
 * database of its own (ResetFixture) —, and the schema after is the schema before: the work table the shape of the cars,
 * without their unique keys and table checks, on either engine.
 */

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('takes the work table and the fingerprint column away and back, and the schema is as before', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    $migration = require database_path('migrations/vehicle_import/2026_11_13_000200_vehicle_import_stage.php');

    $migration->down();

    expect(Schema::hasTable('vehicle_import_stage'))->toBeFalse()
        ->and(Schema::hasColumn('vehicle_imports', 'cars_fingerprint'))->toBeFalse();

    $migration->up();

    $checks = DB::select('SELECT CONSTRAINT_NAME AS name FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_TYPE IN (?, ?)', ['vehicle_import_stage', 'CHECK', 'UNIQUE']);

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before)
        // Only its own key by run and line — and, on MariaDB, the JSON check that belongs to the column `raw`.
        ->and(array_values(array_diff(array_map(static fn (object $c): string => (string) $c->name, $checks), ['raw'])))->toBe(['uq_vehicle_import_stage_line']);
});
