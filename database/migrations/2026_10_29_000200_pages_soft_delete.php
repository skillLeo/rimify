<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * A Ratgeber article can be deleted (the client's admin item 12, D-351): it leaves the admin's list and the shop, and keeps
 * its published versions — page_revisions restricts a hard delete by design, the history of what the shop said stays.
 * Its address stays taken, so a release's seeder never brings a deleted article back under it (ContentSeeder leaves every
 * page the team has touched alone, and a delete is such a touch).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->timestamp('deleted_at')->nullable()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table): void {
            $table->dropColumn('deleted_at');
        });
    }
};
