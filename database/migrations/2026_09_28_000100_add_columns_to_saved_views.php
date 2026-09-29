<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A Gespeicherte Ansicht may carry its own columns — an explicit choice when it is saved („Spalten
 * mitspeichern“), off by default. Off, a view answers a question (its filters and sort) and leaves
 * every person's columns alone; on, it swaps them in for everyone it is shared with, the same way.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saved_views', function (Blueprint $table): void {
            $table->boolean('stores_columns')->default(false)->after('query');
            $table->json('columns')->nullable()->after('stores_columns');
        });
    }

    public function down(): void
    {
        Schema::table('saved_views', function (Blueprint $table): void {
            $table->dropColumn(['stores_columns', 'columns']);
        });
    }
};
