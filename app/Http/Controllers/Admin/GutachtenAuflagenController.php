<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DocumentConditionBatchRequest;
use App\Http\Requests\Admin\DocumentConditionRequest;
use App\Http\Requests\Admin\LoadLimitConfirmRequest;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Step 4 of the entry flow: a Gutachten's own Auflagenverzeichnis, written while the document is a draft.
 * Every write is authorised by ApprovalDocumentPolicy through its Form Request (R-11) and leaves one
 * Protokoll entry (DocumentConditions).
 */
class GutachtenAuflagenController extends Controller
{
    public const ADDED = 'Code gespeichert.';

    public const CHANGED = 'Gespeichert.';

    public const REMOVED = 'Code entfernt.';

    public function __construct(private readonly DocumentConditions $conditions) {}

    public function store(DocumentConditionRequest $request, ApprovalDocument $document): RedirectResponse
    {
        $this->conditions->create($document, $request->payload(), $request->admin());

        return back()->with('toast', self::ADDED);
    }

    /** A pasted legend, split in the browser and classified by a person: stored as one batch or not at all. */
    public function batch(DocumentConditionBatchRequest $request, ApprovalDocument $document): RedirectResponse
    {
        $entries = $request->entries();

        DB::transaction(function () use ($entries, $document, $request): void {
            foreach ($entries as $entry) {
                $this->conditions->create($document, $entry, $request->admin());
            }
        });

        return back()->with('toast', count($entries) === 1 ? '1 Code gespeichert.' : count($entries).' Codes gespeichert.');
    }

    public function update(DocumentConditionRequest $request, ApprovalDocument $document, DocumentCondition $condition): RedirectResponse
    {
        $this->conditions->update($condition, $request->payload(), $request->admin());

        return back()->with('toast', self::CHANGED);
    }

    public function destroy(DocumentConditionRequest $request, ApprovalDocument $document, DocumentCondition $condition): RedirectResponse
    {
        $this->conditions->delete($condition, $request->admin());

        return back()->with('toast', self::REMOVED);
    }

    /**
     * A load-index limit that differs from twice its index's capacity, confirmed as printed with a reason —
     * shown on the record, audited, and lifting that one release blocker (the second review of C9, §3).
     */
    public function confirmLimit(LoadLimitConfirmRequest $request, ApprovalDocument $document, DocumentCondition $condition): RedirectResponse
    {
        $reason = trim((string) $request->validated('reason'));

        // Once, however often it is sent: a double click or a second tab finds it confirmed under the row
        // lock, and writes neither the reason nor a second Protokoll entry (the Block C QA, C-04).
        $confirmed = DB::transaction(static function () use ($condition, $document, $request, $reason): bool {
            $locked = DocumentCondition::query()->lockForUpdate()->findOrFail($condition->id);

            if ($locked->limit_confirmed_at !== null) {
                return false;
            }

            $locked->forceFill([
                'limit_confirmed_reason' => $reason,
                'limit_confirmed_by' => $request->admin()->id,
                'limit_confirmed_at' => now(),
            ])->save();

            AuditTrail::record($request->admin(), 'approval.limit_confirmed', [
                'document' => FitmentRows::label($document),
                'code' => $locked->code,
                'kg' => $locked->max_axle_load_kg,
                'reason' => $reason,
            ], $document);

            return true;
        });

        return back()->with('toast', $confirmed ? 'Zahl bestätigt.' : 'Die Zahl war schon bestätigt.');
    }
}
