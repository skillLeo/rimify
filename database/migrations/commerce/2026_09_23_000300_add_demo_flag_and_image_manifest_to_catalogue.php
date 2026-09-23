<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the demo catalogue needs in order to be shown honestly.
 *
 *  - `wheel_models.is_demo`: a row seeded from public specification sheets and free-licence
 *    photography, never real stock. The storefront shows a *Demodaten* note while any such row is
 *    published, and the client removes the flag together with the rows before launch
 *    (docs/phase0/OVERHAUL.md §2, "Before launch").
 *  - `wheel_finishes.image_manifest`: the packshot of one finish as the `Picture` component reads
 *    it — name, base path, dimensions, widths, fallback format, placeholder — written by
 *    `wheels:process-images`. NULL means "no photograph", and a card with NULL draws the technical
 *    outline rather than borrowing another finish's picture.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheel_models', function (Blueprint $table): void {
            $table->boolean('is_demo')->default(false)->after('status')->comment('seeded demo row, never real stock');
        });

        Schema::table('wheel_finishes', function (Blueprint $table): void {
            $table->json('image_manifest')->nullable()->after('art_finish')->comment('Picture manifest of the cut-out; NULL = no photograph');
        });
    }

    public function down(): void
    {
        Schema::table('wheel_finishes', function (Blueprint $table): void {
            $table->dropColumn('image_manifest');
        });

        Schema::table('wheel_models', function (Blueprint $table): void {
            $table->dropColumn('is_demo');
        });
    }
};
