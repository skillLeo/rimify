<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Where an order came from (EIGENE-FUNDE 131, the operator's brief of 15.10.2026 „GO-AND-KEEP-GOING“ §1, D-238).
 *
 * The order page opened „demonstration data“ to anyone holding its number, and an order a real person placed for the
 * acceptance set's wheel counted as such — so a stranger could read that person's name, address and purchase. The
 * rule now keys on provenance, not on what an order contains: an order a seeder wrote has no person behind it and
 * opens by number; an order that came through the checkout never does, in any environment, whatever it contains.
 *
 * `origin` is `checkout` unless a seeder says otherwise, so an order of unknown provenance is protected — the rule
 * fails closed. It is fixed at insert (a trigger), as `is_demo` is: an order can never become a seeded one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $t): void {
            $t->string('origin', 16)->default('checkout')->after('demo_ref')
                ->comment('checkout: a person placed it through the checkout · seeded: a seeder wrote it, nobody is behind it; fixed at insert');
        });

        DB::statement("ALTER TABLE orders ADD CONSTRAINT chk_ord_origin CHECK (origin IN ('checkout', 'seeded'))");

        // What a seeder wrote before the column existed: every order born demo (DemoDashboardSeeder), and the orders
        // CommerceSeeder drew on the example catalogue — the models born demo outside the acceptance set, which no
        // checkout has ever been able to sell.
        DB::table('orders')->where('is_demo', true)->update(['origin' => 'seeded']);
        DB::table('orders')
            ->whereExists(fn ($q) => $q->selectRaw('1')
                ->from('order_lines as ol')
                ->join('wheel_configs as wc', 'wc.id', '=', 'ol.wheel_config_id')
                ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
                ->whereColumn('ol.order_id', 'orders.id')
                ->where('wm.is_demo', true)
                ->where(fn ($m) => $m->whereNull('wm.demo_ref')->orWhere('wm.demo_ref', 'not like', 'abnahme:%')))
            ->update(['origin' => 'seeded']);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_ord_origin_fixed
            BEFORE UPDATE ON orders
            FOR EACH ROW
            BEGIN
                IF NOT (NEW.origin <=> OLD.origin) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'origin is fixed at insert';
                END IF;
            END
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_ord_origin_fixed');
        // DROP CONSTRAINT: understood by MySQL 8 and by MariaDB alike.
        DB::statement('ALTER TABLE orders DROP CONSTRAINT chk_ord_origin');

        Schema::table('orders', function (Blueprint $t): void {
            $t->dropColumn('origin');
        });
    }
};
