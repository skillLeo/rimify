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
 *
 * The richer editing (the client's admin item 11) comes in the admin round, on these same shapes.
 */
final class ArticleBlocks
{
    /** Images only from our own storage: no request to another site from an article (D-183). */
    private const OWN_IMAGE = '#^(/storage/|https://[a-z0-9.-]+\.amazonaws\.com/)#i';

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
            default => null,
        };
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

        if ($src === '' || $alt === '' || preg_match(self::OWN_IMAGE, $src) !== 1) {
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
