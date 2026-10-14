<?php

declare(strict_types=1);

namespace Tests\Support;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * R-17 — say only what is on record. Finds every sentence in the product's own sources that names an external thing
 * (a Gutachten, an ABE, a Nachtrag, a manufacturer, a document, a test report) and denies or restricts something in
 * the same breath: „Das Gutachten druckt keine Tabelle …“, „Der Hersteller gibt nur … frei“.
 *
 * It is a tripwire, not a parser. Both anchors are German words, so code — which is English here — does not trip it;
 * what it cannot see is a claim worded without either anchor, and that is what the review of the list is for.
 */
final class OnRecord
{
    /** Everything that can hold a sentence someone reads: the engine, the shop, the admin, mails, PDFs, messages. */
    public const SOURCES = ['app', 'resources/js', 'resources/views', 'lang'];

    /** Tests, fixtures and the design specimen quote sentences on purpose. */
    private const SKIPPED = '#\.test\.ts$|\.spec\.ts$|\.fixture\.ts$|/__fixtures__/|/Design/|/Console/#';

    private const EXTERNAL = '(?:Teilegutachten|Gutachten|ABE|Nachtrag|Nachträge|Hersteller|Dokument|Prüfbericht)\w*';

    private const DENIAL = '(?:kein\w*|nicht|nichts|nie|niemals|ohne|nur|ausschließlich|lediglich|weder)';

    /**
     * The other direction (the operator's brief of 14.10.2026 §9): a claim that we quote a document whole or word for
     * word — „Wörtlich aus dem Gutachten“, „So steht es im Gutachten“, the two of finding 118 the first pattern could not
     * see. What we hold may be a part of it.
     */
    private const ASSERTION = '(?:wörtlich\w*|vollständig\w*|genau\s+so|so\s+steht|steht\s+so|ohne\s+Auslassungen|alle|allen|aller|alles|sämtlich\w*|immer)';

    /** Speaking about our own record is the point of the rule, not a breach of it. */
    private const OURS = '/hinterlegt|erfasst|bei uns|haben wir|fehl(?:t|en) uns|vorliegt|vorliegen|lieg(?:t|en)\b[^.!?]{0,60}\bvor\b/ui';

    /** Does this sentence deny or restrict something of an external thing? */
    public static function denies(string $sentence): bool
    {
        $external = '(?<![\p{L}\d_:$>-])'.self::EXTERNAL.'(?![\p{L}\d_(:])';
        $denial = '(?<![\p{L}\d_$>-])'.self::DENIAL.'(?![\p{L}\d_(])';

        // The external thing is matched as written (a German noun, capitalised); the denial may open the sentence.
        return preg_match("/{$external}[^.!?]{0,90}?(?i:{$denial})|(?i:{$denial})[^.!?]{0,70}?{$external}/u", $sentence) === 1;
    }

    /** Does this sentence claim that a document says something whole, word for word, or always? */
    public static function asserts(string $sentence): bool
    {
        $external = '(?<![\p{L}\d_:$>-])'.self::EXTERNAL.'(?![\p{L}\d_(:])';
        $assertion = '(?<![\p{L}\d_$>-])'.self::ASSERTION.'(?![\p{L}\d_(])';

        return preg_match("/{$external}[^.!?]{0,90}?(?i:{$assertion})|(?i:{$assertion})[^.!?]{0,70}?{$external}/u", $sentence) === 1;
    }

    /** Is the sentence about what RIMIFY holds, rather than about the document? */
    public static function speaksOfOurRecord(string $sentence): bool
    {
        return preg_match(self::OURS, $sentence) === 1;
    }

    /** @return list<array{file: string, line: int, text: string, admin: bool}> */
    public static function claims(?string $root = null): array
    {
        $root ??= dirname(__DIR__, 2);
        $found = [];

        foreach (self::SOURCES as $source) {
            $dir = $root.'/'.$source;

            if (! is_dir($dir)) {
                continue;
            }

            foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $file) {
                $path = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));

                if (! in_array($file->getExtension(), ['php', 'vue', 'ts', 'json'], true) || preg_match(self::SKIPPED, '/'.$path) === 1) {
                    continue;
                }

                foreach (self::logicalLines((string) file_get_contents($file->getPathname()), $file->getExtension()) as $number => $line) {
                    foreach (preg_split('/(?<=[.!?])\s+/u', $line) ?: [] as $sentence) {
                        if ((self::denies($sentence) || self::asserts($sentence)) && ! self::speaksOfOurRecord($sentence)) {
                            $found[] = [
                                'file' => $path,
                                'line' => $number,
                                'text' => trim((string) preg_replace('/\s+/u', ' ', $sentence)),
                                'admin' => preg_match('#/Admin/|/admin/#', '/'.$path) === 1,
                            ];
                        }
                    }
                }
            }
        }

        return $found;
    }

    /**
     * The file as the lines a sentence lives on, keyed by the number of the first physical line. Comments are dropped —
     * a customer never reads them — and inside a Vue template a sentence that wraps is put back together.
     *
     * @return array<int, string>
     */
    private static function logicalLines(string $content, string $extension): array
    {
        // Block comments keep their line breaks, so the numbers below stay those of the file.
        $content = (string) preg_replace_callback(
            '#/\*.*?\*/|<!--.*?-->|\{\{--.*?--\}\}#su',
            fn (array $m): string => str_repeat("\n", substr_count($m[0], "\n")),
            $content,
        );

        $lines = [];
        $inTemplate = false;
        $open = null;

        foreach (explode("\n", $content) as $index => $raw) {
            $line = trim($raw);

            if ($extension === 'vue') {
                if (str_starts_with($line, '<template')) {
                    $inTemplate = true;
                } elseif (str_starts_with($line, '<script') || str_starts_with($line, '<style')) {
                    $inTemplate = false;
                }
            }

            if ($line === '' || preg_match('#^(//|\#(?!\[)|\*)#', $line) === 1) {
                $open = null;

                continue;
            }

            // Running text in a template: this line carries on where the last one stopped mid-sentence.
            $continues = $inTemplate && $open !== null
                && preg_match('/[\p{L}\d,;:–“)]$/u', $lines[$open]) === 1
                && preg_match('/^[\p{L}\d„(]/u', $line) === 1;

            if ($continues) {
                $lines[$open] .= ' '.$line;

                continue;
            }

            $lines[$index + 1] = $line;
            $open = $index + 1;
        }

        return $lines;
    }
}
