<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * The client's #19 as promised (D-344): stars typed in the admin per rim — the rating, the number of reviews behind it
 * and the sentence that says where they come from. Kept apart from `rating` / `rating_count`, which stay what the buyers'
 * visible reviews add up to (ReviewSummary, D-103): nothing typed is ever added to those, nor read by the structured data.
 *
 * All three or none. Without its sentence a rating cannot be stored at all, so the shop can never show stars that do not
 * say where they come from. Every term is spelled out with IS NOT NULL: a CHECK passes on NULL, and `count >= 1` alone
 * would let a rating through with no count.
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
            $t->string('stated_rating_origin', 200)->nullable()->after('stated_rating_count')
                ->comment('the sentence shown beside the stars: where they come from');
        });

        Constraints::add(
            'wheel_models',
            'chk_wheel_model_stated_rating',
            '(`stated_rating` IS NULL AND `stated_rating_count` IS NULL AND `stated_rating_origin` IS NULL)'
            .' OR (`stated_rating` IS NOT NULL AND `stated_rating_count` IS NOT NULL AND `stated_rating_origin` IS NOT NULL'
            .' AND `stated_rating` >= 1.0 AND `stated_rating` <= 5.0 AND `stated_rating_count` >= 1'
            .' AND CHAR_LENGTH(TRIM(`stated_rating_origin`)) > 0)',
        );
    }

    public function down(): void
    {
        Constraints::dropIfExists('wheel_models', 'chk_wheel_model_stated_rating');

        Schema::table('wheel_models', function (Blueprint $t): void {
            $t->dropColumn(['stated_rating', 'stated_rating_count', 'stated_rating_origin']);
        });
    }
};
