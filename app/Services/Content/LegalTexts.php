<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\Page;

/**
 * A legal page's live words as plain text, for the order confirmation mail (§ 312f BGB: the contract's terms and the
 * Widerrufsbelehrung on a durable medium). Exactly what the page shows visitors now — headings and paragraphs, no
 * markup — so the mail can never say something the page does not.
 *
 * While the client's Kanzlei has not supplied a text (D-024) the page holds a marked placeholder; `placeholder()`
 * says so, and the preflight refuses the launch on it.
 */
final class LegalTexts
{
    /**
     * What a legal page — and the order mail in its place — says while the Kanzlei's text is outstanding: one full
     * sentence naming who prepares it (the operator's brief of 05.10.2026, §8), never the seeded marker.
     */
    public const PREPARING = 'Diesen Text erstellt gerade die Kanzlei des Shopbetreibers; er steht hier, sobald er vorliegt.';

    public function text(string $slug): ?string
    {
        $page = Page::query()->where('slug', $slug)->where('kind', Page::KIND_LEGAL)->first();

        if ($page === null) {
            return null;
        }

        $parts = [];

        foreach (PageContent::live($page)['blocks'] as $block) {
            $data = $block['data'];
            $heading = is_string($data['heading'] ?? null) ? trim($data['heading']) : '';
            $body = is_string($data['text'] ?? null) ? $data['text'] : (is_string($data['body'] ?? null) ? $data['body'] : '');

            $parts[] = trim(($heading !== '' && $heading !== $page->title ? $heading."\n\n" : '').trim($body));
        }

        $text = trim(implode("\n\n", array_filter($parts)));

        return $text === '' ? null : $text;
    }

    /** Whether the page still holds the seeded placeholder instead of the Kanzlei's text. */
    public function placeholder(string $slug): bool
    {
        $page = Page::query()->where('slug', $slug)->where('kind', Page::KIND_LEGAL)->first();

        if ($page === null) {
            return true;
        }

        foreach (PageContent::live($page)['blocks'] as $block) {
            if (($block['data']['placeholder'] ?? false) === true) {
                return true;
            }
        }

        return $this->text($slug) === null;
    }
}
