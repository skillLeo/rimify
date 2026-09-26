<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The same mark `pages.team_edited_at` carries, for the FAQ and the menus: the first time the
 * client's team changed a row in the admin. ContentSeeder — which a release re-runs — matches FAQ
 * rows on their question and menu rows on their label, so a renamed row would come back under its
 * old words beside the new one. Once the team has touched a list, the seeder leaves that list alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faq_entries', function (Blueprint $table): void {
            $table->timestamp('team_edited_at')->nullable()->after('published');
        });

        Schema::table('nav_items', function (Blueprint $table): void {
            $table->timestamp('team_edited_at')->nullable()->after('visible');
        });
    }

    public function down(): void
    {
        Schema::table('nav_items', function (Blueprint $table): void {
            $table->dropColumn('team_edited_at');
        });

        Schema::table('faq_entries', function (Blueprint $table): void {
            $table->dropColumn('team_edited_at');
        });
    }
};
