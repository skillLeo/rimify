<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * A dataset's number of a car is its own (D-297): KBA-Typdaten, TecDoc and DAT each count their cars from one, so a
 * TecDoc file and a KBA file may both hold a car number 1234. The number is unique within its source — never across
 * them, which refused the second dataset's cars for numbers that only happened to match. A car typed from a Gutachten or
 * by hand still has none (chk_veh_export_id_from_source).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $t): void {
            $t->unique(['source', 'source_vehicle_id'], 'uq_vehicle_source_number');
            $t->dropUnique('uq_vehicle_source');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $t): void {
            $t->unique(['source_vehicle_id'], 'uq_vehicle_source');
            $t->dropUnique('uq_vehicle_source_number');
        });
    }
};
