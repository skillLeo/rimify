<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-person settings for the admin panel itself — first of all whether the rail is collapsed.
 *
 * On the account, not in the browser: the rail's width is the first thing on every page, and a
 * preference read after hydration makes every load show a 260 px rail snapping to 64 px
 * (docs/design/sections/admin-shell.md §5.9). Read on the server it is right in the first frame.
 *
 * One JSON column rather than a column per setting, because it holds presentation choices that
 * nothing ever filters or joins on — the dashboard's remembered period will live here too. Null
 * means "never touched", and every reader supplies its own default.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table): void {
            $table->json('preferences')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('admin_users', function (Blueprint $table): void {
            $table->dropColumn('preferences');
        });
    }
};
