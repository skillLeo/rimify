<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The product side, in three levels — because "BORBET Havanna" is one product with many sellable
 * units. Flattening model, finish and configuration into one row makes the product page, the
 * pricing and the stock figures all wrong at once (spec gap G7).
 *
 * Price and stock live at the configuration level, which is the thing a customer actually buys.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('logo_path')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('wheel_models', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('brand_id')->constrained('brands')->restrictOnDelete();
            $table->string('name')->comment('Havanna');
            $table->string('type_designation')->nullable()->comment('as printed on the Gutachten');
            $table->string('slug')->unique();
            $table->text('description_de')->nullable();
            $table->string('status', 16)->default(CatalogueStatus::Draft->value);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'brand_id'], 'idx_wheel_model_status');
        });

        // Typo-tolerant search: FULLTEXT boolean mode, re-ranked in PHP with levenshtein(),
        // so "borbet havana" still finds the Havanna without a second service to run.
        Schema::table('wheel_models', function (Blueprint $table): void {
            $table->fullText(['name', 'type_designation'], 'ft_wheel');
        });

        Schema::create('wheel_finishes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('wheel_model_id')->constrained('wheel_models')->cascadeOnDelete();
            $table->string('name_de')->comment('Graphite matt');
            $table->string('name_en')->nullable();
            $table->string('hex', 7)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['wheel_model_id', 'name_de'], 'uq_finish_model_name');
        });

        Schema::create('wheel_configs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('wheel_model_id')->constrained('wheel_models')->cascadeOnDelete();
            $table->foreignId('wheel_finish_id')->constrained('wheel_finishes')->restrictOnDelete();

            // Every measurement carries its unit in the name.
            $table->decimal('diameter_in', 4, 1)->comment('18.0');
            $table->decimal('width_in', 4, 2)->comment('8.50 — rendered 8,5J');
            $table->smallInteger('et_mm')->comment('Einpresstiefe — can be negative');
            $table->unsignedTinyInteger('bolt_holes');
            $table->decimal('bolt_circle_mm', 5, 1)->comment('Lochkreis — 112.0');
            $table->decimal('centre_bore_mm', 5, 2)->comment('Mittenlochbohrung — 66.60');

            $table->string('hump', 16)->nullable();
            $table->string('bead_profile', 16)->nullable();
            $table->string('kba_number', 32)->nullable();
            $table->string('ean', 14)->nullable();
            $table->string('sku')->unique();

            // Money is integer cents plus an explicit currency. Never a float.
            $table->unsignedInteger('price_cents');
            $table->char('currency', 3)->default('EUR');
            $table->unsignedInteger('stock_qty')->default(0);
            $table->unsignedInteger('weight_g')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                ['wheel_model_id', 'wheel_finish_id', 'diameter_in', 'width_in', 'et_mm', 'bolt_circle_mm'],
                'uq_wheel_config',
            );
            $table->index(
                ['wheel_model_id', 'wheel_finish_id', 'diameter_in', 'width_in', 'et_mm'],
                'idx_config_lookup',
            );
            $table->index(['diameter_in', 'width_in', 'et_mm'], 'idx_config_size');
        });

        Schema::create('tyre_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('brand_id')->constrained('brands')->restrictOnDelete();
            $table->string('name');
            $table->string('season', 16)->comment('sommer | winter | ganzjahres');

            $table->unsignedSmallInteger('width_mm')->comment('245');
            $table->unsignedSmallInteger('aspect')->comment('45');
            $table->decimal('diameter_in', 4, 1)->comment('18.0');

            $table->unsignedSmallInteger('load_index');
            $table->string('speed_symbol', 3)->comment('display only');
            // speed_rank is what every comparison uses: H sits between U and V, so comparing the
            // letters is code that reads correct and is wrong, in the permissive direction.
            $table->unsignedSmallInteger('speed_rank');

            $table->char('eu_fuel_class', 1)->nullable();
            $table->char('eu_wet_grip_class', 1)->nullable();
            $table->unsignedSmallInteger('eu_noise_db')->nullable();

            $table->unsignedInteger('price_cents');
            $table->char('currency', 3)->default('EUR');
            $table->unsignedInteger('stock_qty')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['width_mm', 'aspect', 'diameter_in', 'load_index', 'speed_rank'], 'idx_tyre_lookup');
            $table->index(['season', 'stock_qty'], 'idx_tyre_season');
        });

        Constraints::enum('wheel_models', 'status', CatalogueStatus::values());
        Constraints::add('wheel_configs', 'chk_wheel_configs_diameter', '`diameter_in` > 0');
        Constraints::add('wheel_configs', 'chk_wheel_configs_width', '`width_in` > 0');
        Constraints::add('wheel_configs', 'chk_wheel_configs_bolts', '`bolt_holes` > 0');
        Constraints::add('wheel_configs', 'chk_wheel_configs_bore', '`centre_bore_mm` > 0');
        Constraints::add('tyre_variants', 'chk_tyre_width', '`width_mm` > 0');
        Constraints::add('tyre_variants', 'chk_tyre_aspect', '`aspect` > 0');
        Constraints::add('tyre_variants', 'chk_tyre_load_index', '`load_index` > 0');
        Constraints::add('tyre_variants', 'chk_tyre_speed_rank', '`speed_rank` > 0');
        Constraints::enum('tyre_variants', 'season', ['sommer', 'winter', 'ganzjahres']);
    }

    public function down(): void
    {
        Schema::dropIfExists('tyre_variants');
        Schema::dropIfExists('wheel_configs');
        Schema::dropIfExists('wheel_finishes');
        Schema::dropIfExists('wheel_models');
        Schema::dropIfExists('brands');
    }
};
