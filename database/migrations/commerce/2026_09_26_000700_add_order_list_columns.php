<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What Verkauf › Bestellungen filters and sorts by (docs/admin/rest-build-plan.md, step 2.1).
 *
 *  - `orders.payment_method` and `orders.shipping_method`: how the order was paid and how it goes
 *    out. Nullable — checkout writes them once payments are live; until then an order simply has
 *    none, and the list offers no option for a value no order carries.
 *  - `order_line_fitments.has_conditions`: whether the frozen verdict carried Auflagen. The snapshot
 *    is append-only (R-12, and triggers refuse any UPDATE), so this is a stored generated column —
 *    the database derives it from the frozen JSON on its own, nothing is written into a snapshot,
 *    and "nur mit Auflagen" filters on an indexed column instead of querying JSON (BRIEF-2 §6).
 *  - Indexes for the list's sorts and its default order.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('payment_method', 32)->nullable()->after('currency');
            $table->string('shipping_method', 32)->nullable()->after('payment_method');

            $table->index('placed_at', 'idx_order_placed');
            $table->index('total_cents', 'idx_order_total');
            $table->index('payment_method', 'idx_order_payment_method');
            $table->index('shipping_method', 'idx_order_shipping_method');
        });

        Schema::table('order_line_fitments', function (Blueprint $table): void {
            $table->boolean('has_conditions')
                ->storedAs("COALESCE(JSON_LENGTH(`verdict`, '$.conditions'), 0) > 0")
                ->comment('derived from the frozen verdict; never written');

            $table->index('has_conditions', 'idx_olf_has_conditions');
        });
    }

    public function down(): void
    {
        Schema::table('order_line_fitments', function (Blueprint $table): void {
            $table->dropIndex('idx_olf_has_conditions');
            $table->dropColumn('has_conditions');
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex('idx_order_shipping_method');
            $table->dropIndex('idx_order_payment_method');
            $table->dropIndex('idx_order_total');
            $table->dropIndex('idx_order_placed');
            $table->dropColumn(['payment_method', 'shipping_method']);
        });
    }
};
