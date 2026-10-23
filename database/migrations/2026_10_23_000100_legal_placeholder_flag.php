<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * `pages.is_placeholder` (D-319, the operator's brief of 23.10.2026): a legal page says so while its text is not the
 * Kanzlei's — the page shows one notice and nothing else, and the shop stays out of search and out of live payments.
 * Switched off in the admin once the real text is in.
 *
 * Fail-closed (CLAUDE.md §2): the column's default is on, so a legal page made any other way than the seeder — a
 * restore, a script, a test — starts as a placeholder, and every legal page there is today starts as one, whatever its
 * sections hold. Only the switch in the admin says a text is the Kanzlei's. Only a legal page's flag is ever read
 * (LegalTexts, SeitenController); for the other kinds the column means nothing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->boolean('is_placeholder')->default(true)->after('lawyer_reviewed');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->dropColumn('is_placeholder');
        });
    }
};
