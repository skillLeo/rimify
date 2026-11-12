<?php

declare(strict_types=1);

use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\Entry\CombinationCodesToSets;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The Auflagen of a tyre combination (the client's review of 11.11, A; D-451): a code typed beside a combination of step 4 belongs to
 * that combination — both its axles, and no other combination that shares one of its sizes. A combination of a paper's list is a row
 * of `document_tyre_combinations` (per car since D-447); its codes hang here, per wheel of the cell they were typed in, looked up in
 * that paper's Auflagenverzeichnis as every other code is. The row goes with its combination: the list is written anew on every save
 * of a draft.
 *
 * The rows written before it are moved once (CombinationCodesToSets): released papers and drafts alike, exactly what the writer now
 * writes — the code off the sizes, onto the combination — and nothing else. Back: onto the sizes again, both sides, and the table goes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_tyre_combination_conditions', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('document_tyre_combination_id')->constrained('document_tyre_combinations', 'id', 'fk_tyre_combination_condition')->cascadeOnDelete();
            // The wheel it was typed for: a colour of a version of the cell (car × wheel combination) the line stands in. The car's list
            // is one for all its cells (D-447); a code typed in one cell is that cell's, and reaches no wheel of another.
            $t->foreignId('wheel_config_id')->constrained('wheel_configs', 'id', 'fk_tyre_combination_condition_wheel')->restrictOnDelete();
            $t->string('code', 32)->collation('utf8mb4_bin')->comment('as printed');
            $t->timestamps();
            $t->unique(['document_tyre_combination_id', 'wheel_config_id', 'code'], 'uq_tyre_combination_condition');
        });

        $move = new CombinationCodesToSets(new DocumentEntryWriter);

        foreach (CombinationCodesToSets::papers() as $id) {
            $result = $move->move(ApprovalDocument::query()->findOrFail($id));

            foreach ($result['moved'] as $line) {
                echo "  D-451 Gutachten {$id}: {$line} → Kombination\n";
            }

            foreach ($result['left'] as $line) {
                echo "  D-451 Gutachten {$id}: {$line} unverändert\n";
            }
        }
    }

    public function down(): void
    {
        $move = new CombinationCodesToSets(new DocumentEntryWriter);

        foreach (DB::table('document_tyre_combinations')->distinct()->orderBy('approval_document_id')->pluck('approval_document_id') as $id) {
            $move->back((int) $id);
        }

        Schema::dropIfExists('document_tyre_combination_conditions');
    }
};
