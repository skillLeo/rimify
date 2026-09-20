<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the catalogue needs in order to be SHOWN.
 *
 * Every visual on this site is drawn, not photographed, so "which wheel do I draw for this row"
 * is catalogue data rather than a media asset: `spoke_count` on the model and `art_finish` on the
 * finish are the two arguments `wheelSVG()` takes. Without them every card in the grid renders the
 * same five-spoke graphite wheel and the listing looks like a placeholder.
 *
 * Ratings live here too, denormalised as an average and a count. They are displayed, never
 * computed at read time: a review table does not exist yet, and a star figure recomputed on every
 * listing render would be the slowest join on the busiest page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheel_models', function (Blueprint $table): void {
            // 5, 7, 10 or 20 — the four counts the artwork spec draws.
            $table->unsignedTinyInteger('spoke_count')->default(5)->after('type_designation');

            // 4.8 as shown, rendered 4,8 by GermanFormat. NULL means genuinely unrated, which the
            // card must render as nothing at all rather than as zero stars.
            $table->decimal('rating', 2, 1)->nullable()->after('spoke_count');
            $table->unsignedInteger('rating_count')->default(0)->after('rating');
        });

        Schema::table('wheel_finishes', function (Blueprint $table): void {
            // Which of the five drawn palettes this finish uses. Deliberately separate from `hex`:
            // the swatch a customer taps and the metal the generator shades are different things,
            // and two finishes may share a palette while showing different swatches.
            $table->string('art_finish', 16)->default('graphite')->after('hex');
        });

        Constraints::add('wheel_models', 'chk_wheel_model_spokes', '`spoke_count` IN (5, 7, 10, 20)');
        Constraints::add(
            'wheel_models',
            'chk_wheel_model_rating',
            '`rating` IS NULL OR (`rating` >= 1.0 AND `rating` <= 5.0)',
        );
        Constraints::enum('wheel_finishes', 'art_finish', [
            'graphite', 'silver', 'black', 'bronze', 'polished',
        ]);
    }

    public function down(): void
    {
        Constraints::drop('wheel_models', 'chk_wheel_model_spokes');
        Constraints::drop('wheel_models', 'chk_wheel_model_rating');
        Constraints::drop('wheel_finishes', 'chk_wheel_finishes_art_finish');

        Schema::table('wheel_models', function (Blueprint $table): void {
            $table->dropColumn(['spoke_count', 'rating', 'rating_count']);
        });

        Schema::table('wheel_finishes', function (Blueprint $table): void {
            $table->dropColumn('art_finish');
        });
    }
};
