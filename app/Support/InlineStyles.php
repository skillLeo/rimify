<?php

declare(strict_types=1);

namespace App\Support;

/**
 * A storefront page's stylesheets written into the document itself, so the first paint waits for the HTML and nothing
 * else (the operator's brief of 05.10.2026, §5).
 *
 * Linked, the fourteen stylesheets of the phone's homepage were one more round trip after the HTML before anything
 * could paint: on the preview at 390 px, Slow 4G and 4× CPU, the first paint — the LCP, the headline — came at 1 958 ms
 * linked and at 1 404 ms inlined (median of four interleaved loads; the ~20 KB more document cost about 0,1 s of that
 * back). Only the first document carries them: every later page arrives as JSON over Inertia.
 *
 * Each inlined sheet keeps its link, disabled — a disabled stylesheet is neither fetched nor applied, and the bundle's
 * preload, which adds a page's stylesheets when it imports the page, finds it and adds nothing twice. Their preload goes.
 * The admin keeps its links: a work tool loads once per session and keeps its stylesheets in the cache. Over
 * MAX_BYTES a page keeps its links too; nothing is inlined while the dev server runs.
 */
final class InlineStyles
{
    /** The homepage's sheets are 115 KB; a page past this has outgrown the idea. */
    private const MAX_BYTES = 220_000;

    /** The entries app.blade.php hands to `@vite`, whose stylesheets come first. */
    private const ENTRIES = ['resources/css/app.css', 'resources/js/app.ts'];

    /** @var array<string, true> URLs of the stylesheets inlined into the document being rendered */
    private static array $inlined = [];

    /** @return list<array{href: string, css: string}> in cascade order; empty when the page keeps its links */
    public static function for(string $component): array
    {
        self::$inlined = [];

        if ($component === '' || str_starts_with($component, 'Admin/') || is_file(public_path('hot'))) {
            return [];
        }

        $manifest = PageStyles::manifest();

        if ($manifest === null || ! isset($manifest["resources/js/Pages/{$component}.vue"])) {
            return [];
        }

        $sheets = [];
        $bytes = 0;

        foreach (array_unique([...self::entryFiles($manifest), ...PageStyles::files($component)]) as $file) {
            $path = public_path('build/'.$file);
            $css = is_file($path) ? (string) file_get_contents($path) : '';

            // A sheet that is missing, or that could close the element it is written into, keeps every link.
            if ($css === '' || stripos($css, '</style') !== false) {
                return [];
            }

            $bytes += strlen($css);
            $sheets[] = ['href' => asset('build/'.$file), 'css' => $css];
        }

        if ($sheets === [] || $bytes > self::MAX_BYTES) {
            return [];
        }

        foreach ($sheets as $sheet) {
            self::$inlined[$sheet['href']] = true;
        }

        return $sheets;
    }

    /** Whether the document being rendered carries this stylesheet itself. */
    public static function has(string $url): bool
    {
        return isset(self::$inlined[$url]);
    }

    /**
     * The stylesheets `@vite` writes for the entries, in its order: an entry's imported chunks' CSS, then its own.
     *
     * @param  array<string, array{file?: string, css?: list<string>, imports?: list<string>, isEntry?: bool}>  $manifest
     * @return list<string>
     */
    private static function entryFiles(array $manifest): array
    {
        $files = [];

        foreach (self::ENTRIES as $entry) {
            $chunk = $manifest[$entry] ?? [];

            foreach ($chunk['imports'] ?? [] as $import) {
                foreach ($manifest[$import]['css'] ?? [] as $css) {
                    $files[] = $css;
                }
            }

            if (str_ends_with($chunk['file'] ?? '', '.css')) {
                $files[] = $chunk['file'];
            }

            foreach ($chunk['css'] ?? [] as $css) {
                $files[] = $css;
            }
        }

        return $files;
    }
}
