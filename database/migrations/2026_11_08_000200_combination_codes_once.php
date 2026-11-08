<?php

declare(strict_types=1);

use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\Entry\CombinationCodeRepair;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use Illuminate\Database\Migrations\Migration;

/**
 * A code typed beside one combination of step 4 stays with that combination (D-437): the rows written before it, put right once —
 * that code off the size it reached another combination through, and nothing else (CombinationCodeRepair). Released papers and
 * drafts alike: a draft's rows are what its step 5 shows.
 */
return new class extends Migration
{
    public function up(): void
    {
        $repair = new CombinationCodeRepair(new DocumentEntryWriter);

        foreach (CombinationCodeRepair::papers() as $id) {
            $result = $repair->repair(ApprovalDocument::query()->findOrFail($id));

            foreach ($result['removed'] as $line) {
                echo "  D-437 Gutachten {$id}: {$line} entfernt\n";
            }
        }
    }

    public function down(): void
    {
        // The codes that came off belonged to another combination: putting them back would say it again.
    }
};
