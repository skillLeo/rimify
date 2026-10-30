<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DocumentCombinationsApplyRequest;
use App\Http\Requests\Admin\DocumentCombinationsRequest;
use App\Models\ApprovalDocument;
use App\Models\DocumentTyreCombination;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\EditStamp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * A draft Gutachten's own „Bereifungskombinationen“ (D-256; his item 8, Group A of the admin round), per entry of its
 * Verwendungsbereich since his admin item 19 (D-358): the list of one EG type-approval number is saved whole, and once
 * there is one the shop offers no tyres for that vehicle type but the combinations it names. One combination can be put
 * on several entries at once. Authorised through the Form Requests (ApprovalDocumentPolicy::update, R-11); one Protokoll
 * entry per save.
 */
class GutachtenKombinationenController extends Controller
{
    public function update(DocumentCombinationsRequest $request, ApprovalDocument $document): RedirectResponse
    {
        $combinations = $request->combinations();
        $entry = $request->entry();
        $page = $request->sourcePage();
        $rows = DocumentTyreCombination::query()->where('approval_document_id', $document->id)->where('eg_number_norm', $entry);

        // Nothing saved over nothing: no change, so no Protokoll entry saying one happened (ADMIN-GEFUNDEN 509's class).
        if ($combinations === [] && ! (clone $rows)->exists()) {
            return back()->with('toast', 'Nichts geändert – für diese EG-Nummer sind keine Bereifungskombinationen eingetragen.');
        }

        DB::transaction(static function () use ($combinations, $entry, $page, $document, $request, $rows): void {
            // Saved whole: a list opened before someone else's save would put the old one back — refused instead (F-25).
            ApprovalDocument::query()->whereKey($document->id)->lockForUpdate()->first();
            EditStamp::guard($request, GutachtenController::combinationsState($document));
            $before = (clone $rows)->count();
            (clone $rows)->delete();
            $now = now();

            // Saved by a person: what was carried over is now theirs, no longer „übernommen, bitte prüfen“.
            DocumentTyreCombination::query()->insert(array_map(static fn (array $combination): array => $combination + [
                'approval_document_id' => $document->id,
                'eg_number' => $entry,
                'eg_number_norm' => $entry,
                'carried_over' => false,
                'source_page' => $page,
                'created_at' => $now,
                'updated_at' => $now,
            ], $combinations));

            AuditTrail::record($request->admin(), $combinations === [] ? 'approval.combinations_removed' : 'approval.combinations_saved', [
                'document' => FitmentRows::label($document),
                'eg_number' => $entry,
                'combinations' => count($combinations),
                'before' => $before,
            ], $document);
        });

        return back()->with('toast', $combinations === [] ? 'Bereifungskombinationen für diese EG-Nummer entfernt.' : 'Bereifungskombinationen gespeichert.');
    }

    /**
     * „Auf mehrere EG-Nummern anwenden“: one combination of one entry put on the others chosen — where an entry already
     * lists the same two sizes it is left as it is. Saves operators typing the same combination thirty times.
     */
    public function apply(DocumentCombinationsApplyRequest $request, ApprovalDocument $document): RedirectResponse
    {
        $source = $request->combination();
        $targets = $request->targets();
        $added = 0;

        DB::transaction(static function () use ($source, $targets, $document, $request, &$added): void {
            ApprovalDocument::query()->whereKey($document->id)->lockForUpdate()->first();
            EditStamp::guard($request, GutachtenController::combinationsState($document));
            $now = now();

            foreach ($targets as $target) {
                $exists = DocumentTyreCombination::query()
                    ->where('approval_document_id', $document->id)
                    ->where('eg_number_norm', $target)
                    ->where('front_width_mm', $source->front_width_mm)->where('front_aspect', $source->front_aspect)->where('front_diameter_in', $source->front_diameter_in)
                    ->where('rear_width_mm', $source->rear_width_mm)->where('rear_aspect', $source->rear_aspect)->where('rear_diameter_in', $source->rear_diameter_in)
                    ->exists();

                if ($exists) {
                    continue;
                }

                DocumentTyreCombination::query()->insert([
                    'approval_document_id' => $document->id,
                    'eg_number' => $target,
                    'eg_number_norm' => $target,
                    'carried_over' => false,
                    'number' => $source->number,
                    'front_width_mm' => $source->front_width_mm,
                    'front_aspect' => $source->front_aspect,
                    'front_diameter_in' => $source->front_diameter_in,
                    'rear_width_mm' => $source->rear_width_mm,
                    'rear_aspect' => $source->rear_aspect,
                    'rear_diameter_in' => $source->rear_diameter_in,
                    'source_page' => $source->source_page,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $added++;
            }

            AuditTrail::record($request->admin(), 'approval.combination_applied', [
                'document' => FitmentRows::label($document),
                'from' => $source->eg_number_norm,
                'number' => $source->number,
                'targets' => $targets,
                'added' => $added,
            ], $document);
        });

        return back()->with('toast', match ($added) {
            0 => 'Nichts eingetragen – die gewählten EG-Nummern haben diese Kombination schon.',
            1 => 'Kombination für eine weitere EG-Nummer eingetragen.',
            default => "Kombination für {$added} weitere EG-Nummern eingetragen.",
        });
    }
}
