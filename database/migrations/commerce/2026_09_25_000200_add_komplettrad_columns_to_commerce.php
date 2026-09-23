<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * What an order has to carry to explain a Komplettrad eleven months later, and the flag that keeps
 * a demonstration tyre out of a real order.
 *
 *  - `orders.vehicle_make`: the RDKS price is keyed on the car make, and FitmentVerdict::fromArray()
 *    rebuilds a frozen verdict with make ''. The make is therefore denormalised onto the order
 *    exactly as vehicle_label/hsn/tsn already are, or an order could never be explained.
 *  - `order_lines.balance_weight_colour_id` / `tpms_sensor_price_id`: plain ids, no FKs — exactly
 *    as wheel_config_id and tyre_variant_id are in this slice. The price and the description are
 *    FROZEN on the line; these ids exist for reporting, never for re-reading a price.
 *  - `tyre_variants.is_demo`: the demo gate today inspects wheel_models.is_demo only. A Komplettrad
 *    built from a demonstration tyre must be caught by the same gate (ACCURACY.md D4).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('vehicle_make')->nullable()->after('vehicle_label');
        });

        Schema::table('order_lines', function (Blueprint $table): void {
            $table->unsignedBigInteger('balance_weight_colour_id')->nullable()->after('tyre_variant_id');
            $table->unsignedBigInteger('tpms_sensor_price_id')->nullable()->after('balance_weight_colour_id');

            $table->index('balance_weight_colour_id', 'idx_order_line_weight_colour');
            $table->index('tpms_sensor_price_id', 'idx_order_line_tpms');
        });

        Schema::table('tyre_variants', function (Blueprint $table): void {
            $table->boolean('is_demo')->default(false)->after('stock_qty')->comment('seeded demo row, never real stock');
        });

        // Every tyre_variants row in every existing database was written by CatalogueSeeder::seedTyres()
        // as demonstration data. A default of `false` would therefore silently declare the whole seeded
        // tyre catalogue real the moment the column exists. Marking a genuine row demo costs a missed
        // sale; the reverse sells a fabricated tyre at a fabricated price (CLAUDE.md §2).
        DB::table('tyre_variants')->update(['is_demo' => true]);
    }

    public function down(): void
    {
        Schema::table('tyre_variants', function (Blueprint $table): void {
            $table->dropColumn('is_demo');
        });

        Schema::table('order_lines', function (Blueprint $table): void {
            $table->dropIndex('idx_order_line_tpms');
            $table->dropIndex('idx_order_line_weight_colour');
            $table->dropColumn(['tpms_sensor_price_id', 'balance_weight_colour_id']);
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn('vehicle_make');
        });
    }
};
