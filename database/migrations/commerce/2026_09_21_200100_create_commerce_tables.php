<?php

declare(strict_types=1);

use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Commerce. Guest checkout only — there are no customer accounts and no passwords here.
 *
 * The vehicle is DENORMALISED onto the order (label, hsn, tsn, vsn) on purpose: an import may
 * soft-delete the vehicle a year from now, and the order must still read correctly. For the same
 * reason `order_lines.label` freezes the description as the customer saw it rather than joining
 * to a catalogue row whose name may change.
 *
 * Columns that point into the fitment slice (`vehicle_id`, `wheel_config_id`, `tyre_variant_id`)
 * are plain ids here; the foreign keys are added in the integration slice, so this slice can be
 * migrated and tested on its own.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->string('email');
            $table->string('firstname')->nullable();
            $table->string('lastname')->nullable();
            $table->string('phone', 32)->nullable();
            $table->timestamps();

            // Not unique: guest checkout means the same address may order twice as two customers,
            // and forcing uniqueness here would turn a second order into an account system.
            $table->index('email', 'idx_customer_email');
        });

        Schema::create('addresses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('company')->nullable();
            $table->string('street');
            $table->string('house_number', 32);
            $table->string('address_extra')->nullable();
            $table->string('zip_code', 16);
            $table->string('city');
            $table->char('country', 2)->default('DE');
            $table->timestamps();

            $table->index(['zip_code', 'city'], 'idx_address_locality');
        });

        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->string('order_number', 32)->unique();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('delivery_address_id')->constrained('addresses')->restrictOnDelete();
            $table->foreignId('billing_address_id')->constrained('addresses')->restrictOnDelete();

            $table->string('status', 24)->default(OrderStatus::Draft->value);

            // The vehicle the whole order was bought for, denormalised so it survives an import.
            // hsn/tsn are VARCHAR here too: 0005 must keep its zeros on the invoice.
            $table->unsignedBigInteger('vehicle_id')->nullable();
            $table->string('vehicle_label')->nullable();
            $table->string('vehicle_hsn', 4)->nullable();
            $table->string('vehicle_tsn', 3)->nullable();
            $table->string('vehicle_vsn', 16)->nullable();

            // Money is integer cents with an explicit currency, everywhere.
            $table->unsignedInteger('subtotal_cents')->default(0);
            $table->unsignedInteger('shipping_cents')->default(0);
            $table->unsignedInteger('tax_cents')->default(0);
            $table->unsignedInteger('total_cents')->default(0);
            $table->char('currency', 3)->default('EUR');

            $table->string('stripe_session_id')->nullable()->unique();
            $table->string('stripe_payment_intent_id')->nullable();

            $table->text('note')->nullable();
            $table->timestamp('placed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->string('tracking_code')->nullable();
            $table->timestamps();

            $table->index(['status', 'placed_at'], 'idx_order_status');
            $table->index('vehicle_id', 'idx_order_vehicle');
            $table->index(['vehicle_hsn', 'vehicle_tsn'], 'idx_order_keys');
        });

        Schema::create('order_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('kind', 16);

            $table->unsignedBigInteger('wheel_config_id')->nullable();
            $table->unsignedBigInteger('tyre_variant_id')->nullable();

            // Lines sharing a group move together: a Komplettrad is a wheel, a tyre and the
            // mounting service, and removing one of them alone would be nonsense.
            $table->unsignedSmallInteger('package_group')->nullable();

            $table->string('label')->comment('frozen description as shown at purchase');
            $table->unsignedSmallInteger('quantity');
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedInteger('line_total_cents');
            // Basis points, so 19% is 1900 and VAT maths stays in integers.
            $table->unsignedSmallInteger('tax_rate_bp')->default(1900);
            $table->char('currency', 3)->default('EUR');
            $table->timestamps();

            $table->index(['order_id', 'package_group'], 'idx_order_line_package');
        });

        Schema::create('stripe_events', function (Blueprint $table): void {
            // Stripe's own event id is the primary key: that IS the idempotency guarantee, so a
            // replayed webhook cannot create a second order, decrement stock twice or send a
            // second email.
            $table->string('id', 64)->primary();
            $table->string('type', 64);
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('type', 'idx_stripe_event_type');
        });

        Constraints::enum('orders', 'status', OrderStatus::values());
        Constraints::enum('order_lines', 'kind', OrderLineKind::values());
        Constraints::add('order_lines', 'chk_order_line_quantity', '`quantity` > 0');
        Constraints::add('orders', 'chk_order_currency', '`currency` = UPPER(`currency`)');
        Constraints::add(
            'orders',
            'chk_order_hsn',
            "`vehicle_hsn` IS NULL OR REGEXP_LIKE(`vehicle_hsn`, '^[0-9A-Z]{4}$', 'c')",
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('stripe_events');
        Schema::dropIfExists('order_lines');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('customers');
    }
};
