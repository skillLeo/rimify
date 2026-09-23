<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Which brands are wheel brands.
 *
 * The homepage brand wall shows every wheel brand with its logo, not only the ones that have wheels
 * in stock right now: a researched manufacturer whose catalogue is still on its way is shown
 * greyed, says so where its count would be, and is not a link — a tile that opens an empty listing
 * is a dead end (CLAUDE.md §2). A tyre brand (Bridgestone, Continental, Michelin) is not a wheel
 * brand and never reaches that wall. This flag is what tells the two apart; a published model with
 * stock says it as well, on its own, so a database whose flags were never set lists nothing less.
 *
 * Backfill: a brand that has at least one wheel_models row — any status, retired or not — has
 * offered wheels, and is marked. The tyre-only brands have none and stay false. BrandLogoSeeder
 * marks the researched brands on every release seed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table): void {
            $table->boolean('is_wheel_brand')->default(false)->after('logo_path')->comment('on the brand wall, stock or not');
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table): void {
            $table->dropColumn('is_wheel_brand');
        });
    }

    /**
     * Marks every brand that has a wheel_models row, whatever the row's status. Data only, no
     * DDL, so a test can run it inside its transaction.
     */
    public function backfill(): void
    {
        DB::table('brands')
            ->whereExists(function (Builder $models): void {
                $models->selectRaw('1')->from('wheel_models')->whereColumn('wheel_models.brand_id', 'brands.id');
            })
            ->update(['is_wheel_brand' => true]);
    }
};
