<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Where a car came from (BUGS.md DATA-01). The 74 development cars carry made-up type keys; the live
 * shop's cars will come from an authoritative vehicle data import. So a car now says which it is:
 *
 *   - `source`: `entwicklung` for the development seeder, `import:<dataset>` for an authoritative import
 *     (the one that does not exist yet — BLOCKED.md, top). Only an imported car may be named by a
 *     freigegebenes Gutachten (DocumentRelease).
 *   - `is_demo` / `demo_ref`: the development cars are demo rows like every other (R-12's rule of
 *     birth), so `demo:purge` and `demo:assert-clean` cover them. A car is never hard-deleted (R-04):
 *     the purge soft-deletes it.
 *
 * Every car already in a database came from the seeder — there is no import yet — so every one is
 * marked development data here, before the trigger that keeps the mark fixed exists.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $t): void {
            $t->string('source', 48)->default('entwicklung')->after('source_vehicle_id')->index();
            $t->boolean('is_demo')->default(false)->index();
            $t->string('demo_ref', 48)->nullable()->unique();
        });

        DB::table('vehicles')->update([
            'source' => 'entwicklung',
            'is_demo' => true,
            'demo_ref' => DB::raw("CONCAT('demo:vehicle:', COALESCE(source_vehicle_id, CONCAT('id-', id)))"),
        ]);

        DB::statement('ALTER TABLE vehicles ADD CONSTRAINT chk_veh_demo CHECK ((is_demo = 0 AND demo_ref IS NULL) OR (is_demo = 1 AND demo_ref IS NOT NULL))');

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_veh_demo_fixed
            BEFORE UPDATE ON vehicles
            FOR EACH ROW
            BEGIN
                IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
                END IF;
            END
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_veh_demo_fixed');
        DB::statement('ALTER TABLE vehicles DROP CONSTRAINT chk_veh_demo');

        Schema::table('vehicles', function (Blueprint $t): void {
            $t->dropUnique(['demo_ref']);
            $t->dropIndex(['is_demo']);
            $t->dropIndex(['source']);
            $t->dropColumn(['source', 'is_demo', 'demo_ref']);
        });
    }
};
