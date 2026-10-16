<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DocumentDeratingRequest;
use App\Models\ApprovalDocument;
use App\Models\DocumentSpeedDerating;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * A draft Gutachten's own table of tyre load at speed, saved whole (the operator's review of C9, §5): the
 * table belongs to its document like its Auflagen, and a document without one answers UNKNOWN above
 * 210 km/h. Authorised through DocumentDeratingRequest (R-11); one Protokoll entry per save.
 */
class GutachtenTabelleController extends Controller
{
    public function update(DocumentDeratingRequest $request, ApprovalDocument $document): RedirectResponse
    {
        $cells = $request->cells();
        $page = $request->sourcePage();

        // Nothing saved over nothing: no change, so no Protokoll entry saying one happened (ADMIN-GEFUNDEN 509's class).
        if ($cells === [] && ! DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->exists()) {
            return back()->with('toast', 'Es war keine Tabelle eingetragen.');
        }

        DB::transaction(static function () use ($cells, $page, $document, $request): void {
            $before = DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->count();
            DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->delete();
            $now = now();

            DocumentSpeedDerating::query()->insert(array_map(static fn (array $cell): array => [
                'approval_document_id' => $document->id,
                'speed_kmh' => $cell['speed_kmh'],
                'symbol' => $cell['symbol'],
                'percent' => $cell['percent'],
                'source_page' => $page,
                // Typed by a person from the document: whatever the seed wrote before is gone.
                'seeded_from' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ], $cells));

            AuditTrail::record($request->admin(), $cells === [] ? 'approval.derating_removed' : 'approval.derating_saved', [
                'document' => FitmentRows::label($document),
                'rows' => count(array_unique(array_column($cells, 'speed_kmh'))),
                'cells' => count($cells),
                'before' => $before,
            ], $document);
        });

        return back()->with('toast', $cells === [] ? 'Tabelle entfernt.' : 'Tabelle gespeichert.');
    }
}
