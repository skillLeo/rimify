<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A brand's name and slug are unique among the brands that exist, not among the removed ones too
 * (K2-01, S1). A removed brand (soft-deleted) kept its name for ever: renaming a brand to it, „Neue Marke
 * anlegen" in the Felge form and an import naming it all died on the unique key.
 *
 * Neither MySQL nor MariaDB has a partial index, so the key sits on a generated column that holds the
 * value only while the row is not removed — NULLs never collide. The plain columns keep an ordinary
 * index for the lookups.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $t): void {
            $t->dropUnique(['name']);
            $t->dropUnique(['slug']);
            $t->index('name');
            $t->index('slug');
        });

        DB::statement('ALTER TABLE brands
            ADD COLUMN live_name VARCHAR(255) GENERATED ALWAYS AS (IF(deleted_at IS NULL, name, NULL)) VIRTUAL,
            ADD COLUMN live_slug VARCHAR(255) GENERATED ALWAYS AS (IF(deleted_at IS NULL, slug, NULL)) VIRTUAL');

        Schema::table('brands', function (Blueprint $t): void {
            $t->unique('live_name', 'uq_brands_live_name');
            $t->unique('live_slug', 'uq_brands_live_slug');
        });
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $t): void {
            $t->dropUnique('uq_brands_live_name');
            $t->dropUnique('uq_brands_live_slug');
            $t->dropColumn(['live_name', 'live_slug']);
            $t->dropIndex(['name']);
            $t->dropIndex(['slug']);
            $t->unique('name');
            $t->unique('slug');
        });
    }
};
