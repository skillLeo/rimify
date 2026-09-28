<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A car read from a Gutachten (Block C, item 7) has no HSN, no TSN and no export id: the real documents name
 * cars by EG type-approval number, the maker's Fahrzeugtyp and a kW band — never by the key numbers of the
 * Zulassungsbescheinigung (docs/launch/BLOCKED.md, top). RIMIFY never invents them, so for such a car they
 * stay empty until a vehicle dataset brings them, and the later import merges onto the car by EG number and
 * Fahrzeugtyp (docs/specs/vehicles-and-tyres.md, C8).
 *
 * Only a car from a Gutachten or checked by hand may lack them; HSN and TSN are always both there or both
 * missing — never one without the other.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $t): void {
            $t->string('hsn', 4)->nullable()->change();
            $t->string('tsn', 3)->nullable()->change();
            $t->unsignedInteger('source_vehicle_id')->nullable()->comment('fahrzeug_id from the export; NULL for a car typed from a Gutachten or by hand')->change();
        });

        Constraints::add('vehicles', 'chk_veh_keys_paired', '(`hsn` IS NULL) = (`tsn` IS NULL)');
        Constraints::add('vehicles', 'chk_veh_keys_from_source', "`hsn` IS NOT NULL OR `source` IN ('gutachten', 'manuell_geprueft')");
        Constraints::add('vehicles', 'chk_veh_export_id_from_source', "`source_vehicle_id` IS NOT NULL OR `source` IN ('gutachten', 'manuell_geprueft')");
    }

    public function down(): void
    {
        Constraints::dropIfExists('vehicles', 'chk_veh_export_id_from_source');
        Constraints::dropIfExists('vehicles', 'chk_veh_keys_from_source');
        Constraints::dropIfExists('vehicles', 'chk_veh_keys_paired');

        Schema::table('vehicles', function (Blueprint $t): void {
            $t->string('hsn', 4)->nullable(false)->change();
            $t->string('tsn', 3)->nullable(false)->change();
            $t->unsignedInteger('source_vehicle_id')->nullable(false)->comment('fahrzeug_id from the export')->change();
        });
    }
};
