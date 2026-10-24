<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\Page;
use App\Models\Setting;

/**
 * A legal page's live words as plain text, for the order confirmation mail (§ 312f BGB: the contract's terms and the
 * Widerrufsbelehrung on a durable medium). Exactly what the page shows visitors now — headings and paragraphs, no
 * markup — so the mail can never say something the page does not.
 *
 * Until the client's Kanzlei supplies a text (D-024), the page is a placeholder (D-319): its flag is on, visitors and
 * the mail get NOTICE and nothing that reads like a clause, and while any text is a placeholder the shop stays out of
 * search and refuses live payments (LegalReadiness).
 */
final class LegalTexts
{
    /**
     * What a legal page — and the order mail in its place — says while its text is a placeholder: one notice that can
     * never be read as the text itself (the operator's brief of 23.10.2026).
     */
    public const NOTICE = 'PLATZHALTER: Dieser Text wird vor der Veröffentlichung durch den Rechtstext der Kanzlei ersetzt.';

    /** The Muster-Widerrufsformular: no page row of its own — its words are the statute's (WithdrawalForm) — but a flag. */
    public const FORM = 'widerrufsformular';

    /** Where the form's flag is kept; absent means on — a new shop starts with the placeholder. */
    public const FORM_SETTING = 'legal.widerrufsformular_placeholder';

    /** Every legal text that can be a placeholder, in the order the footer lists them, with the name it goes by. */
    public const TEXTS = [
        'impressum' => 'Impressum',
        'datenschutz' => 'Datenschutzerklärung',
        'agb' => 'AGB',
        'widerrufsbelehrung' => 'Widerrufsbelehrung',
        self::FORM => 'Muster-Widerrufsformular',
        'versand' => 'Versand',
    ];

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

    /**
     * Whether the text is still a placeholder: its flag says so, and a page that is not there is one (fails closed).
     * The flag is the one answer, kept true to the words where it changes: it cannot be switched off over the seeded
     * marker (LegalPlaceholderRequest), and publishing the marker switches it back on (PagePublisher). So every page
     * view on the live shop asks one query, not one per section (SecurityHeaders).
     */
    public function placeholder(string $slug): bool
    {
        // A legal page outside the six — the Erklärung zur Barrierefreiheit, once there is one — answers by its own flag;
        // no legal page by that name is a placeholder too.
        if (! isset(self::TEXTS[$slug])) {
            $flag = Page::query()->where('slug', $slug)->where('kind', Page::KIND_LEGAL)->value('is_placeholder');

            return $flag === null || (bool) $flag;
        }

        return in_array(self::TEXTS[$slug], $this->placeholders(), true);
    }

    /** Whether a live section still holds the seeder's marker — what refuses switching a flag off (LegalPlaceholderRequest). */
    public function markerLeft(string $slug): bool
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

        return false;
    }

    /**
     * The texts that are still placeholders, by name.
     *
     * @return list<string>
     */
    public function placeholders(): array
    {
        $flags = Page::query()->where('kind', Page::KIND_LEGAL)->whereIn('slug', array_keys(self::TEXTS))->pluck('is_placeholder', 'slug');
        $out = [];

        foreach (self::TEXTS as $slug => $name) {
            $placeholder = $slug === self::FORM
                ? Setting::get(self::FORM_SETTING) !== false
                : ! $flags->has($slug) || (bool) $flags->get($slug);

            if ($placeholder) {
                $out[] = $name;
            }
        }

        return $out;
    }
}
