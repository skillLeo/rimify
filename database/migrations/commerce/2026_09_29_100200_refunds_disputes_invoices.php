<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Block G, part one — the money that goes back, the money that is contested, and the paper that proves both.
 *
 * - `refunds`: every refund asked of the provider from the order page — its amount, the reason, who asked,
 *   what the provider answered. Never marked by hand: a row is written when the API took it.
 * - `disputes`: a chargeback as the webhook reports it, with the evidence deadline and the evidence given.
 * - `invoices`: §14 UStG invoices and credit notes. Numbered from `invoice_sequences` under a row lock inside
 *   the issuing transaction, so a number is never skipped (a rolled-back issue rolls its number back) and never
 *   reused (UNIQUE). Written once with its PDF's key and checksum; a trigger refuses every change and every
 *   delete — an issued invoice is corrected by a credit note, never edited.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_sequences', function (Blueprint $t): void {
            $t->string('series', 8)->primary();
            $t->unsignedInteger('last_number')->default(0);
            $t->timestamps();
        });

        Schema::create('invoices', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('order_id')->constrained('orders')->restrictOnDelete();
            $t->string('kind', 16);
            $t->string('series', 8);
            $t->unsignedInteger('sequence');
            $t->string('number', 32)->unique();
            $t->timestamp('issued_at');
            $t->unsignedInteger('net_cents');
            $t->unsignedInteger('tax_cents');
            $t->unsignedInteger('gross_cents');
            $t->unsignedSmallInteger('tax_rate_bp');
            $t->char('currency', 3);
            $t->json('seller')->comment('who issued it, frozen: name, address, tax number or USt-IdNr');
            $t->json('buyer')->comment('to whom, frozen');
            $t->json('lines')->comment('quantity and kind of each item, net, VAT and gross, frozen');
            $t->unsignedBigInteger('refund_id')->nullable()->comment('a credit note: the refund it documents');
            $t->unsignedBigInteger('corrects_invoice_id')->nullable()->comment('a credit note: the invoice it corrects');
            $t->string('pdf_key', 255);
            $t->char('pdf_sha256', 64);
            $t->timestamp('created_at')->nullable();

            $t->unique(['series', 'sequence'], 'uq_invoice_series_sequence');
            $t->foreign('corrects_invoice_id')->references('id')->on('invoices')->restrictOnDelete();
        });

        Constraints::add('invoices', 'chk_invoice_kind', "`kind` IN ('invoice', 'credit_note')");
        Constraints::add('invoices', 'chk_invoice_sums', '`net_cents` + `tax_cents` = `gross_cents`');
        Constraints::add('invoices', 'chk_invoice_currency', '`currency` = UPPER(`currency`)');
        Constraints::add('invoices', 'chk_invoice_sequence', '`sequence` > 0');

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_invoices_no_update
            BEFORE UPDATE ON invoices
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'invoices are issued once: correct one with a credit note';
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_invoices_no_delete
            BEFORE DELETE ON invoices
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'invoices are never deleted';
            END
        SQL);

        Schema::create('refunds', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('order_id')->constrained('orders')->restrictOnDelete();
            $t->string('provider', 16);
            $t->string('provider_refund_id', 255)->nullable()->unique();
            $t->unsignedInteger('amount_cents');
            $t->char('currency', 3);
            $t->string('reason', 500);
            $t->string('status', 16);
            $t->foreignId('requested_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $t->string('event_id', 255)->nullable();
            $t->foreignId('credit_note_id')->nullable()->constrained('invoices')->restrictOnDelete();
            $t->timestamps();
        });

        Constraints::add('refunds', 'chk_refund_amount', '`amount_cents` > 0');
        Constraints::add('refunds', 'chk_refund_status', "`status` IN ('pending', 'succeeded', 'failed', 'canceled', 'requires_action')");

        Schema::table('invoices', function (Blueprint $t): void {
            $t->foreign('refund_id')->references('id')->on('refunds')->restrictOnDelete();
        });

        Schema::create('disputes', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('order_id')->nullable()->constrained('orders')->restrictOnDelete();
            $t->string('provider', 16);
            $t->string('provider_dispute_id', 255)->unique();
            $t->string('charge_id', 255)->nullable();
            $t->string('reason', 64);
            $t->unsignedInteger('amount_cents');
            $t->char('currency', 3);
            $t->string('status', 32);
            $t->timestamp('evidence_due_by')->nullable();
            $t->json('evidence')->nullable()->comment('the files and the note given as evidence');
            $t->timestamp('evidence_submitted_at')->nullable();
            $t->timestamp('closed_at')->nullable();
            $t->string('outcome', 16)->nullable();
            $t->timestamps();

            $t->index(['status', 'evidence_due_by']);
        });

        Constraints::add('disputes', 'chk_dispute_outcome', "`outcome` IS NULL OR `outcome` IN ('won', 'lost', 'accepted')");
    }

    public function down(): void
    {
        Schema::dropIfExists('disputes');

        Schema::table('invoices', function (Blueprint $t): void {
            $t->dropForeign(['refund_id']);
        });

        Schema::dropIfExists('refunds');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_invoices_no_delete');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_invoices_no_update');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('invoice_sequences');
    }
};
