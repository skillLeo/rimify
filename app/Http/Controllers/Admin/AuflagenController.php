<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Approvals\FitmentRows;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gutachten › Auflagen: every document's own Auflagenverzeichnis, one after the other, to read — and the
 * codes its rows carry that it does not define yet (the corrections memo §1).
 *
 * There is no global catalogue any more: a code means what its own document says, so `A01` of one
 * Gutachten and `A01` of another are two entries here. Nothing is written on this page; a document's list
 * is written on that Gutachten (GutachtenAuflagenController) while it is a draft. The route asks for the
 * right to view Gutachten (EnsureAdminMay).
 */
class AuflagenController extends Controller
{
    public function index(): Response
    {
        $documents = ApprovalDocument::query()
            ->with('conditions')
            ->orderByRaw("status = 'draft' DESC")
            ->orderByDesc('issued_on')
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(static function (ApprovalDocument $document): array {
                $uses = DocumentConditions::usesByCode($document);

                return [
                    'id' => (int) $document->id,
                    'label' => FitmentRows::label($document),
                    'status' => $document->status->value,
                    'href' => '/admin/gutachten/'.$document->id,
                    'conditions' => $document->conditions
                        ->map(static fn (DocumentCondition $c): array => GutachtenController::conditionView($c, $uses[$c->code] ?? 0))
                        ->values()->all(),
                    'unresolved' => DocumentConditions::unresolvedIn($document),
                ];
            })
            // A document with nothing to show here is left out: no list, nothing open.
            ->filter(static fn (array $d): bool => $d['conditions'] !== [] || $d['unresolved'] !== [])
            ->values()
            ->all();

        return Inertia::render('Admin/Auflagen/Index', [
            'documents' => $documents,
        ]);
    }
}
