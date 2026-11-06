<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * A version of a rim is one size row with all its measures (the Gutachten rework §8): diameter, width, ET, bolt pattern and centre
 * bore. The key held the bolt circle alone, so two bores of one size, or 4 × 100 beside 5 × 100, could not be stored: the save
 * was refused, though the page tells such versions apart. Wider, it refuses nothing the old key let in, and no verdict reads it.
 */
return new class extends Migration
{
    private const VERSION = ['wheel_model_id', 'wheel_finish_id', 'diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'];

    private const OLD = ['wheel_model_id', 'wheel_finish_id', 'diameter_in', 'width_in', 'et_mm', 'bolt_circle_mm'];

    public function up(): void
    {
        Schema::table('wheel_configs', function (Blueprint $table): void {
            $table->unique(self::VERSION, 'uq_wheel_version');
            $table->dropUnique('uq_wheel_config');
        });
    }

    public function down(): void
    {
        Schema::table('wheel_configs', function (Blueprint $table): void {
            $table->unique(self::OLD, 'uq_wheel_config');
            $table->dropUnique('uq_wheel_version');
        });
    }
};
