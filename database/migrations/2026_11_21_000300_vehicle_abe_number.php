<?php

declare(strict_types=1);

use App\Support\EgNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Field K of the papers holds „EG-Typgenehmigung oder ABE“: on a car built before 1996 it is the national ABE number („C640*“),
 * no EG number. The import kept only EG numbers and dropped these (D-502, the operator's answer of 21.11.2026). They are kept
 * now, on the car and on the import's work table, as information only: no verdict reads them, no customer sees them.
 *
 * Up fills the column for cars already imported from their own record of the file's row (`raw.import.row.eg_nummer`), where
 * that value is no EG number. Down drops the columns; the record of the row keeps the value as it always did.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['vehicles', 'vehicle_import_stage'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->string('abe_nummer_raw', 64)->nullable()->after('eg_nummer_norm')
                    ->comment('Feld K, wo es keine EG-Nummer ist: die nationale ABE-Nummer, wie gelesen — nur zur Information');
            });
        }

        DB::table('vehicles')->whereNull('eg_nummer_raw')->whereNotNull('raw')->orderBy('id')->select(['id', 'raw'])
            ->chunkById(500, static function ($cars): void {
                foreach ($cars as $car) {
                    $raw = json_decode((string) $car->raw, true);
                    $k = is_array($raw) ? trim((string) ($raw['import']['row']['eg_nummer'] ?? '')) : '';

                    if ($k !== '' && mb_strlen($k) <= 64 && EgNumber::parse($k) === null) {
                        DB::table('vehicles')->where('id', $car->id)->update(['abe_nummer_raw' => $k]);
                    }
                }
            });
    }

    public function down(): void
    {
        foreach (['vehicles', 'vehicle_import_stage'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->dropColumn('abe_nummer_raw');
            });
        }
    }
};
