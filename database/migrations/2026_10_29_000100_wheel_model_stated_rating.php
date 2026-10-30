<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * The client's #19 (D-344, D-345): stars typed in the admin per rim — the rating and the number of reviews behind it.
 * Kept apart from `rating` / `rating_count`, which stay what the buyers' visible reviews add up to (ReviewSummary,
 * D-103): nothing typed is ever added to those, nor read by the structured data. The sentence shown beside typed stars is
 * one shop-wide setting (StatedRatings::DISCLOSURE_SETTING); without it no typed stars render.
 *
 * Both or neither. Each term is spelled out with IS NOT NULL: a CHECK passes on NULL, and `count >= 1` alone would let a
 * rating through with no count.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheel_models', function (Blueprint $t): void {
            $t->decimal('stated_rating', 2, 1)->nullable()->after('rating_count')
                ->comment('stars typed in the admin (#19, D-344); never the buyers\' rating, never in the structured data');
            $t->unsignedInteger('stated_rating_count')->nullable()->after('stated_rating')
                ->comment('the number of reviews behind stated_rating, as typed');
        });

        Constraints::add(
            'wheel_models',
            'chk_wheel_model_stated_rating',
            '(`stated_rating` IS NULL AND `stated_rating_count` IS NULL)'
            .' OR (`stated_rating` IS NOT NULL AND `stated_rating_count` IS NOT NULL'
            .' AND `stated_rating` >= 1.0 AND `stated_rating` <= 5.0 AND `stated_rating_count` >= 1)',
        );
    }

    public function down(): void
    {
        Constraints::dropIfExists('wheel_models', 'chk_wheel_model_stated_rating');

        Schema::table('wheel_models', function (Blueprint $t): void {
            $t->dropColumn(['stated_rating', 'stated_rating_count']);
        });
    }
};
