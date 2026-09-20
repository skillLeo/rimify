<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The vehicle side, sourced from the PKW-Liste export and never hand-edited.
 *
 * Three traps, all of them real and all found in the client's own demo export:
 *
 *  1. HSN carries significant leading zeros — 0005, 0035, 0583. An integer cast destroys them
 *     permanently, so it is text here, in the model, in the URL and in the import.
 *  2. TSN is mixed alphanumeric — 307 and AAS occur in the same column. Text, upper-cased on
 *     write; utf8mb4_0900_ai_ci then matches `aas` against `AAS` without an UPPER() that would
 *     make the index unusable.
 *  3. Build windows are open-ended. `build_to IS NULL` means STILL CURRENT, never today —
 *     coercing it to today silently expires every car still in production (R-02).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('source_vehicle_id')->comment('fahrzeug_id from the export');

            // Text, always. See trap 1 and trap 2 above.
            $table->string('hsn', 4);
            $table->string('tsn', 3);
            $table->string('vsn', 16)->nullable()->comment('the third key — separates identical HSN/TSN pairs');

            $table->string('make');
            $table->string('model');
            $table->string('variant');
            $table->string('type_designation')->nullable()->comment('B9 — how a Gutachten names it');

            // EC approval numbers drift across four incompatible formats; the raw value is kept
            // for display and audit, the normalised one is what joins survive on.
            $table->string('eg_nummer_raw')->nullable();
            $table->string('eg_nummer_norm', 64)->nullable();

            $table->string('body_form', 32)->nullable()->comment('Kombi | Limousine | Cabrio | Coupe | Schrägheck');
            $table->string('drive_axle', 16)->nullable()->comment('matters for mixed fitment');

            // Trap 3. NULL on either side means unbounded on that side.
            $table->date('build_from')->nullable();
            $table->date('build_to')->nullable();

            // The two numbers from which the legal tyre specification is derived. NULL plus
            // needs_review is how unparseable source data is stored — never 0, which would
            // derive a minimum load index of zero and permit every tyre (R-03).
            $table->unsignedInteger('axle_load_front_kg')->nullable();
            $table->unsignedInteger('axle_load_rear_kg')->nullable();
            $table->unsignedInteger('max_speed_kmh')->nullable();

            $table->unsignedInteger('power_kw')->nullable();
            $table->unsignedInteger('power_ps')->nullable();
            $table->unsignedInteger('displacement_ccm')->nullable();
            $table->unsignedTinyInteger('doors')->nullable();
            $table->unsignedTinyInteger('seats')->nullable();

            $table->boolean('needs_review')->default(false);

            // All 46 source columns, verbatim. Discarding them now means re-importing later.
            $table->json('raw');
            $table->timestamp('imported_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // MySQL has no partial indexes, so the filtered column goes INTO the key.
            $table->index(['hsn', 'tsn', 'deleted_at'], 'idx_vehicle_keys');
            $table->index(['make', 'model', 'variant', 'deleted_at'], 'idx_vehicle_tree');
            $table->index(['build_from', 'build_to'], 'idx_vehicle_window');
            $table->index('eg_nummer_norm', 'idx_vehicle_eg');
            $table->index('needs_review', 'idx_vehicle_needs_review');
            $table->unique(['source_vehicle_id'], 'uq_vehicle_source');
        });

        // 'c' = case-sensitive match, so a lower-case TSN cannot be written even though the
        // column's collation compares case-insensitively on read.
        Constraints::add('vehicles', 'chk_vehicles_hsn', "REGEXP_LIKE(`hsn`, '^[0-9A-Z]{4}$', 'c')");
        Constraints::add('vehicles', 'chk_vehicles_tsn', "REGEXP_LIKE(`tsn`, '^[0-9A-Z]{1,3}$', 'c')");

        // A zero or negative measurement is a data defect; it must arrive as NULL instead.
        Constraints::add('vehicles', 'chk_vehicles_axle_front', '`axle_load_front_kg` IS NULL OR `axle_load_front_kg` > 0');
        Constraints::add('vehicles', 'chk_vehicles_axle_rear', '`axle_load_rear_kg` IS NULL OR `axle_load_rear_kg` > 0');
        Constraints::add('vehicles', 'chk_vehicles_max_speed', '`max_speed_kmh` IS NULL OR `max_speed_kmh` > 0');

        Constraints::range('vehicles', 'build_from', 'build_to', 'chk_vehicles_build_window');
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
