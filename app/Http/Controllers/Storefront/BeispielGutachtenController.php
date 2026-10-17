<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ExampleDocumentRequest;
use App\Models\ApprovalDocument;
use App\Services\Storage\DocumentFiles;
use Inertia\Inertia;
use Inertia\Response;

/**
 * An example document, opened from the shop (decision 6, the operator's brief of 15.10.2026, D-239). The acceptance set's
 * files carry a mark of their own since D-268 (ExamplePdf: „BEISPIEL“ on every page and a band along the top); another
 * demo document's file may carry none. So the shop never hands out a file's address bare: it opens through this page,
 * which says first what the document is here and then offers the file.
 */
final class BeispielGutachtenController extends Controller
{
    public function show(ExampleDocumentRequest $request, ApprovalDocument $document, DocumentFiles $files): Response
    {
        $page = $request->page();
        $url = $document->pdf_key === null ? null : $files->locate($document->pdf_key)['url'];

        return Inertia::render('Gutachten/Beispiel', [
            'document' => [
                'label' => trim($document->kind->labelDe().' '.($document->number() ?? '')),
                'issuer' => $document->issuer,
            ],
            'pdf' => $url === null ? null : ['url' => $url.($page === null ? '' : '#page='.$page), 'page' => $page],
        ]);
    }
}
