<?php

declare(strict_types=1);

namespace App\Services\Content;

/**
 * What a Blog article may be made of (the client's #10; the operator's brief „CLOSE THE PUBLIC SIDE“ §3; D-230): a
 * section of one heading and its paragraphs, a figure, a table — structured blocks, never HTML. An admin-pasted
 * `<script>` would be stored XSS on the public shop (finding 102 was this family one layer out), so there is no raw
 * HTML block, and every value here is text the page prints as text.
 *
 *   - `prose`  — heading (optional) and text; a blank line starts a new paragraph.
 *   - `figure` — an image of our own storage, with its alt text REQUIRED and a caption optional. Without alt text the
 *                figure is left out: a picture that says nothing to a screen reader is not shown half.
 *   - `table`  — a caption (required), the header cells (at least one), and rows of as many cells as there are header
 *                cells. The page writes `<caption>`, `<th scope="col">` and `<td>`.
 *   - `quote`  — the quoted words (required) and who said or wrote them (optional); the page writes `<blockquote>`.
 *   - `html`   — HTML within limits (his admin item 11 answered, D-352): only what ArticleHtml keeps, cleaned when the
 *                draft was saved and again here, on the way out. The one block the page writes as markup; every other
 *                value stays text.
 *
 * The editor builds these same shapes (the client's admin item 11, D-306: PageSchema's article blocks).
 */
final class ArticleBlocks
{
    /**
     * The block as the page renders it, or null where it is not a shape the page knows or misses what it requires.
     *
     * @param  array<string, mixed>  $data
     * @return array{type: string, data: array<string, mixed>}|null
     */
    public static function check(string $type, array $data): ?array
    {
        return match ($type) {
            'prose' => self::prose($data),
            'figure' => self::figure($data),
            'table' => self::table($data),
            'quote' => self::quote($data),
            'html' => self::html($data),
            default => null,
        };
    }

    /**
     * Cleaned again on the way out, whatever the row holds — a draft saved before D-352 or a row written past the editor.
     *
     * @param  array<string, mixed>  $data
     * @return array{type: string, data: array<string, mixed>}|null
     */
    private static function html(array $data): ?array
    {
        $html = ArticleHtml::clean(is_string($data['html'] ?? null) ? $data['html'] : '');

        return $html === '' ? null : ['type' => 'html', 'data' => ['html' => $html]];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{type: string, data: array<string, mixed>}|null
     */
    private static function quote(array $data): ?array
    {
        $text = self::text($data['text'] ?? null, multiline: true);

        return $text === '' ? null : ['type' => 'quote', 'data' => ['text' => $text, 'source' => self::text($data['source'] ?? null)]];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{type: string, data: array<string, mixed>}|null
     */
    private static function prose(array $data): ?array
    {
        $heading = self::text($data['heading'] ?? null);
        $text = self::text($data['text'] ?? null, multiline: true);

        return $heading === '' && $text === '' ? null : ['type' => 'prose', 'data' => ['heading' => $heading, 'text' => $text]];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{type: string, data: array<string, mixed>}|null
     */
    private static function figure(array $data): ?array
    {
        $src = self::text($data['src'] ?? null);
        $alt = self::text($data['alt'] ?? null);

        // Images only from our own storage — the site's disk, the bucket or its CDN: no request to another site (D-183).
        if ($src === '' || $alt === '' || ! PageSchema::ownImage($src)) {
            return null;
        }

        return ['type' => 'figure', 'data' => [
            'src' => $src,
            'alt' => $alt,
            'caption' => self::text($data['caption'] ?? null),
            'width' => is_numeric($data['width'] ?? null) ? (int) $data['width'] : null,
            'height' => is_numeric($data['height'] ?? null) ? (int) $data['height'] : null,
        ]];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{type: string, data: array<string, mixed>}|null
     */
    private static function table(array $data): ?array
    {
        $caption = self::text($data['caption'] ?? null);
        $head = array_values(array_map(static fn (mixed $cell): string => self::text($cell), is_array($data['head'] ?? null) ? $data['head'] : []));
        $rows = [];

        foreach (is_array($data['rows'] ?? null) ? $data['rows'] : [] as $row) {
            if (! is_array($row)) {
                return null;
            }

            $cells = array_values(array_map(static fn (mixed $cell): string => self::text($cell), $row));

            if (count($cells) !== count($head)) {
                return null;
            }

            // A row added and left empty is not printed: an empty line in a table reads as a fault (SEI-37).
            if (implode('', $cells) === '') {
                continue;
            }

            $rows[] = $cells;
        }

        if ($caption === '' || $head === [] || in_array('', $head, true) || $rows === []) {
            return null;
        }

        return ['type' => 'table', 'data' => ['caption' => $caption, 'head' => $head, 'rows' => $rows]];
    }

    /**
     * Text, and only text. Nothing is stripped — „ET < 30“ is a measurement, not a tag — because nothing downstream
     * interprets markup: the page prints every value with Vue's text interpolation, never `v-html` (ArticleTest).
     */
    private static function text(mixed $value, bool $multiline = false): string
    {
        if (! is_string($value) && ! is_int($value) && ! is_float($value)) {
            return '';
        }

        $text = trim((string) $value);

        return $multiline ? $text : (string) preg_replace('/\s+/u', ' ', $text);
    }
}
