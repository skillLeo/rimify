<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A page's version: one more on every write (draft saved or discarded, published, withdrawn,
 * restored). The editor sends the version it loaded; a write from a page that is out of date is
 * refused instead of silently undoing a colleague's newer draft or live words.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->unsignedInteger('content_version')->default(0)->after('team_edited_at');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->dropColumn('content_version');
        });
    }
};
