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

    /**
     * The studio shots the client supplied, with their masks. Kept in the repository: unlike the
     * free-licence photographs they have no public URL `wheels:fetch-photos` could fetch them from.
     */
    public static function clientPhotosDir(): string
    {
        return database_path('seeders/content/client-photos');
    }

    /** Whether a map entry is a client-supplied shot rather than a free-licence photograph. */
    public static function isClientPhoto(string $file): bool
    {
        return str_starts_with($file, 'client-');
    }

    /** The URL every manifest's `base` starts with. */
    public static function publicBase(): string
    {
        return rtrim((string) config('rimify.demo.public_base', '/storage/demo/wheels'), '/');
    }

    /**
     * The photograph map: file → slug, rim circle or mask, hub circle, credit, the finish it
     * stands for, and — for a further angle — the view's label.
     */
    public static function photosFile(): string
    {
        return database_path('seeders/content/wheel-photos.php');
    }

    /**
     * @return array<string, array{
     *     slug: string,
     *     model: string,
     *     finish: string,
     *     circle?: array{0: int, 1: int, 2: int},
     *     mask?: string,
     *     view?: string,
     *     hub: array{0: int, 1: int, 2: int}|null,
     *     colour?: string,
     *     anchors?: array<string, list<int>>,
     *     stamp?: string,
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

        return self::wellFormed($decoded) ? self::withoutMalformedExtras($decoded) : null;
    }

    /**
     * The optional parts of the manifest contract (docs/phase0/ACCURACY.md §4) — `anchors`, `bare`,
     * `stamp`, and the 4:3 frame's own `anchors` — kept only when they are well-formed and dropped
     * otherwise. A page without anchors draws no photo highlight; a page with wrong ones would point
     * a leader at the wrong part of the wheel.
     *
     * @param  array<string, mixed>  $manifest
     * @return array<string, mixed>
     */
    public static function withoutMalformedExtras(array $manifest): array
    {
        if (array_key_exists('anchors', $manifest) && ! self::anchorsWellFormed($manifest['anchors'])) {
            unset($manifest['anchors']);
        }

        if (array_key_exists('bare', $manifest)) {
            $bare = $manifest['bare'];

            if (self::wellFormed($bare)) {
                $manifest['bare'] = self::withoutMalformedExtras($bare);
            } else {
                unset($manifest['bare']);
            }
        }

        if (array_key_exists('stamp', $manifest) && (! is_string($manifest['stamp']) || preg_match('/^\d{5,6}$/', $manifest['stamp']) !== 1)) {
            unset($manifest['stamp']);
        }

        if (isset($manifest['wide']) && is_array($manifest['wide'])) {
            $wide = $manifest['wide'];

            if (array_key_exists('anchors', $wide) && ! self::anchorsWellFormed($wide['anchors'])) {
                unset($wide['anchors']);
            }

            $manifest['wide'] = $wide;
        }

        return $manifest;
    }

    /**
     * Whether a value is a `WheelAnchors`: a `centre` {x, y}, and optionally `wheel`, `pcd` and
     * `bore` {x, y, r}, `valve` {x, y} and `kba` {x, y, w, h} — every number a fraction of the
     * frame, a point inside it, and nothing else.
     */
    public static function anchorsWellFormed(mixed $anchors): bool
    {
        if (! is_array($anchors) || ! isset($anchors['centre'])) {
            return false;
        }

        $shapes = [
            'centre' => ['x', 'y'],
            'wheel' => ['x', 'y', 'r'],
            'pcd' => ['x', 'y', 'r'],
            'bore' => ['x', 'y', 'r'],
            'valve' => ['x', 'y'],
            'kba' => ['x', 'y', 'w', 'h'],
        ];

        foreach ($anchors as $name => $point) {
            if (! is_string($name) || ! isset($shapes[$name]) || ! is_array($point)) {
                return false;
            }

            $keys = array_keys($point);
            $expected = $shapes[$name];
            sort($keys);
            sort($expected);

            if ($keys !== $expected) {
                return false;
            }

            foreach ($point as $axis => $value) {
                if (! is_int($value) && ! is_float($value)) {
                    return false;
                }

                // A point lies inside the frame; a radius or a size is positive and at most the frame.
                $inside = in_array($axis, ['x', 'y'], true) ? $value >= 0 && $value <= 1 : $value > 0 && $value <= 1;

                if (! $inside) {
                    return false;
                }
            }
        }

        return true;
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
