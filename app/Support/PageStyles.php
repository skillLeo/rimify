<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The stylesheets an Inertia page component needs, read from the Vite manifest, so the root view
 * can put them in the head with the entry's.
 *
 * Without them the server-rendered page paints with the entry's CSS only and every section moves
 * when the bundle has resolved the page and injected the rest (CLS 0,26 on the phone homepage).
 * Only the stylesheets: handing the page chunk to `@vite` as well put it in the head as its own
 * module script, and the page's interactions measured twice as slow at 4× CPU.
 *
 * The walk follows the chunk's static imports depth-first — a dependency's CSS before the
 * importer's, the order Vite's own preload uses — and stops at entries, whose CSS `@vite` has
 * already written. Nothing is returned while the dev server runs: it injects CSS itself.
 */
final class PageStyles
{
    /** @var array<string, array{file?: string, css?: list<string>, imports?: list<string>, isEntry?: bool}>|null */
    private static ?array $manifest = null;

    private static int $manifestTime = 0;

    /** @return list<string> absolute URLs, in cascade order */
    public static function for(string $component): array
    {
        if ($component === '' || is_file(public_path('hot'))) {
            return [];
        }

        $manifest = self::manifest();
        $key = "resources/js/Pages/{$component}.vue";

        if ($manifest === null || ! isset($manifest[$key])) {
            return [];
        }

        $seen = [];
        $css = [];

        $walk = function (string $chunk) use (&$walk, &$seen, &$css, $manifest): void {
            if (isset($seen[$chunk]) || ! isset($manifest[$chunk])) {
                return;
            }

            $seen[$chunk] = true;

            if (($manifest[$chunk]['isEntry'] ?? false) === true) {
                return;
            }

            foreach ($manifest[$chunk]['imports'] ?? [] as $import) {
                $walk($import);
            }

            foreach ($manifest[$chunk]['css'] ?? [] as $file) {
                $css[$file] = true;
            }
        };

        $walk($key);

        return array_map(static fn (string $file): string => asset('build/'.$file), array_keys($css));
    }

    /** @return array<string, array{file?: string, css?: list<string>, imports?: list<string>, isEntry?: bool}>|null */
    private static function manifest(): ?array
    {
        $path = public_path('build/manifest.json');

        if (! is_file($path)) {
            return null;
        }

        $time = (int) filemtime($path);

        if (self::$manifest === null || self::$manifestTime !== $time) {
            $decoded = json_decode((string) file_get_contents($path), true);
            /** @var array<string, array{file?: string, css?: list<string>, imports?: list<string>, isEntry?: bool}>|null $typed */
            $typed = is_array($decoded) ? $decoded : null;
            self::$manifest = $typed;
            self::$manifestTime = $time;
        }

        return self::$manifest;
    }
}
