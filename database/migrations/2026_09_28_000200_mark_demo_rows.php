<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Demonstration data, marked at birth (R-12, as amended 2026-09-28; DemoDashboardSeeder).
 *
 * Every table the demo seeder writes gets `is_demo` and a deterministic `demo_ref` — the key the
 * seeder upserts on, so a second run changes nothing. The two travel together (a CHECK: a demo row
 * has its ref, a real row has none) and neither can change after the insert (a trigger per table):
 * a real row can never become a demo row, so „born demo“ is a fact about the row, not a claim.
 *
 * The fitment snapshots and the audit log stay append-only for every row: no UPDATE, ever. The one
 * exception is DELETE of a row born demo — so `demo:purge` can take the demo set away again — and
 * nothing else. Production holds no demo rows at all (`demo:assert-clean`).
 */
return new class extends Migration
{
    /** Table => trigger prefix (a trigger name is at most 64 characters). */
    private const TABLES = [
        'customers' => 'cus',
        'addresses' => 'adr',
        'orders' => 'ord',
        'order_lines' => 'oli',
        'order_line_fitments' => 'olf',
        'audit_logs' => 'audit',
        'verdict_tallies' => 'vt',
        'admin_users' => 'adm',
        'catalogue_gap_events' => 'gap',
    ];

    /** Append-only already: their UPDATE trigger refuses every change, these two columns included. */
    private const APPEND_ONLY = ['order_line_fitments', 'audit_logs'];

    public function up(): void
    {
        foreach (self::TABLES as $table => $prefix) {
            Schema::table($table, function (Blueprint $t): void {
                $t->boolean('is_demo')->default(false)->index();
                $t->string('demo_ref', 48)->nullable()->unique();
            });

            DB::statement("ALTER TABLE {$table} ADD CONSTRAINT chk_{$prefix}_demo CHECK ((is_demo = 0 AND demo_ref IS NULL) OR (is_demo = 1 AND demo_ref IS NOT NULL))");

            if (! in_array($table, self::APPEND_ONLY, true)) {
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
        }

        // DELETE: still refused for every real row; a row born demo may go (demo:purge).
        foreach (['order_line_fitments' => ['trg_olf_no_delete', 'order_line_fitments is append-only'], 'audit_logs' => ['trg_audit_no_delete', 'audit_logs is append-only']] as $table => [$trigger, $message]) {
            DB::unprepared("DROP TRIGGER IF EXISTS {$trigger}");
            DB::unprepared(<<<SQL
                CREATE TRIGGER {$trigger}
                BEFORE DELETE ON {$table}
                FOR EACH ROW
                BEGIN
                    IF NOT (OLD.is_demo = 1 AND OLD.demo_ref IS NOT NULL) THEN
                        SIGNAL SQLSTATE '45000'
                        SET MESSAGE_TEXT = '{$message}';
                    END IF;
                END
                SQL);
        }
    }

    public function down(): void
    {
        foreach (['order_line_fitments' => ['trg_olf_no_delete', 'order_line_fitments is append-only'], 'audit_logs' => ['trg_audit_no_delete', 'audit_logs is append-only']] as $table => [$trigger, $message]) {
            DB::unprepared("DROP TRIGGER IF EXISTS {$trigger}");
            DB::unprepared(<<<SQL
                CREATE TRIGGER {$trigger}
                BEFORE DELETE ON {$table}
                FOR EACH ROW
                BEGIN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = '{$message}';
                END
                SQL);
        }

        foreach (self::TABLES as $table => $prefix) {
            DB::unprepared("DROP TRIGGER IF EXISTS trg_{$prefix}_demo_fixed");
            // DROP CONSTRAINT: understood by MySQL 8 and by MariaDB alike.
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT chk_{$prefix}_demo");

            Schema::table($table, function (Blueprint $t) use ($table): void {
                $t->dropUnique("{$table}_demo_ref_unique");
                $t->dropIndex("{$table}_is_demo_index");
                $t->dropColumn(['is_demo', 'demo_ref']);
            });
        }
    }
};
