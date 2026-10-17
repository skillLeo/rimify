<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The script chunks an Inertia page component needs — its own and the chunks it imports — read from the Vite manifest, so
 * the root view can have them fetched beside the entry instead of after it (D-279).
 *
 * The bundle asks for a page's chunk only once the entry has run and resolved the page: one more round trip before the
 * page answers, on every first load. A `modulepreload` link fetches and compiles a module without running it — the page's
 * dynamic import then finds it in the module map, under the same address. Not a module script: that ran the page's code
 * on its own and measured the page's interactions twice as slow at 4× CPU (PageStyles).
 *
 * The walk follows the chunk's static imports and leaves out the entries and everything they import, which `@vite` has
 * already preloaded. Nothing is returned while the dev server runs.
 */
final class PageModules
{
    /** @return list<string> absolute URLs, the page's own chunk first */
    public static function for(string $component): array
    {
        if (! self::wanted($component)) {
            return [];
        }

        return array_map(static fn (string $file): string => asset('build/'.$file), self::files($component));
    }

    /**
     * The admin's pages, on the desk and on the phone: their first paint is text, and what the person waits for is the
     * page answering — at 100 ms and 20 Mbit/s the Übersicht hydrated 0,6 s sooner, on a throttled phone 4,2 s, and the first
     * paint never came later beyond the noise. Not the shop's yet: there the first paint's picture is the LCP, and on this
     * machine's HTTP/1.1 server, six connections deep, the chunks queued ahead of it — /felgen's LCP 0,2–0,6 s later, the
     * phone homepage's 0,9 s. Whether HTTP/2 lifts that is measured on the preview first (D-279).
     */
    public static function wanted(string $component): bool
    {
        return str_starts_with($component, 'Admin/');
    }

    /** @return list<string> paths under public/build, the page's own chunk first */
    public static function files(string $component): array
    {
        if ($component === '' || is_file(public_path('hot'))) {
            return [];
        }

        return self::filesFrom(PageStyles::manifest() ?? [], $component);
    }

    /**
     * @param  array<string, array{file?: string, css?: list<string>, imports?: list<string>, isEntry?: bool}>  $manifest
     * @return list<string>
     */
    public static function filesFrom(array $manifest, string $component): array
    {
        $key = "resources/js/Pages/{$component}.vue";

        if (! isset($manifest[$key])) {
            return [];
        }

        // What the entries import `@vite` has preloaded already: an entry and everything it imports is left out.
        $loaded = [];
        $closure = function (string $chunk) use (&$closure, &$loaded, $manifest): void {
            if (isset($loaded[$chunk]) || ! isset($manifest[$chunk])) {
                return;
            }

            $loaded[$chunk] = true;

            foreach ($manifest[$chunk]['imports'] ?? [] as $import) {
                $closure($import);
            }
        };

        foreach ($manifest as $chunk => $entry) {
            if (($entry['isEntry'] ?? false) === true) {
                $closure($chunk);
            }
        }

        $seen = [];
        $files = [];

        $walk = function (string $chunk) use (&$walk, &$seen, &$files, $loaded, $manifest): void {
            if (isset($seen[$chunk]) || isset($loaded[$chunk]) || ! isset($manifest[$chunk])) {
                return;
            }

            $seen[$chunk] = true;

            if (isset($manifest[$chunk]['file'])) {
                $files[] = $manifest[$chunk]['file'];
            }

            foreach ($manifest[$chunk]['imports'] ?? [] as $import) {
                $walk($import);
            }
        };

        $walk($key);

        return $files;
    }
}
