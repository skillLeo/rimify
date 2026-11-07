<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * A tyre model above its sizes (the Gutachten rework §9): brand, model name and season, once, with its photographs; each size
 * line below it with its own load index, speed symbol, price, availability, EU label and now its supplier.
 *
 * `tyre_variants` keeps its brand, name and season, and the model is found by those three: every reader of a tyre — the engine, the
 * shop, the orders — goes on reading what it reads, and the verdict logic is not touched (D-407). A model comes into being with its
 * first size; one whose last size went stays, with its photographs, for the day that size comes back.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tyre_models', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('brand_id')->constrained('brands')->restrictOnDelete();
            $table->string('name');
            $table->string('season', 16)->comment('sommer | winter | ganzjahres');
            $table->timestamps();

            $table->unique(['brand_id', 'name', 'season'], 'uq_tyre_model');
        });

        Schema::create('tyre_model_images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tyre_model_id')->constrained('tyre_models')->restrictOnDelete();
            $table->unsignedSmallInteger('position');
            $table->json('manifest');
            $table->string('alt_de', 200);
            $table->timestamps();

            $table->index(['tyre_model_id', 'position'], 'idx_tyre_model_image_order');
        });

        Schema::table('tyre_variants', function (Blueprint $table): void {
            // Internal: who delivers this size. Never shown in the shop.
            $table->string('supplier', 120)->nullable()->after('available');
        });

        $now = now();

        DB::table('tyre_models')->insertOrIgnoreUsing(
            ['brand_id', 'name', 'season', 'created_at', 'updated_at'],
            DB::table('tyre_variants')->whereNull('deleted_at')->distinct()->select('brand_id', 'name', 'season')->selectRaw('? as created_at, ? as updated_at', [$now, $now]),
        );
    }

    public function down(): void
    {
        Schema::table('tyre_variants', function (Blueprint $table): void {
            $table->dropColumn('supplier');
        });
        Schema::dropIfExists('tyre_model_images');
        Schema::dropIfExists('tyre_models');
    }
};
