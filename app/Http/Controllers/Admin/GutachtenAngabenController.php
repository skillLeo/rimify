<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DocumentExtraRequest;
use App\Models\ApprovalDocument;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * What a draft Gutachten states beside its codes (the corrections memo §4): its Befestigungsmittel, its
 * Pflichthinweise, and the millimetres of its „Nacharbeit mit Maßen“ codes. Every write is authorised by
 * ApprovalDocumentPolicy through DocumentExtraRequest (R-11) and leaves one Protokoll entry.
 */
class GutachtenAngabenController extends Controller
{
    public function store(DocumentExtraRequest $request, ApprovalDocument $document): RedirectResponse
    {
        $payload = $request->payload();
        $extra = $request->extra();

        DB::transaction(static function () use ($payload, $extra, $document, $request): void {
            $saved = match ($extra) {
                'fastener' => DocumentFastener::query()->create(['approval_document_id' => $document->id] + $payload),
                'notice' => DocumentNotice::query()->create(['approval_document_id' => $document->id, 'sort_order' => (int) DocumentNotice::query()->where('approval_document_id', $document->id)->max('sort_order') + 10] + $payload),
                default => DocumentConditionRework::query()->create($payload),
            };

            AuditTrail::record($request->admin(), "approval.{$extra}_added", [
                'document' => FitmentRows::label($document),
                'what' => self::what($saved),
            ], $document);
        });

        return back()->with('toast', match ($extra) {
            'fastener' => 'Befestigungsmittel gespeichert.',
            'notice' => 'Hinweis gespeichert.',
            default => 'Maß gespeichert.',
        });
    }

    public function destroyFastener(DocumentExtraRequest $request, ApprovalDocument $document, DocumentFastener $fastener): RedirectResponse
    {
        return $this->remove($request, $document, $fastener);
    }

    public function destroyNotice(DocumentExtraRequest $request, ApprovalDocument $document, DocumentNotice $notice): RedirectResponse
    {
        return $this->remove($request, $document, $notice);
    }

    public function destroyRework(DocumentExtraRequest $request, ApprovalDocument $document, DocumentConditionRework $rework): RedirectResponse
    {
        return $this->remove($request, $document, $rework);
    }

    private function remove(DocumentExtraRequest $request, ApprovalDocument $document, Model $child): RedirectResponse
    {
        $extra = $request->extra();

        DB::transaction(static function () use ($child, $extra, $document, $request): void {
            $what = self::what($child);
            $child->delete();

            AuditTrail::record($request->admin(), "approval.{$extra}_removed", [
                'document' => FitmentRows::label($document),
                'what' => $what,
            ], $document);
        });

        return back()->with('toast', 'Entfernt.');
    }

    /** What was added or removed, as the Protokoll names it. */
    private static function what(object $saved): string
    {
        return match (true) {
            $saved instanceof DocumentFastener => trim($saved->number.' · '.$saved->thread.' · '.$saved->seat),
            $saved instanceof DocumentNotice => $saved->text_de,
            $saved instanceof DocumentConditionRework => trim($saved->condition->code.' · '.$saved->vehicle_type.' · '.$saved->measureDe()),
            default => '',
        };
    }
}
