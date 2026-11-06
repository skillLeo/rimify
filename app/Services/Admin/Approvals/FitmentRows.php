<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\DocumentStatus;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EntryModel;
use Illuminate\Support\Facades\DB;

/**
 * The rows of one Gutachten, after they are written: staff enter a paper in its five steps and the writer turns that into
 * rows (DocumentEntryWriter). The Eintragung is never typed: `requires_entry` is derived from an Abnahme among a row's codes and
 * its sizes', or set by an override that carries its reason, its author and its time (the corrections memo §2). It is written
 * again whenever the document's list changes (refreshEntry).
 */
final class FitmentRows
{
    /**
     * Writes every row's derived Eintragung again — after the document's list changed, a code may have
     * become an Abnahme or stopped being one. An override stays as the person set it.
     */
    public static function refreshEntry(ApprovalDocument $document): void
    {
        // Entered through the five steps: an Abnahme, or an axle-load cap on a tyre, follows from the list too (DocumentEntryWriter).
        if ($document->status === DocumentStatus::Draft && EntryModel::of($document)->isEntered()) {
            (new DocumentEntryWriter)->write($document);

            return;
        }

        $abnahme = DB::table('document_conditions')->where('approval_document_id', $document->id)
            ->where('kind', ConditionKind::Abnahme->value)->pluck('code')->all();

        $rows = Fitment::query()->with(['conditionCodes', 'tyreSizes.conditionCodes'])
            ->where('approval_document_id', $document->id)->whereNull('entry_override')->get();

        foreach ($rows as $row) {
            $codes = $row->conditionCodes->pluck('code')->all();

            foreach ($row->tyreSizes as $size) {
                $codes = [...$codes, ...$size->conditionCodes->pluck('code')->all()];
            }

            $derived = array_intersect($codes, $abnahme) !== [];

            if ($row->requires_entry !== $derived) {
                $row->forceFill(['requires_entry' => $derived])->save();
            }
        }
    }

    public static function label(ApprovalDocument $document): string
    {
        return $document->kind->labelDe().' '.($document->number() ?? '#'.$document->id);
    }
}
