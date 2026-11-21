<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DocumentFileRequest;
use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\DocumentPdfs;
use App\Services\Storage\PdfUpload;
use Illuminate\Http\RedirectResponse;

/**
 * The PDFs of a Gutachten (D-494): a further one added, an entry described, hidden or shown, the order set — on a draft and on
 * the released revision alike, for no verdict rests on them. Every write is one Protokoll entry (DocumentPdfs); nothing is deleted.
 */
class GutachtenPdfsController extends Controller
{
    public function __construct(private readonly DocumentPdfs $pdfs) {}

    public function store(DocumentFileRequest $request, ApprovalDocument $document, PdfUpload $uploads): RedirectResponse
    {
        $pdf = GutachtenController::confirmPdf($uploads, (string) $request->validated('upload_key'));
        $this->pdfs->add($document, $request->admin(), $request->label(), $request->datedOn(), $pdf['path'], $pdf['sha256'], $pdf['bytes']);

        return back()->with('toast', 'PDF hinzugefügt: '.$request->label().'. Im Shop steht es ab jetzt zur Auswahl.');
    }

    public function update(DocumentFileRequest $request, ApprovalDocument $document, ?int $file = null): RedirectResponse
    {
        $this->pdfs->describe($document, $request->admin(), $file, $request->label(), $request->datedOn());

        return back()->with('toast', 'Gespeichert: '.$request->label().'.');
    }

    public function visible(DocumentFileRequest $request, ApprovalDocument $document, int $file): RedirectResponse
    {
        $visible = $request->boolean('visible');
        $this->pdfs->show($document, $request->admin(), $file, $visible);

        return back()->with('toast', $visible ? 'Das PDF ist im Shop wieder zu sehen.' : 'Das PDF ist im Shop ausgeblendet. Es bleibt gespeichert, denn Bestellungen können darauf verweisen.');
    }

    public function order(DocumentFileRequest $request, ApprovalDocument $document): RedirectResponse
    {
        /** @var list<int|null> $order */
        $order = array_map(static fn (mixed $id): ?int => $id === null ? null : (int) $id, (array) $request->validated('order'));
        $this->pdfs->reorder($document, $request->admin(), $order);

        return back()->with('toast', 'Reihenfolge gespeichert.');
    }
}
