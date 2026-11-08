<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Every pairing of load index and speed symbol the ETRTO knows (the client's round of 08.11.2026, §4, D-442):
 *
 * - a C tyre's second load index, for twin wheels — `235/65 R16 C 115/113R` — kept beside the first as the paper prints it. The first is
 *   the minimum the shop reads; nothing reads the second.
 * - J (100 km/h) and K (110 km/h) below L. Speed symbols are compared by rank, never as letters, so every rank on record moves up by
 *   two at once — the reference table and every tyre in the catalogue — and the order between any two stays what it was.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_tyre_lines', function (Blueprint $t): void {
            $t->unsignedSmallInteger('front_load_index_dual')->nullable()->after('front_load_index');
            $t->unsignedSmallInteger('rear_load_index_dual')->nullable()->after('rear_load_index');
        });

        // From the top down: the rank is unique in the reference table.
        DB::statement('UPDATE `speed_symbol_table` SET `speed_rank` = `speed_rank` + 2 ORDER BY `speed_rank` DESC');
        DB::table('tyre_variants')->update(['speed_rank' => DB::raw('`speed_rank` + 2')]);
        DB::table('speed_symbol_table')->insert([
            ['symbol' => 'J', 'speed_rank' => 1, 'max_kmh' => 100],
            ['symbol' => 'K', 'speed_rank' => 2, 'max_kmh' => 110],
        ]);
    }

    public function down(): void
    {
        if (DB::table('tyre_variants')->whereIn('speed_symbol', ['J', 'K'])->exists()) {
            throw new RuntimeException('Im Katalog stehen Reifen mit J oder K: ohne diese Symbole hätten sie keinen Rang.');
        }

        DB::table('speed_symbol_table')->whereIn('symbol', ['J', 'K'])->delete();
        DB::statement('UPDATE `speed_symbol_table` SET `speed_rank` = `speed_rank` - 2 ORDER BY `speed_rank` ASC');
        DB::table('tyre_variants')->update(['speed_rank' => DB::raw('`speed_rank` - 2')]);

        Schema::table('document_tyre_lines', function (Blueprint $t): void {
            $t->dropColumn(['front_load_index_dual', 'rear_load_index_dual']);
        });
    }
};
