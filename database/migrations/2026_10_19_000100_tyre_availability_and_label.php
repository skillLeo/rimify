<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * His admin item 10 (Group E): tyres made and kept in the admin, with the EU tyre label from the start.
 *
 * - `tyre_variants.available` (D-301): a tyre can be bought or not — „verfügbar“ or „nicht verfügbar“, as a rim since
 *   D-299. Taken over once from the count: nought is not available. `stock_qty` stays and is not read.
 * - `eu_snow_grip`, `eu_ice_grip` (D-302): the label's two pictograms (Regulation (EU) 2020/740) — the snowflake on the
 *   mountain (3PMSF) and the ice grip. NULL is not „no“: it is not on record, and a tyre whose label is not complete on
 *   record is not offered (D-303).
 */
return new class extends Migration
{
    /** Fuel efficiency and wet grip, A to E (Regulation (EU) 2020/740, Annex I). */
    private const CLASSES = ['A', 'B', 'C', 'D', 'E'];

    public function up(): void
    {
        Schema::table('tyre_variants', function (Blueprint $t): void {
            // After is_demo, which follows stock_qty by the Komplettrad spec (KomplettradColumnsTest).
            $t->boolean('available')->default(true)->after('is_demo')
                ->comment('verfügbar / nicht verfügbar (D-301); stock_qty is kept and no longer read');
            $t->boolean('eu_snow_grip')->nullable()->after('eu_noise_class')
                ->comment('EU label: snow grip pictogram (3PMSF); NULL = not on record');
            $t->boolean('eu_ice_grip')->nullable()->after('eu_snow_grip')
                ->comment('EU label: ice grip pictogram; NULL = not on record');
        });

        DB::table('tyre_variants')->where('stock_qty', 0)->update(['available' => false]);

        // The classes the regulation knows, and no others — NULL stays allowed: not on record.
        Constraints::enum('tyre_variants', 'eu_fuel_class', self::CLASSES);
        Constraints::enum('tyre_variants', 'eu_wet_grip_class', self::CLASSES);
        Constraints::enum('tyre_variants', 'eu_noise_class', ['A', 'B', 'C']);
    }

    public function down(): void
    {
        foreach (['eu_fuel_class', 'eu_wet_grip_class', 'eu_noise_class'] as $column) {
            Constraints::dropIfExists('tyre_variants', 'chk_tyre_variants_'.$column);
        }

        Schema::table('tyre_variants', function (Blueprint $t): void {
            $t->dropColumn(['available', 'eu_snow_grip', 'eu_ice_grip']);
        });
    }
};
