<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/*
 * His admin item 18 (D-354): „Please use a UUID for the URL and for the order number use a randomly increased number
 * i.e. YYMM-<Randomly incremented number>“.
 *
 * `orders.public_id`: a random UUID (v4) every order carries — the key of its links (the order page, its status, the
 * account offer, the test payment, the review), signed as before. Every order there is gets one here; a new one gets it
 * from the model (Order::booted).
 *
 * `order_number_counter`: one row, the last counter handed out — never reset, raised by a random step of 1 to 9 under a
 * row lock inside the order's transaction (OrderNumbers). Empty until the first order, which draws its start.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->uuid('public_id')->nullable()->after('order_number');
        });

        DB::table('orders')->whereNull('public_id')->orderBy('id')->chunkById(500, static function ($orders): void {
            foreach ($orders as $order) {
                DB::table('orders')->where('id', $order->id)->update(['public_id' => (string) Str::uuid()]);
            }
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->unique('public_id', 'uq_orders_public_id');
        });

        Schema::create('order_number_counter', function (Blueprint $table): void {
            $table->unsignedTinyInteger('id')->primary();
            $table->unsignedInteger('last_value')->nullable();
            $table->timestamps();
        });

        // Its one row, before any order: a checkout only ever locks it. No start yet — the first order draws it.
        DB::table('order_number_counter')->insert(['id' => 1, 'last_value' => null]);
    }

    public function down(): void
    {
        Schema::dropIfExists('order_number_counter');

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique('uq_orders_public_id');
            $table->dropColumn('public_id');
        });
    }
};
