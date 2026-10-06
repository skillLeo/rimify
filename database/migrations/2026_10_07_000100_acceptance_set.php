<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The acceptance set (`rimify:demo --abnahme`, the operator's brief „THE 34“ §1.3): a small shop for the client to look
 * at, every row of it born demo, so System › Zurücksetzen › Demodaten takes all of it away in one press.
 *
 * - The tables it writes that had no demo mark get one, as the R-12 tables have it: `is_demo` and `demo_ref` together
 *   (a CHECK) and fixed at insert (a trigger) — a real Gutachten, brand or accessory can never become demo data, so the
 *   purge can never take one away.
 * - Wheel models and tyres had `is_demo` alone; they get `demo_ref` beside it, which names the acceptance set's rows
 *   (`abnahme:…`). No trigger there: the e2e shop turns its example catalogue into its own (E2eShopSeeder).
 * - A demo model may be published only when it is the acceptance set's: the one place a demo row reaches the shop, and
 *   only off production (AcceptanceSet::sellable() asks the environment as well).
 */
return new class extends Migration
{
    /** Table => trigger prefix. */
    private const MARKED = [
        'approval_documents' => 'apd',
        'brands' => 'brd',
        'balance_weight_colours' => 'bwc',
        'tpms_sensor_prices' => 'tps',
    ];

    public function up(): void
    {
        foreach (self::MARKED as $table => $prefix) {
            Schema::table($table, function (Blueprint $t): void {
                $t->boolean('is_demo')->default(false)->index();
                $t->string('demo_ref', 48)->nullable()->unique();
            });

            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT chk_{$prefix}_demo CHECK ((is_demo = 0 AND demo_ref IS NULL) OR (is_demo = 1 AND demo_ref IS NOT NULL))");
            DB::unprepared(<<<SQL
                CREATE TRIGGER trg_{$prefix}_demo_fixed
                BEFORE UPDATE ON {$table}
                FOR EACH ROW
                BEGIN
                    IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
                    END IF;
                END
                SQL);
        }

        foreach (['wheel_models', 'tyre_variants'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->string('demo_ref', 48)->nullable()->unique()->after('is_demo');
            });
        }

        // DROP CONSTRAINT: understood by MySQL 8 and by MariaDB alike.
        DB::statement('ALTER TABLE wheel_models DROP CONSTRAINT wheel_models_demo_never_published');
        DB::statement("ALTER TABLE wheel_models ADD CONSTRAINT wheel_models_demo_never_published CHECK (is_demo = 0 OR status <> 'published' OR demo_ref LIKE 'abnahme:%')");
    }

    public function down(): void
    {
        DB::table('wheel_models')->where('is_demo', true)->where('status', 'published')->update(['status' => 'draft']);
        DB::statement('ALTER TABLE wheel_models DROP CONSTRAINT wheel_models_demo_never_published');
        DB::statement("ALTER TABLE wheel_models ADD CONSTRAINT wheel_models_demo_never_published CHECK (is_demo = 0 OR status <> 'published')");

        foreach (['wheel_models', 'tyre_variants'] as $table) {
            Schema::table($table, function (Blueprint $t) use ($table): void {
                $t->dropUnique("{$table}_demo_ref_unique");
                $t->dropColumn('demo_ref');
            });
        }

        foreach (self::MARKED as $table => $prefix) {
            DB::unprepared("DROP TRIGGER IF EXISTS trg_{$prefix}_demo_fixed");
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT chk_{$prefix}_demo");

            Schema::table($table, function (Blueprint $t) use ($table): void {
                $t->dropUnique("{$table}_demo_ref_unique");
                $t->dropIndex("{$table}_is_demo_index");
                $t->dropColumn(['is_demo', 'demo_ref']);
            });
        }
    }
};
