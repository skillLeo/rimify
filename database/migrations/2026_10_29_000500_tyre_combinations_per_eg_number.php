<?php

declare(strict_types=1);

use App\Services\Admin\Approvals\CombinationEntries;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Tyre combinations per entry of a Gutachten's Verwendungsbereich (his admin item 19; the operator's brief of
 * 29.10.2026, Batch 2, D-358): each row names the EG type-approval number of the vehicle type it belongs to, as the
 * document prints it. The lists entered per document before move onto every entry of that document, marked
 * „übernommen, bitte prüfen“ (CombinationEntries::carryOver) — the rows keep their ids on the first entry, so nothing an
 * order froze loses its row.
 *
 * Without changing a single verdict (the brief's §4): every car × rim pair a list reaches is read as the shop read the
 * lists before and per entry after (CombinationEntries::carryOverWithoutChange); where one answer would differ, nothing
 * is carried over, the table is put back as it was and the migration stops — the release with it
 * (CombinationCarryOverTest).
 */
return new class extends Migration
{
    private const PAIR = ['front_width_mm', 'front_aspect', 'front_diameter_in', 'rear_width_mm', 'rear_aspect', 'rear_diameter_in'];

    public function up(): void
    {
        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->string('eg_number', 64)->nullable()->after('approval_document_id')->comment('the entry\'s EG-Typgenehmigungsnummer as printed');
            $t->string('eg_number_norm', 64)->nullable()->after('eg_number');
            $t->boolean('carried_over')->default(false)->after('source_page')->comment('moved from the document-wide list: „übernommen, bitte prüfen“');
            // A pair once per entry, no longer once per document: a further entry's copy needs the room.
            $t->dropUnique('uq_document_tyre_combination');
        });

        try {
            $moved = (new CombinationEntries)->carryOverWithoutChange();
            Log::info('Bereifungskombinationen je EG-Nummer übernommen, kein Urteil geändert (D-358).', $moved);
        } catch (Throwable $refused) {
            Schema::table('document_tyre_combinations', function (Blueprint $t): void {
                $t->dropColumn(['eg_number', 'eg_number_norm', 'carried_over']);
            });
            Schema::table('document_tyre_combinations', function (Blueprint $t): void {
                $t->unique(['approval_document_id', ...self::PAIR], 'uq_document_tyre_combination');
            });

            throw $refused;
        }

        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->unique(['approval_document_id', 'eg_number_norm', ...self::PAIR], 'uq_document_tyre_combination');
            $t->index(['approval_document_id', 'eg_number_norm'], 'idx_document_tyre_combination_entry');
        });
    }

    public function down(): void
    {
        // One row per document and pair again — the oldest, which is the one the carry-over kept in place.
        $keep = DB::table('document_tyre_combinations')
            ->selectRaw('MIN(id) AS id')
            ->groupBy('approval_document_id', ...self::PAIR)
            ->pluck('id');
        DB::table('document_tyre_combinations')->whereNotIn('id', $keep)->delete();

        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->dropIndex('idx_document_tyre_combination_entry');
            $t->dropUnique('uq_document_tyre_combination');
            $t->dropColumn(['eg_number', 'eg_number_norm', 'carried_over']);
        });

        Schema::table('document_tyre_combinations', function (Blueprint $t): void {
            $t->unique(['approval_document_id', ...self::PAIR], 'uq_document_tyre_combination');
        });
    }
};
