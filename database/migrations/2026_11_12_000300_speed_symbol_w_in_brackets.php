<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * (W) between W and Y (the client's review of 11.11, D; D-453): a speed above 270 km/h whose limit only the tyre's maker states —
 * `245/40 ZR18 97(W)`. Speed symbols are compared by rank, never as letters, so Y and (Y) move up by one at once — the reference table
 * and every tyre in the catalogue — and the order between any two stays what it was. (W) is read at W's 270 km/h: never derived as a
 * minimum, and a (W) tyre never passes where Y is asked.
 */
return new class extends Migration
{
    public function up(): void
    {
        // From the top down: the rank is unique in the reference table.
        DB::statement('UPDATE `speed_symbol_table` SET `speed_rank` = `speed_rank` + 1 WHERE `speed_rank` >= 15 ORDER BY `speed_rank` DESC');
        DB::table('tyre_variants')->where('speed_rank', '>=', 15)->update(['speed_rank' => DB::raw('`speed_rank` + 1')]);
        DB::table('speed_symbol_table')->insert(['symbol' => '(W)', 'speed_rank' => 15, 'max_kmh' => 270]);
    }

    public function down(): void
    {
        $used = DB::table('tyre_variants')->where('speed_symbol', '(W)')->exists()
            || DB::table('document_tyre_lines')->where('front_speed_symbol', '(W)')->orWhere('rear_speed_symbol', '(W)')->exists()
            || DB::table('fitment_tyre_sizes')->where('min_speed_symbol', '(W)')->exists();

        if ($used) {
            throw new RuntimeException('Im Katalog oder in einem Gutachten steht (W): ohne dieses Symbol hätte es keinen Rang.');
        }

        DB::table('speed_symbol_table')->where('symbol', '(W)')->delete();
        DB::statement('UPDATE `speed_symbol_table` SET `speed_rank` = `speed_rank` - 1 WHERE `speed_rank` >= 16 ORDER BY `speed_rank` ASC');
        DB::table('tyre_variants')->where('speed_rank', '>=', 16)->update(['speed_rank' => DB::raw('`speed_rank` - 1')]);
    }
};
