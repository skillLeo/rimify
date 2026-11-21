<?php

declare(strict_types=1);

namespace App\Support;

use App\Domain\Fitment\Data\DocumentRecord;
use App\Enums\ApprovalKind;
use App\Services\Storage\DocumentFiles;

/**
 * Where a customer opens the Gutachten an answer rests on: the PDF at the row's page, or — for an example document — the page
 * that marks it (decision 6, D-239), so the shop never hands out an example's file bare. One place for the product page and the
 * order confirmation (D-491), so the two never point to different files. Null where the file is not there.
 */
final class GutachtenPdfLink
{
    /** @return array{url: string, page: int|null, label: string, example: bool}|null */
    public static function of(?DocumentRecord $document, bool $absolute = false): ?array
    {
        if ($document === null || $document->pdfKey === null) {
            return null;
        }

        $url = app(DocumentFiles::class)->locate($document->pdfKey)['url'];

        if ($url === null) {
            return null;
        }

        $label = trim((ApprovalKind::tryFrom($document->kind)?->labelDe() ?? $document->kind).' '.($document->number ?? ''));

        if ($document->isDemo) {
            return ['url' => route('gutachten.beispiel', ['document' => $document->id, ...($document->sourcePage === null ? [] : ['seite' => $document->sourcePage])]), 'page' => $document->sourcePage, 'label' => $label, 'example' => true];
        }

        // A mail is read away from the shop: its links name the host. The page's stay as the disk writes them.
        $url = $absolute && str_starts_with($url, '/') ? url($url) : $url;

        return ['url' => $url.($document->sourcePage === null ? '' : '#page='.$document->sourcePage), 'page' => $document->sourcePage, 'label' => $label, 'example' => false];
    }
}
