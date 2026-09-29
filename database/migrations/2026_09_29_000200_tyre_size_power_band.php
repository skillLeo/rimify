<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The kW band a Gutachten states for a tyre size (Block D; the Borbet brief §2.6): ABE 55255 prints its
 * Verwendungsbereich as „kW-Bereich | Reifen | Reifenbezogene Auflagen“ — BMW 1er 187 may carry 215/35R19
 * at 85–125 kW and 225/35R19 at 85–195 kW. The band belongs to the size, so it is stored beside it and a
 * size is offered only for a car whose power it covers. NULL on both: the document states no band.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fitment_tyre_sizes', function (Blueprint $t): void {
            $t->unsignedSmallInteger('kw_min')->nullable()->after('axle')->comment('the kW band the document states for this size, from');
            $t->unsignedSmallInteger('kw_max')->nullable()->after('kw_min')->comment('… to; NULL on both = no band stated');
        });

        Constraints::add('fitment_tyre_sizes', 'chk_fts_kw_band', '(`kw_min` IS NULL AND `kw_max` IS NULL) OR (`kw_min` > 0 AND `kw_max` >= `kw_min`)');
    }

    public function down(): void
    {
        Constraints::dropIfExists('fitment_tyre_sizes', 'chk_fts_kw_band');

        Schema::table('fitment_tyre_sizes', function (Blueprint $t): void {
            $t->dropColumn(['kw_min', 'kw_max']);
        });
    }
};
