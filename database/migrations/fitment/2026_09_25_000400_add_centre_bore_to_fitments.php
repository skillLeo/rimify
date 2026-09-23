<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `fitments.centre_bore_mm`: the Mittenlochbohrung the document states for THIS vehicle.
 *
 * The bore is not a property of the rim alone (client, 2026-09-23): the same rim is measured against
 * the car it was tested on, so an ABE or Teilegutachten states its own bore per vehicle row — 66,5
 * on one car, 66,6 on another, one casting. `wheel_configs.centre_bore_mm` stays the rim's own
 * figure, which is what the shop shows when no car is chosen; this column is what the document says
 * about this wheel on this car, and that is what a customer with a chosen vehicle must be shown
 * (CLAUDE.md §1, R-06).
 *
 * Nullable, never defaulted: NULL means the document states no bore for this row. That is a
 * different statement from "the bore is zero" and from "the bore equals the rim's" — the engine
 * reports the silence, and only the storefront decides what to fall back to.
 *
 * R-05 is untouched: a scalar column adds no foreign key, and the existing indexes are unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fitments', function (Blueprint $table): void {
            $table->decimal('centre_bore_mm', 5, 2)
                ->nullable()
                ->after('permitted_et_max')
                ->comment('Mittenlochbohrung this document states for THIS vehicle; NULL = the document states none');
        });

        // Positive when present, exactly as `chk_fts_load_index` guards its own nullable figure: a
        // bore of zero is not a measurement anybody wrote down.
        Constraints::add(
            'fitments',
            'chk_fitment_centre_bore_positive',
            '`centre_bore_mm` IS NULL OR `centre_bore_mm` > 0',
        );
    }

    public function down(): void
    {
        // The constraint first: MySQL refuses to drop a column a CHECK clause still names.
        Constraints::dropIfExists('fitments', 'chk_fitment_centre_bore_positive');

        Schema::table('fitments', function (Blueprint $table): void {
            $table->dropColumn('centre_bore_mm');
        });
    }
};
