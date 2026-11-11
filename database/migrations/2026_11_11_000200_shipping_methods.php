<?php

declare(strict_types=1);

use App\Services\Commerce\ShippingSettingCarry;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Shipping methods (his round of 08.11, §7B; D-449): Einstellungen › Versand holds several, each with its name, its price
 * including VAT, its delivery time in working days, an optional free-shipping threshold, its countries, an optional
 * description and optionally the products it ships. The customer chooses one before „Zahlungspflichtig bestellen“, and the
 * order freezes its name, price and delivery time.
 *
 * The one shipping setting of Einstellungen › Verkäufer & Versand becomes the first method, „Standardversand“, as it was
 * saved — active where it was complete and not marked a placeholder, inactive otherwise —, so the shop says the same as
 * before the release. Demo methods carry the demo mark the catalogue tables have: `is_demo` and `demo_ref` together, fixed
 * at insert (R-12's pattern).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_methods', function (Blueprint $t): void {
            $t->id();
            $t->string('name', 80);
            $t->string('description_de', 300)->nullable();
            $t->unsignedInteger('price_cents')->comment('including VAT');
            $t->char('currency', 3)->default('EUR');
            $t->unsignedInteger('free_from_cents')->nullable()->comment('free from this subtotal, including VAT');
            $t->unsignedTinyInteger('delivery_min_days')->comment('working days');
            $t->unsignedTinyInteger('delivery_max_days')->comment('working days');
            $t->json('countries')->comment('ISO codes');
            $t->json('product_types')->nullable()->comment('felgen, komplettrad; NULL: every product');
            $t->unsignedSmallInteger('position')->default(0);
            $t->boolean('active')->default(true);
            $t->boolean('is_demo')->default(false)->index();
            $t->string('demo_ref', 48)->nullable()->unique();
            $t->timestamps();
            $t->index(['active', 'position'], 'idx_shipping_methods_shown');
        });

        DB::statement('ALTER TABLE shipping_methods ADD CONSTRAINT chk_shm_demo CHECK ((is_demo = 0 AND demo_ref IS NULL) OR (is_demo = 1 AND demo_ref IS NOT NULL))');
        DB::statement('ALTER TABLE shipping_methods ADD CONSTRAINT chk_shm_days CHECK (delivery_min_days >= 1 AND delivery_max_days >= delivery_min_days AND delivery_max_days <= 60)');
        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_shm_demo_fixed
            BEFORE UPDATE ON shipping_methods
            FOR EACH ROW
            BEGIN
                IF NOT (NEW.is_demo <=> OLD.is_demo) OR NOT (NEW.demo_ref <=> OLD.demo_ref) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'is_demo and demo_ref are fixed at insert';
                END IF;
            END
            SQL);

        // What an order was sent by, frozen: the method's name and delivery time beside the price it already keeps.
        Schema::table('orders', function (Blueprint $t): void {
            $t->foreignId('shipping_method_id')->nullable()->after('shipping_method')->constrained('shipping_methods')->nullOnDelete();
            $t->string('shipping_method_name', 80)->nullable()->after('shipping_method_id');
            $t->string('shipping_delivery_time', 60)->nullable()->after('shipping_method_name')->comment('as shown before the order: 3–5 Werktage');
        });

        $carried = ShippingSettingCarry::carry();
        Log::info('Versand: die Einstellung als erste Versandart übernommen (D-449).', ['carried' => $carried]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $t): void {
            $t->dropForeign(['shipping_method_id']);
            $t->dropColumn(['shipping_method_id', 'shipping_method_name', 'shipping_delivery_time']);
        });
        DB::unprepared('DROP TRIGGER IF EXISTS trg_shm_demo_fixed');
        Schema::dropIfExists('shipping_methods');
    }
};
