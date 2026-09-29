<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * A demo product can never be published to the storefront (the review release §2): example data
 * lives in the admin, and the shop shows real records only. Every storefront query asks for
 * `status = 'published'`, so the rule is kept where no query can forget it — the table itself
 * refuses a row that is both demo and published.
 *
 * Demo models published before the rule become drafts first; nothing is deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('wheel_models')->where('is_demo', true)->where('status', 'published')->update(['status' => 'draft']);

        DB::statement("ALTER TABLE wheel_models ADD CONSTRAINT wheel_models_demo_never_published CHECK (is_demo = 0 OR status <> 'published')");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE wheel_models DROP CHECK wheel_models_demo_never_published');
    }
};
