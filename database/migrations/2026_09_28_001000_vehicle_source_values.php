<?php

declare(strict_types=1);

use App\Enums\VehicleSource;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A car's source is one of a fixed list (VehicleSource), and a car typed from a Gutachten says which
 * document and page it came from — the user's decision of 2026-09-28: a freigegebenes Gutachten may name
 * a car from an import, from a Gutachten or checked by hand, never one from the development seeder.
 *
 * `source_document_id` has no referential action: a Gutachten that sourced a car cannot be deleted while
 * the car exists, so no car ever loses the page it was read from.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Anything written before the list existed (`import:…` from 000700's comment) is not on it.
        DB::table('vehicles')->whereNotIn('source', VehicleSource::values())->update(['source' => VehicleSource::Entwicklung->value]);

        Schema::table('vehicles', function (Blueprint $t): void {
            $t->foreignId('source_document_id')->nullable()->after('source')->constrained('approval_documents');
            $t->unsignedSmallInteger('source_page')->nullable()->after('source_document_id');
        });

        Constraints::enum('vehicles', 'source', VehicleSource::values());
        Constraints::add('vehicles', 'chk_veh_source_document', "`source` <> 'gutachten' OR `source_document_id` IS NOT NULL");
    }

    public function down(): void
    {
        Constraints::drop('vehicles', 'chk_veh_source_document');
        Constraints::drop('vehicles', 'chk_vehicles_source');

        Schema::table('vehicles', function (Blueprint $t): void {
            $t->dropConstrainedForeignId('source_document_id');
            $t->dropColumn('source_page');
        });
    }
};
