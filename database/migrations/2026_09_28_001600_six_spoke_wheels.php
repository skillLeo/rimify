<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;

/**
 * A wheel may have six spokes. The first list (5, 7, 10, 20) was the drawing's, for invented demo wheels;
 * the first real product, the Borbet DB8GT2, is a six-spoke wheel, and a real figure is never bent to
 * fit a drawing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Constraints::drop('wheel_models', 'chk_wheel_model_spokes');
        Constraints::add('wheel_models', 'chk_wheel_model_spokes', '`spoke_count` IN (5, 6, 7, 10, 20)');
    }

    public function down(): void
    {
        Constraints::drop('wheel_models', 'chk_wheel_model_spokes');
        Constraints::add('wheel_models', 'chk_wheel_model_spokes', '`spoke_count` IN (5, 7, 10, 20)');
    }
};
