<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Where the demo wheels' cut-outs live and how a finish finds its own.
 *
 * One place for the three parties that must agree — `wheels:process-images` writes there, the
 * CatalogueSeeder reads from there, and the tests point both at a directory of their own — so a
 * path never has to be typed twice.
 */
final class DemoWheels
{
    /** The directory the cut-outs are written to, absolute. */
    public static function dir(): string
    {
        return self::absolute((string) config('rimify.demo.wheels_dir', 'storage/app/public/demo/wheels'));
    }

    /** The directory the source photographs are read from, absolute. */
    public static function sourcesDir(): string
    {
        return self::absolute((string) config('rimify.demo.sources_dir', 'storage/app/public/placeholder'));
    }

    /** The URL every manifest's `base` starts with. */
    public static function publicBase(): string
    {
        return rtrim((string) config('rimify.demo.public_base', '/storage/demo/wheels'), '/');
    }

    /** The photograph map: file → slug, rim circle, hub circle, credit, and the finish it stands for. */
    public static function photosFile(): string
    {
        return database_path('seeders/content/wheel-photos.php');
    }

    /**
     * @return array<string, array{
     *     slug: string,
     *     model: string,
     *     finish: string,
     *     circle: array{0: int, 1: int, 2: int},
     *     hub: array{0: int, 1: int, 2: int}|null,
     *     colour?: string,
     *     credit: array{source: string, photographer: string, licence: string, url: string}
     * }>
     */
    public static function photos(): array
    {
        $file = self::photosFile();

        if (! is_file($file)) {
            return [];
        }

        $map = require $file;

        return is_array($map) ? $map : [];
    }

    /**
     * The manifest written for a slug, or null when there is none or it is not a manifest the
     * Picture component could render. Missing or malformed data fails closed (CLAUDE.md §2): a
     * finish without a picture draws the outline, it never borrows one.
     *
     * @return array<string, mixed>|null
     */
    public static function manifest(string $slug): ?array
    {
        $file = self::dir().DIRECTORY_SEPARATOR.$slug.DIRECTORY_SEPARATOR.'manifest.json';

        if (! is_file($file)) {
            return null;
        }

        $raw = file_get_contents($file);
        $decoded = is_string($raw) ? json_decode($raw, true) : null;

        return self::wellFormed($decoded) ? $decoded : null;
    }

    /**
     * Whether a value has the shape `Picture` needs: name, base, width, height, a non-empty list
     * of widths, and a placeholder.
     *
     * @phpstan-assert-if-true array<string, mixed> $manifest
     */
    public static function wellFormed(mixed $manifest): bool
    {
        if (! is_array($manifest)) {
            return false;
        }

        foreach (['name', 'base', 'placeholder'] as $key) {
            if (! isset($manifest[$key]) || ! is_string($manifest[$key]) || $manifest[$key] === '') {
                return false;
            }
        }

        foreach (['width', 'height'] as $key) {
            if (! isset($manifest[$key]) || ! is_int($manifest[$key]) || $manifest[$key] <= 0) {
                return false;
            }
        }

        $widths = $manifest['widths'] ?? null;

        if (! is_array($widths) || $widths === []) {
            return false;
        }

        foreach ($widths as $width) {
            if (! is_int($width) || $width <= 0) {
                return false;
            }
        }

        return true;
    }

    private static function absolute(string $path): string
    {
        if ($path === '') {
            return base_path('storage/app/public/demo/wheels');
        }

        if (preg_match('~^([a-zA-Z]:[\\\\/]|/|\\\\\\\\)~', $path) === 1) {
            return $path;
        }

        return base_path($path);
    }
}
