<?php

declare(strict_types=1);

use App\Services\Admin\Approvals\CombinationCars;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Front/rear pairs per car (his round of 08.11, §2; D-447): a row of `document_tyre_combinations` names the car it was entered
 * for, so two cars of one field K can hold different pairs. Every car a list reaches today gets the rows of its entry — the
 * first car the rows themselves, with their ids, every further car a copy (CombinationCars::bind) — and not a single verdict
 * changes: every car × rim pair a list reaches is read before and after; where one would differ, nothing is bound, the column
 * goes again and the migration stops, the release with it (CombinationCarsTest).
 */
return new class extends Migration
{
    private const PAIR = ['front_width_mm', 'front_aspect', 'front_diameter_in', 'rear_width_mm', 'rear_aspect', 'rear_diameter_in'];

    public function up(): void
    {
        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->foreignId('vehicle_id')->nullable()->after('approval_document_id')
                ->comment('the car the pair was entered for; NULL: matched by field K (eg_number_norm)')
                ->constrained('vehicles')->restrictOnDelete();
            // A pair once per car and entry: a further car's copy needs the room.
            $t->dropUnique('uq_document_tyre_combination');
        });

        // A row of the list no car's lines carry stays with its car all the same (DocumentEntryReader keeps it apart).
        Schema::table('document_kept_combinations', function (Blueprint $t): void {
            $t->foreignId('vehicle_id')->nullable()->after('approval_document_id')->constrained('vehicles')->restrictOnDelete();
        });

        try {
            $bound = (new CombinationCars)->bindWithoutChange();
            Log::info('Reifenkombinationen je Fahrzeug übernommen, kein Urteil geändert (D-447).', $bound);
        } catch (Throwable $refused) {
            $this->dropColumn();

            throw $refused;
        }

        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->unique(['approval_document_id', 'vehicle_id', 'eg_number_norm', ...self::PAIR], 'uq_document_tyre_combination');
            $t->index(['approval_document_id', 'vehicle_id'], 'idx_document_tyre_combination_car');
        });
    }

    public function down(): void
    {
        // One row per entry and pair again — the oldest, which is the one the binding kept in place.
        $keep = DB::table('document_tyre_combinations')
            ->selectRaw('MIN(id) AS id')
            ->groupBy('approval_document_id', 'eg_number_norm', ...self::PAIR)
            ->pluck('id');
        DB::table('document_tyre_combinations')->whereNotIn('id', $keep)->delete();
        $kept = DB::table('document_kept_combinations')
            ->selectRaw('MIN(id) AS id')
            ->groupBy('approval_document_id', 'eg_number_norm', ...self::PAIR)
            ->pluck('id');
        DB::table('document_kept_combinations')->whereNotIn('id', $kept)->delete();
        // The pairs put on a car's lines because its field K gave it them stay there: they are what the shop sold it.

        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->dropIndex('idx_document_tyre_combination_car');
            $t->dropUnique('uq_document_tyre_combination');
        });

        $this->dropColumn();
    }

    private function dropColumn(): void
    {
        Schema::table('document_kept_combinations', function (Blueprint $t): void {
            $t->dropForeign(['vehicle_id']);
            $t->dropColumn('vehicle_id');
        });
        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->dropForeign(['vehicle_id']);
            $t->dropColumn('vehicle_id');
        });
        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->unique(['approval_document_id', 'eg_number_norm', ...self::PAIR], 'uq_document_tyre_combination');
        });
    }
};
