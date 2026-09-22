<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `wheel_configs.max_load_kg`: the Radlast a wheel's approval states for this configuration, in
 * kilograms (MOTEC MCR4-8519 in 5 × 112: 620 kg; in 5 × 120: 640 kg).
 *
 * Nullable, never defaulted: a load we have not read in the wheel's own document is unknown, and
 * an unknown load is not rendered (docs/phase0/ACCURACY.md D2). Zero would be a measurement.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheel_configs', function (Blueprint $table): void {
            $table->unsignedSmallInteger('max_load_kg')
                ->nullable()
                ->after('weight_g')
                ->comment('Radlast from the wheel\'s approval; NULL = not verified, not shown');
        });
    }

    public function down(): void
    {
        Schema::table('wheel_configs', function (Blueprint $table): void {
            $table->dropColumn('max_load_kg');
        });
    }
};
