<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The real invoice numbers are opened once, by a named operator, at the number the client's own accounting has
 * reached (InvoiceSeries::open) — never at 1 by default, never by a config edit. Until then every invoice is a test
 * invoice. The database holds the line on its own, whatever the code does:
 *
 * - `invoice_sequences` gains the opening: the first number, who opened it, when. A real series (RE, GS) can only be
 *   inserted opened, its counter one below its first number; a test series (TRE, TGS) starts at 0.
 * - A counter moves up by exactly one and nothing else in the row ever changes; no row is ever deleted.
 * - An invoice takes exactly the number its series has just counted to, and its number is spelled from its series and
 *   sequence: `TEST-` exists only in a T-series, and a real series holds no test number.
 */
return new class extends Migration
{
    private const TRIGGERS = [
        'trg_invoice_sequences_insert',
        'trg_invoice_sequences_update',
        'trg_invoice_sequences_no_delete',
        'trg_invoices_take_number',
    ];

    public function up(): void
    {
        // A real series used before it could be opened has no operator to name: the migration will not invent one.
        if (DB::table('invoice_sequences')->whereIn('series', ['RE', 'GS'])->exists()) {
            throw new RuntimeException('invoice_sequences holds a real series (RE or GS) without an opening. Record who opened it at which number by hand before migrating.');
        }

        Schema::table('invoice_sequences', function (Blueprint $t): void {
            $t->unsignedInteger('first_number')->nullable()->after('last_number')->comment('a real series: its first number, from the client\'s accounting');
            $t->unsignedBigInteger('opened_by_admin_id')->nullable()->after('first_number');
            $t->string('opened_by_name', 191)->nullable()->after('opened_by_admin_id')->comment('who opened it, frozen');
            $t->timestamp('opened_at')->nullable()->after('opened_by_name');
        });

        Constraints::add('invoice_sequences', 'chk_invoice_sequence_series', "`series` IN ('RE', 'GS', 'TRE', 'TGS')");
        Constraints::add('invoices', 'chk_invoice_series', "`series` IN ('RE', 'GS', 'TRE', 'TGS')");
        Constraints::add('invoices', 'chk_invoice_series_kind', "(`kind` = 'invoice') = (`series` IN ('RE', 'TRE'))");
        Constraints::add('invoices', 'chk_invoice_test_number', "(LEFT(`series`, 1) = 'T') = (LEFT(`number`, 5) = 'TEST-')");
        Constraints::add('invoices', 'chk_invoice_number', "`number` = CONCAT(IF(LEFT(`series`, 1) = 'T', CONCAT('TEST-', SUBSTRING(`series`, 2)), `series`), '-', LPAD(`sequence`, GREATEST(6, CHAR_LENGTH(`sequence`)), '0'))");

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_invoice_sequences_insert
            BEFORE INSERT ON invoice_sequences
            FOR EACH ROW
            BEGIN
                IF LEFT(NEW.series, 1) = 'T' THEN
                    IF NEW.last_number <> 0 OR NEW.first_number IS NOT NULL THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'a test invoice series starts at 1';
                    END IF;
                ELSEIF NEW.first_number IS NULL OR NEW.first_number < 1 OR NEW.last_number + 1 <> NEW.first_number
                    OR NEW.opened_by_name IS NULL OR NEW.opened_at IS NULL THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'a real invoice series is opened once, at its first number, by a named operator';
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_invoice_sequences_update
            BEFORE UPDATE ON invoice_sequences
            FOR EACH ROW
            BEGIN
                IF NOT (NEW.series <=> OLD.series) OR NEW.last_number <> OLD.last_number + 1
                    OR NOT (NEW.first_number <=> OLD.first_number) OR NOT (NEW.opened_by_admin_id <=> OLD.opened_by_admin_id)
                    OR NOT (NEW.opened_by_name <=> OLD.opened_by_name) OR NOT (NEW.opened_at <=> OLD.opened_at) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'an invoice series only ever counts on by one';
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_invoice_sequences_no_delete
            BEFORE DELETE ON invoice_sequences
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'an invoice series is never deleted';
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_invoices_take_number
            BEFORE INSERT ON invoices
            FOR EACH ROW
            BEGIN
                IF NOT (NEW.sequence <=> (SELECT s.last_number FROM invoice_sequences s WHERE s.series = NEW.series)) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'an invoice takes the number its series has just counted to';
                END IF;
            END
        SQL);
    }

    public function down(): void
    {
        foreach (self::TRIGGERS as $trigger) {
            DB::unprepared("DROP TRIGGER IF EXISTS {$trigger}");
        }

        foreach (['chk_invoice_number', 'chk_invoice_test_number', 'chk_invoice_series_kind', 'chk_invoice_series'] as $check) {
            Constraints::dropIfExists('invoices', $check);
        }

        Constraints::dropIfExists('invoice_sequences', 'chk_invoice_sequence_series');

        Schema::table('invoice_sequences', function (Blueprint $t): void {
            $t->dropColumn(['first_number', 'opened_by_admin_id', 'opened_by_name', 'opened_at']);
        });
    }
};
