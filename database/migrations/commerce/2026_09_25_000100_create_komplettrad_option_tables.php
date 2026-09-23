<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The two things the client configures for a Komplettrad: the colours a Wuchtgewicht can have, and
 * what an RDKS sensor costs for a given CAR make.
 *
 * Both tables are deliberately empty after migration. An empty `tpms_sensor_prices` means "we have
 * not been told what a sensor costs", and the checkout says exactly that rather than charging a
 * number nobody confirmed (CLAUDE.md §2).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_weight_colours', function (Blueprint $table): void {
            $table->id();
            $table->string('name_de', 64)->comment('Silber — as the customer reads it');
            $table->string('slug', 64)->comment('silber — stable identifier for seeders and tests');
            // The swatch on the option tile. NULL draws a neutral chip rather than a wrong colour.
            $table->char('swatch_hex', 7)->nullable()->comment('#C8CCD2');
            // Money is integer cents plus an explicit currency, everywhere. Per WHEEL, not per set.
            $table->unsignedInteger('surcharge_cents')->default(0);
            $table->char('currency', 3)->default('EUR');
            // Exactly one active row carries this; enforced in BalanceWeightColour::makeDefault()
            // inside a transaction, because MySQL cannot express "exactly one true" as a CHECK.
            $table->boolean('is_default')->default(false);
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('slug', 'uq_weight_colour_slug');
            $table->unique('name_de', 'uq_weight_colour_name');
            $table->index(['active', 'sort_order'], 'idx_weight_colour_order');
        });

        Schema::create('tpms_sensor_prices', function (Blueprint $table): void {
            $table->id();
            // The CAR make. `vehicles.make` is free text with no FK and no write-time
            // normalisation, so the join key is a normalised slug (MakeName::key()) and the label
            // is what a human reads. 'VW', 'vw' and 'Volkswagen' all key to `volkswagen`.
            $table->string('make_key', 64);
            $table->string('make_label_de', 64)->comment('Volkswagen');
            // Per SENSOR, not per set: a customer may order one replacement wheel or four.
            $table->unsignedInteger('price_cents');
            $table->char('currency', 3)->default('EUR');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('make_key', 'uq_tpms_make');
            $table->index(['active', 'make_key'], 'idx_tpms_active');
        });

        // A price of zero would be a claim that sensors are free. Absence is how "unknown" is
        // stored, and absence is what fails closed.
        Constraints::add('tpms_sensor_prices', 'chk_tpms_price', '`price_cents` > 0');
        // An ISO 4217 code in upper case. `currency = UPPER(currency)` would compare under the
        // table's case-insensitive collation and accept 'eur' as equal to 'EUR' — a CHECK that
        // refuses nothing. The 'c' match type is what makes it case-sensitive, and Constraints
        // rewrites it for MariaDB.
        Constraints::add('tpms_sensor_prices', 'chk_tpms_currency', "REGEXP_LIKE(`currency`, '^[A-Z]{3}$', 'c')");
        Constraints::add(
            'tpms_sensor_prices',
            'chk_tpms_make_key',
            "REGEXP_LIKE(`make_key`, '^[a-z0-9][a-z0-9-]{0,63}$', 'c')",
        );
        Constraints::add('balance_weight_colours', 'chk_weight_colour_currency', "REGEXP_LIKE(`currency`, '^[A-Z]{3}$', 'c')");
        Constraints::add(
            'balance_weight_colours',
            'chk_weight_colour_hex',
            "`swatch_hex` IS NULL OR REGEXP_LIKE(`swatch_hex`, '^#[0-9A-F]{6}$', 'c')",
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('tpms_sensor_prices');
        Schema::dropIfExists('balance_weight_colours');
    }
};
