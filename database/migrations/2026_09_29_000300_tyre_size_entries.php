<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One tyre size may be printed more than once for the same car (Block D). ABE 55255 gives BMW Z3 its
 * 225/35R19 at 141–170, 85–110 and 85–125 kW, each with its own codes, and BMW 5er ActiveHybrid its sizes at
 * „225, 235“ kW; the 18″ Nachtrag gives BMW 346X its 225/40R18 as 88W, 88Y and 92. Each is an entry of its
 * own, so a row holds a size once per axle, kW band, load index and speed symbol — no longer once per axle.
 *
 * The key is a stored column, so an entry without a band or an index is still held once: a UNIQUE index
 * over the nullable columns themselves would let two of those in.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fitment_tyre_sizes', function (Blueprint $t): void {
            $t->string('entry_key', 96)
                ->storedAs("CONCAT_WS('|', `width_mm`, `aspect`, `diameter_in`, `axle`, IFNULL(`kw_min`, ''), IFNULL(`kw_max`, ''), IFNULL(`min_load_index`, ''), IFNULL(`min_speed_symbol`, ''))")
                ->after('kw_max')
                ->comment('size, axle, kW band and printed indexes: one entry each per row');
            // Added before the old one goes: the foreign key on fitment_id needs an index at every moment.
            $t->unique(['fitment_id', 'entry_key'], 'uq_fitment_tyre_size_entry');
        });

        Schema::table('fitment_tyre_sizes', function (Blueprint $t): void {
            $t->dropUnique('uq_fitment_tyre_size');
        });
    }

    public function down(): void
    {
        Schema::table('fitment_tyre_sizes', function (Blueprint $t): void {
            $t->unique(['fitment_id', 'width_mm', 'aspect', 'diameter_in', 'axle'], 'uq_fitment_tyre_size');
        });

        Schema::table('fitment_tyre_sizes', function (Blueprint $t): void {
            $t->dropUnique('uq_fitment_tyre_size_entry');
            $t->dropColumn('entry_key');
        });
    }
};
