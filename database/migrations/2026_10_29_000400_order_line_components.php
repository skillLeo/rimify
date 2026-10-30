<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * His #15 (D-355): every option its own line — in the basket and the checkout already, now in the order itself. A
 * Komplettrad's line keeps the rows it was sold with, frozen at the order: Felge, Reifen, Montage und Auswuchten,
 * Wuchtgewichte (its colour), each with its quantity, unit price and total in cents. The confirmation, the mail, the
 * admin and Stripe read them from here; RDKS sensors are an order line of their own as before. Null on a line from
 * before, and on a rim sold alone, which is its own single row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_lines', function (Blueprint $table): void {
            $table->json('components')->nullable()->after('line_total_cents');
        });
    }

    public function down(): void
    {
        Schema::table('order_lines', function (Blueprint $table): void {
            $table->dropColumn('components');
        });
    }
};
