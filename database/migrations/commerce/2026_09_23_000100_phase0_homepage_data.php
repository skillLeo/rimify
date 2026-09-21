<?php

declare(strict_types=1);

use App\Support\MakeName;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * What the rebuilt homepage needs from the data:
 *
 *  - the EU tyre label's noise class and the EPREL id, so the Kompletträder band can show the
 *    label from product data and link to the register (F11);
 *  - a settings table for admin-chosen values such as the hero product (`hero_product_id`);
 *  - one spelling per make and brand. Names are compared without regard to case, and a row that
 *    only differs in case from another is the same name written twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tyre_variants', function (Blueprint $table): void {
            $table->char('eu_noise_class', 1)->nullable()->after('eu_noise_db')->comment('A | B | C');
            $table->string('eprel_id', 32)->nullable()->after('eu_noise_class')->comment('EU product database entry');
        });

        Schema::create('settings', function (Blueprint $table): void {
            $table->string('key', 64)->primary();
            $table->json('value');
            $table->timestamps();
        });

        foreach (DB::table('vehicles')->distinct()->pluck('make') as $make) {
            $normalised = MakeName::normalise((string) $make);

            if ($normalised !== '' && $normalised !== $make) {
                DB::table('vehicles')->where('make', $make)->update(['make' => $normalised]);
            }
        }

        foreach (DB::table('brands')->get(['id', 'name']) as $brand) {
            $normalised = MakeName::normalise((string) $brand->name);

            if ($normalised !== '' && $normalised !== $brand->name) {
                DB::table('brands')->where('id', $brand->id)->update(['name' => $normalised]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');

        Schema::table('tyre_variants', function (Blueprint $table): void {
            $table->dropColumn(['eu_noise_class', 'eprel_id']);
        });
    }
};
