<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DocumentCombinationsRequest;
use App\Models\ApprovalDocument;
use App\Models\DocumentTyreCombination;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use App\Support\EditStamp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * A draft Gutachten's own „Bereifungskombinationen“, saved whole (D-256; his item 8, Group A of the admin round): the
 * list belongs to its document like its table of tyre load at speed, and once there is one the shop offers no tyres
 * on that document but the combinations it names. Authorised through DocumentCombinationsRequest (R-11); one
 * Protokoll entry per save.
 */
class GutachtenKombinationenController extends Controller
{
    public function update(DocumentCombinationsRequest $request, ApprovalDocument $document): RedirectResponse
    {
        $combinations = $request->combinations();
        $page = $request->sourcePage();

        // Nothing saved over nothing: no change, so no Protokoll entry saying one happened (ADMIN-GEFUNDEN 509's class).
        if ($combinations === [] && ! DocumentTyreCombination::query()->where('approval_document_id', $document->id)->exists()) {
            return back()->with('toast', 'Es waren keine Bereifungskombinationen eingetragen.');
        }

        DB::transaction(static function () use ($combinations, $page, $document, $request): void {
            // Saved whole: a list opened before someone else's save would put the old one back — refused instead (F-25).
            ApprovalDocument::query()->whereKey($document->id)->lockForUpdate()->first();
            EditStamp::guard($request, GutachtenController::combinationsState($document));
            $before = DocumentTyreCombination::query()->where('approval_document_id', $document->id)->count();
            DocumentTyreCombination::query()->where('approval_document_id', $document->id)->delete();
            $now = now();

            DocumentTyreCombination::query()->insert(array_map(static fn (array $combination): array => $combination + [
                'approval_document_id' => $document->id,
                'source_page' => $page,
                'created_at' => $now,
                'updated_at' => $now,
            ], $combinations));

            AuditTrail::record($request->admin(), $combinations === [] ? 'approval.combinations_removed' : 'approval.combinations_saved', [
                'document' => FitmentRows::label($document),
                'combinations' => count($combinations),
                'before' => $before,
            ], $document);
        });

        return back()->with('toast', $combinations === [] ? 'Bereifungskombinationen entfernt.' : 'Bereifungskombinationen gespeichert.');
    }
}
