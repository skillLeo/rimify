<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stripe issues the invoice (his admin item 17, part 2; the operator's brief of 29.10.2026, Batch 2, D-361): each paid
 * order keeps the customer its payment was made for — Stripe attaches a payment to an invoice of the same customer —
 * and the invoice Stripe made for it, by its id from the draft on, and its number, page and PDF once it is paid. The
 * shop links an invoice only once those are here.
 *
 * `invoice_exports`: the daily copy of each Stripe invoice to S3 (rimify:invoices:export-s3) — one row per invoice,
 * written when its PDF and JSON are stored and their sizes checked, or with the error after the last try; the admin
 * shows the failures.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $t): void {
            $t->string('stripe_customer_id', 64)->nullable()->after('stripe_payment_intent_id');
            $t->string('stripe_invoice_id', 64)->nullable()->after('stripe_customer_id');
            $t->string('stripe_invoice_number', 64)->nullable()->after('stripe_invoice_id');
            $t->string('stripe_invoice_url', 500)->nullable()->after('stripe_invoice_number')->comment('the hosted invoice page');
            $t->string('stripe_invoice_pdf', 500)->nullable()->after('stripe_invoice_url');
            $t->timestamp('stripe_invoiced_at')->nullable()->after('stripe_invoice_pdf')->comment('when Stripe reported it paid');
            $t->unique('stripe_invoice_id', 'uq_orders_stripe_invoice');
        });

        Schema::create('invoice_exports', function (Blueprint $t): void {
            $t->id();
            $t->string('stripe_invoice_id', 64);
            $t->string('number', 64)->nullable();
            $t->string('order_number', 32)->nullable();
            $t->date('invoice_date')->comment('the day it was created, Europe/Berlin');
            $t->string('pdf_path', 255)->nullable();
            $t->unsignedInteger('pdf_bytes')->nullable();
            $t->unsignedInteger('json_bytes')->nullable();
            $t->string('status', 16)->comment('stored or failed');
            $t->string('error', 500)->nullable();
            $t->unsignedTinyInteger('attempts')->default(0);
            $t->timestamps();
            $t->unique('stripe_invoice_id', 'uq_invoice_exports_invoice');
            $t->index(['status', 'invoice_date'], 'idx_invoice_exports_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_exports');

        Schema::table('orders', function (Blueprint $t): void {
            $t->dropUnique('uq_orders_stripe_invoice');
            $t->dropColumn(['stripe_customer_id', 'stripe_invoice_id', 'stripe_invoice_number', 'stripe_invoice_url', 'stripe_invoice_pdf', 'stripe_invoiced_at']);
        });
    }
};
