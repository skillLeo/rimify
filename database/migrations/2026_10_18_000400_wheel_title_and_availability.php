<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * His admin items 4 to 7 and 13 (Group D).
 *
 * - `wheel_models.title` (D-298): the wheel's name in the shop where a person wrote one. Empty, the shop composes it from
 *   the brand, the model and the Radtypenbezeichnung (`type_designation`, the designation the Gutachten identify the
 *   wheel by) — WheelTitle. A typed title is never overwritten by a later change to its parts; the admin flags it.
 * - `wheel_configs.available` (D-299): whether a size can be bought — „verfügbar“ or „nicht verfügbar“, set by a person or
 *   by the supplier's file. Taken over once from the count: nought is not available. `stock_qty` stays and is not read.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheel_models', function (Blueprint $t): void {
            $t->string('title', 160)->nullable()->after('type_designation')
                ->comment('the name in the shop as typed; NULL = brand + model + Radtypenbezeichnung (WheelTitle)');
        });

        Schema::table('wheel_configs', function (Blueprint $t): void {
            $t->boolean('available')->default(true)->after('stock_qty')
                ->comment('verfügbar / nicht verfügbar (D-299); stock_qty is kept and no longer read');
        });

        DB::table('wheel_configs')->where('stock_qty', 0)->update(['available' => false]);
    }

    public function down(): void
    {
        Schema::table('wheel_configs', function (Blueprint $t): void {
            $t->dropColumn('available');
        });

        Schema::table('wheel_models', function (Blueprint $t): void {
            $t->dropColumn('title');
        });
    }
};
