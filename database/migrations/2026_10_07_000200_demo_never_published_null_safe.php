<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
 * The acceptance set's exception to „a demo model is never published“ (2026_10_07_000100) read `… OR demo_ref LIKE
 * 'abnahme:%'`. For a demo model without a ref that comparison is NULL, and a CHECK that comes out NULL passes: every
 * unmarked demo model could be published again. Null-safe now — a demo model is published only with an `abnahme:`
 * ref — and a row that slipped through the hole goes back to draft first, so nothing fails open (CLAUDE.md §2). Found by
 * the suite's first run on CI (DemoFlagTest, DemoCatalogueTest).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('wheel_models')
            ->where('is_demo', true)
            ->where('status', 'published')
            ->where(static fn ($q) => $q->whereNull('demo_ref')->orWhere('demo_ref', 'not like', 'abnahme:%'))
            ->update(['status' => 'draft']);

        DB::statement('ALTER TABLE wheel_models DROP CONSTRAINT wheel_models_demo_never_published');
        DB::statement("ALTER TABLE wheel_models ADD CONSTRAINT wheel_models_demo_never_published CHECK (is_demo = 0 OR status <> 'published' OR COALESCE(demo_ref, '') LIKE 'abnahme:%')");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE wheel_models DROP CONSTRAINT wheel_models_demo_never_published');
        DB::statement("ALTER TABLE wheel_models ADD CONSTRAINT wheel_models_demo_never_published CHECK (is_demo = 0 OR status <> 'published' OR demo_ref LIKE 'abnahme:%')");
    }
};
