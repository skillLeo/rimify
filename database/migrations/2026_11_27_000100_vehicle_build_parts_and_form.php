<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The client's vehicle list v12 (his messages of 26.11.2026, D-516, D-517):
 *
 *   - **What the file says about the build period**, as it says it: the start's year and month, the end's year and month. A
 *     month the file leaves empty is stored empty — never December, never January (it was, D-478). An empty end year is a
 *     car still built (R-02).
 *   - `build_from` / `build_to` keep their meaning for every comparison: the part of the window that is **certain** — from
 *     the latest the car can have started to the earliest it can have ended. Where the months are unknown inside one year
 *     that part can be empty (start after end): nothing is certain then, so the old check `build_from <= build_to` moves
 *     to the years, which must be in order.
 *   - `body_form_raw`: the dataset's own form name („Wohnmobil“, „LKW Pritsche“), for the selector's grouping only. The
 *     controlled `body_form` the Auflagen read is untouched.
 *
 * On the car and on the import's work table, which holds the same columns (VehicleImportStageTest). Up fills year and
 * month from the dates already stored — read as known, which is what the shop showed until now; the next import of the
 * list writes what the file says. Down drops the columns and puts the old check back; a car whose certain part is empty
 * keeps its start as its end then (a window of one day, the strictest that check allows).
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['vehicles', 'vehicle_import_stage'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->unsignedSmallInteger('build_from_year')->nullable()->after('build_to')->comment('Baubeginn: Jahr, wie im Datensatz');
                $t->unsignedTinyInteger('build_from_month')->nullable()->after('build_from_year')->comment('Baubeginn: Monat; leer, wenn unbekannt');
                $t->unsignedSmallInteger('build_to_year')->nullable()->after('build_from_month')->comment('Bauende: Jahr; leer, wenn noch gebaut');
                $t->unsignedTinyInteger('build_to_month')->nullable()->after('build_to_year')->comment('Bauende: Monat; leer, wenn unbekannt');
                $t->string('body_form_raw', 64)->nullable()->after('body_form')->comment('Fahrzeugform, wie im Datensatz — nur für die Auswahl, kein Urteil liest sie');
            });
        }

        DB::statement('UPDATE vehicles SET build_from_year = YEAR(build_from), build_from_month = MONTH(build_from) WHERE build_from IS NOT NULL');
        DB::statement('UPDATE vehicles SET build_to_year = YEAR(build_to), build_to_month = MONTH(build_to) WHERE build_to IS NOT NULL');

        DB::statement('ALTER TABLE vehicles DROP CONSTRAINT chk_vehicles_build_window');
        DB::statement('ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_build_years CHECK (build_from_year IS NULL OR build_to_year IS NULL OR build_from_year <= build_to_year)');
        DB::statement('ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_build_months CHECK ((build_from_month IS NULL OR build_from_month BETWEEN 1 AND 12) AND (build_to_month IS NULL OR build_to_month BETWEEN 1 AND 12))');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE vehicles DROP CONSTRAINT chk_vehicles_build_months');
        DB::statement('ALTER TABLE vehicles DROP CONSTRAINT chk_vehicles_build_years');
        DB::statement('UPDATE vehicles SET build_to = build_from WHERE build_from IS NOT NULL AND build_to IS NOT NULL AND build_to < build_from');
        DB::statement('ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_build_window CHECK (build_from IS NULL OR build_to IS NULL OR build_from <= build_to)');

        foreach (['vehicles', 'vehicle_import_stage'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->dropColumn(['build_from_year', 'build_from_month', 'build_to_year', 'build_to_month', 'body_form_raw']);
            });
        }
    }
};
