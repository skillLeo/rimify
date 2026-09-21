<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The frozen fitment snapshot (R-12) — the verdict exactly as the customer saw it.
 *
 * Eleven months after a purchase a customer says their workshop rejected the wheels. Without this
 * row that is an argument. With it, RIMIFY opens the order and answers in one message: the
 * document, the revision it was on that day, the permitted sizes, the conditions shown, the entry
 * flag, and a hash proving the PDF is the same file.
 *
 * It is denormalised on purpose. Joining back to live data would answer "what does the catalogue
 * say today", which is the wrong question.
 *
 * Written once inside the checkout transaction. There is no update path in the codebase, and the
 * two triggers below mean a future well-meaning migration cannot quietly rewrite the one record
 * whose entire value is that it never changes. The spec asks for `REVOKE UPDATE`; grants depend
 * on how the database user is provisioned, so the guarantee lives in the schema where it cannot
 * be bypassed, and the grant is applied as well in P11's deployment notes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_line_fitments', function (Blueprint $table): void {
            // One snapshot per line, and the line is the key — RESTRICT rather than CASCADE,
            // because a cascade would be a delete path that walks straight around the trigger.
            $table->unsignedBigInteger('order_line_id')->primary();

            $table->unsignedBigInteger('vehicle_id');
            $table->unsignedBigInteger('wheel_config_id');
            $table->unsignedBigInteger('fitment_id');
            $table->unsignedBigInteger('approval_document_id');
            $table->unsignedInteger('document_revision');

            $table->json('verdict')->comment('the full FitmentVerdict, as rendered');
            $table->string('verdict_status', 16)->comment('lifted out for indexing and reporting');
            $table->boolean('requires_entry');

            $table->string('pdf_sha256', 64)->nullable();
            $table->string('engine_version', 32);
            $table->timestamp('computed_at');

            $table->foreign('order_line_id')->references('id')->on('order_lines')->restrictOnDelete();

            $table->index('verdict_status', 'idx_olf_status');
            $table->index('fitment_id', 'idx_olf_fitment');
            $table->index(['approval_document_id', 'document_revision'], 'idx_olf_document');
        });

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_olf_no_update
            BEFORE UPDATE ON order_line_fitments
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'order_line_fitments is append-only';
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_olf_no_delete
            BEFORE DELETE ON order_line_fitments
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'order_line_fitments is append-only';
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_audit_no_update
            BEFORE UPDATE ON audit_logs
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'audit_logs is append-only';
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_audit_no_delete
            BEFORE DELETE ON audit_logs
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'audit_logs is append-only';
            END
        SQL);
    }

    public function down(): void
    {
        // Triggers first: dropping the table while trg_olf_no_delete stands would fail.
        foreach (['trg_olf_no_update', 'trg_olf_no_delete', 'trg_audit_no_update', 'trg_audit_no_delete'] as $trigger) {
            DB::unprepared("DROP TRIGGER IF EXISTS {$trigger}");
        }

        Schema::dropIfExists('order_line_fitments');
    }
};
