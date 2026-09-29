<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Block G, part one: what taking money needs before the keys arrive.
 *
 * - `payment_settings`: Einstellungen › Zahlung — the Stripe keys, encrypted at rest (the model's casts),
 *   their last four characters beside them for the page, the mode, the last „Verbindung testen“.
 * - `payment_events`: every webhook exactly as it arrived, under a UNIQUE provider event id — a repeated
 *   delivery is a no-op — and its raw body frozen by trigger: what the provider said is evidence.
 * - `orders`: the two new states (Zahlung läuft, teilweise erstattet), what was refunded, a flag that holds
 *   an order back from fulfilment (an amount that does not match), the reserved stock and the expiry.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $t): void {
            $t->id();
            $t->string('mode', 8)->default('test');
            $t->text('publishable_key')->nullable();
            $t->text('secret_key')->nullable();
            $t->text('webhook_secret')->nullable();
            $t->char('publishable_last4', 4)->nullable();
            $t->char('secret_last4', 4)->nullable();
            $t->char('webhook_last4', 4)->nullable();
            $t->json('last_test')->nullable()->comment('the last „Verbindung testen“: account name, country, currency, methods — or the error');
            $t->timestamp('tested_at')->nullable();
            $t->foreignId('updated_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $t->timestamps();
        });

        Constraints::add('payment_settings', 'chk_payment_settings_mode', "`mode` IN ('test', 'live')");

        Schema::create('payment_events', function (Blueprint $t): void {
            $t->id();
            $t->string('provider', 16);
            $t->string('event_id', 255);
            $t->string('type', 80);
            $t->boolean('livemode')->default(false);
            $t->longText('payload')->comment('the body exactly as it arrived, signature verified');
            $t->foreignId('order_id')->nullable()->constrained('orders')->restrictOnDelete();
            $t->timestamp('received_at');
            $t->timestamp('processed_at')->nullable();
            $t->string('outcome', 64)->nullable();
            $t->string('note', 500)->nullable();
            $t->timestamps();

            $t->unique(['provider', 'event_id'], 'uq_payment_event');
            $t->index(['type', 'received_at']);
        });

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_payment_events_raw_fixed
            BEFORE UPDATE ON payment_events
            FOR EACH ROW
            BEGIN
                IF NOT (NEW.payload <=> OLD.payload) OR NOT (NEW.event_id <=> OLD.event_id) OR NOT (NEW.provider <=> OLD.provider) OR NOT (NEW.type <=> OLD.type) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'payment_events keeps the event as it arrived';
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_payment_events_no_delete
            BEFORE DELETE ON payment_events
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'payment_events is append-only';
            END
        SQL);

        Schema::table('orders', function (Blueprint $t): void {
            $t->unsignedInteger('refunded_cents')->default(0)->after('total_cents');
            $t->string('payment_flag', 255)->nullable()->after('payment_method')->comment('why the order is held back from fulfilment, e.g. an amount that does not match');
            $t->string('payment_error', 255)->nullable()->after('payment_flag')->comment('the provider\'s last refusal, in its words');
            $t->boolean('stock_reserved')->default(false)->after('payment_error');
            $t->timestamp('expires_at')->nullable()->after('placed_at')->comment('unpaid past this, the order expires and its stock is released');
            $t->index(['status', 'expires_at']);
        });

        Constraints::dropIfExists('orders', 'chk_orders_status');
        Constraints::enum('orders', 'status', OrderStatus::values());
        Constraints::add('orders', 'chk_order_refunded', '`refunded_cents` <= `total_cents`');
    }

    public function down(): void
    {
        Constraints::dropIfExists('orders', 'chk_order_refunded');

        Schema::table('orders', function (Blueprint $t): void {
            $t->dropIndex(['status', 'expires_at']);
            $t->dropColumn(['refunded_cents', 'payment_flag', 'payment_error', 'stock_reserved', 'expires_at']);
        });

        DB::unprepared('DROP TRIGGER IF EXISTS trg_payment_events_no_delete');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_payment_events_raw_fixed');
        Schema::dropIfExists('payment_events');
        Schema::dropIfExists('payment_settings');
    }
};
