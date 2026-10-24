<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\Lists\ListPaging;
use Illuminate\Http\Request;
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
    /** A document's whole list is long: fewer to a page than a plain list. */
    public const PER_PAGE = 20;

    public function index(Request $request): Response
    {
        // Only documents with something to show — a code of their own, or a code their rows carry — chosen by the
        // database before the page is cut: the first 200 documents of 1.059 drafts without a code once left this page
        // saying „Hier ist noch nichts“ beside released documents full of codes (the admin audit's F-33).
        $rowCodes = static fn (bool $onSizes) => static fn ($exists) => $exists->selectRaw('1')->from('fitments as f')
            ->whereColumn('f.approval_document_id', 'approval_documents.id')
            ->when($onSizes,
                static fn ($q) => $q->join('fitment_tyre_sizes as ts', 'ts.fitment_id', '=', 'f.id')->join('fitment_tyre_size_conditions as tc', 'tc.fitment_tyre_size_id', '=', 'ts.id'),
                static fn ($q) => $q->join('fitment_conditions as fc', 'fc.fitment_id', '=', 'f.id'));

        $page = ApprovalDocument::query()
            ->with('conditions')
            ->where(static fn ($where) => $where->whereHas('conditions')
                ->orWhereExists($rowCodes(false))
                ->orWhereExists($rowCodes(true)))
            ->orderByRaw("status = 'draft' DESC")
            ->orderByDesc('issued_on')
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE, ['*'], 'seite', ListPaging::requested($request->query('seite')));

        $documents = collect($page->items())
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
            'found' => $page->total(),
            'pagination' => ListPaging::props($page, '/admin/auflagen'),
        ]);
    }
}
