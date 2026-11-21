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

    /**
     * Every PDF the customer may open (D-494), as links: the paper's own at the row's page (of()), then its further ones from
     * their first page, each with its label and date. Empty where there is no more than the paper's own — the one link above
     * stands for it. A file that is not there is left out, never linked to nothing (D-229).
     *
     * @return list<array{label: string, date: string|null, url: string, page: int|null, main: bool}>
     */
    public static function files(?DocumentRecord $document, bool $absolute = false): array
    {
        if ($document === null || count($document->files) < 2) {
            return [];
        }

        $links = [];

        foreach ($document->files as $file) {
            if ($file['main']) {
                $main = self::of($document, $absolute);

                if ($main !== null) {
                    $links[] = ['label' => $file['label'], 'date' => self::date($file['datedOn']), 'url' => $main['url'], 'page' => $main['page'], 'main' => true];
                }

                continue;
            }

            $url = app(DocumentFiles::class)->locate($file['key'])['url'];

            if ($url === null) {
                continue;
            }

            $links[] = ['label' => $file['label'], 'date' => self::date($file['datedOn']), 'url' => $absolute && str_starts_with($url, '/') ? url($url) : $url, 'page' => null, 'main' => false];
        }

        return count($links) > 1 ? $links : [];
    }

    private static function date(?string $ymd): ?string
    {
        return $ymd === null ? null : GermanFormat::date(new \DateTimeImmutable($ymd));
    }
}
