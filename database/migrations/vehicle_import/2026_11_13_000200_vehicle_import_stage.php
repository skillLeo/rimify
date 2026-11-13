<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * A vehicle file of any size imports on a host that stops every web request after a few minutes (D-469): the import no
 * longer writes half a million cars inside one request. It prepares them a batch at a time in a work table of the same
 * columns as `vehicles` — copied from it, and held to it by VehicleImportStageTest —, then writes them in one short
 * transaction of a few statements. The run keeps the cars' fingerprint from when its Probelauf began: the import writes
 * the plan only while the cars are still those.
 *
 * The work table holds no car of the shop: no key from it, no key into it, neither of the two unique keys of `vehicles`
 * and none of its table checks — a row is unique by its run and line, and a car is checked where it counts, on its way
 * into `vehicles`. The checks go for a second reason: MySQL names a check once per database and renames the copies,
 * MariaDB names it once per table and keeps the names, so a copy would not restore on the engine it was not written on.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE TABLE vehicle_import_stage LIKE vehicles');

        $columns = Schema::getColumnListing('vehicle_import_stage');
        $checks = DB::select('SELECT CONSTRAINT_NAME AS name FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_TYPE = ?', ['vehicle_import_stage', 'CHECK']);

        foreach ($checks as $check) {
            // A column's own check (MariaDB's JSON check on `raw`) is named after the column and lives with it.
            if (! in_array($check->name, $columns, true)) {
                DB::statement('ALTER TABLE vehicle_import_stage DROP CONSTRAINT '.DB::getQueryGrammar()->wrap((string) $check->name));
            }
        }

        Schema::table('vehicle_import_stage', function (Blueprint $t): void {
            $t->dropUnique('vehicles_demo_ref_unique');
            $t->dropUnique('uq_vehicle_source_number');
            $t->unsignedBigInteger('vehicle_import_id')->comment('the run the car is prepared for');
            $t->unsignedBigInteger('target_id')->nullable()->comment('the car an update changes; empty for a new car');
            $t->unsignedInteger('line')->comment('the row of the file');
            $t->unique(['vehicle_import_id', 'line'], 'uq_vehicle_import_stage_line');
            $t->index(['vehicle_import_id', 'target_id', 'line'], 'idx_vehicle_import_stage_run');
        });

        Schema::table('vehicle_imports', function (Blueprint $t): void {
            $t->string('cars_fingerprint', 100)->nullable()->after('attempts')->comment('the cars as the Probelauf began against them (D-469)');
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_imports', function (Blueprint $t): void {
            $t->dropColumn('cars_fingerprint');
        });

        Schema::dropIfExists('vehicle_import_stage');
    }
};
