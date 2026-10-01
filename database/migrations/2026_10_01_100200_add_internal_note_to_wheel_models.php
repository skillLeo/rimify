<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * An internal note on a Felge — „Platzhalterpreise, vom Kunden zu ersetzen“ — for whoever runs the shop. The admin
 * shows it above the Felge and in the list; nothing in the shop ever reads it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheel_models', function (Blueprint $t): void {
            $t->string('internal_note', 500)->nullable()->after('seo_description')->comment('admin only, never shown in the shop');
        });
    }

    public function down(): void
    {
        Schema::table('wheel_models', function (Blueprint $t): void {
            $t->dropColumn('internal_note');
        });
    }
};
