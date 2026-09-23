<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * A brand's logo as the brand wall draws it: a URL path, and the file's own aspect (width /
 * height). Both, or neither.
 *
 * `brands.logo_path` holds one of two things:
 *
 *  - `/images/brands/<file>` — a processed logo committed under `public/`, written by
 *    `scripts/brand-logo.mjs` and listed in its `manifest.json`: one colour, transparent
 *    background, cropped to the ink, meant to be used as a CSS mask and filled with an ink token;
 *  - anything else — a path on the `public` disk, i.e. an upload, served from `/storage/…`, which
 *    is what `logo_path` has always meant.
 *
 * Either way a logo is returned only when the file is really there, is an SVG, PNG or WebP that
 * can carry transparency, and its aspect could be read from the file itself. A mark that cannot be
 * sized, or that would paint a solid block through a mask, is not drawn at all: the brand's name
 * stays the mark (CLAUDE.md §2, home-brands.md §3.3). The sample range never has a logo.
 *
 * Reading is cached per file, keyed by the file's own timestamp and size, so a re-processed logo
 * is picked up without a cache flush.
 */
final class BrandLogos
{
    /** What a processed logo's `logo_path` starts with, and the URL it is served from. */
    public const BUNDLED_PREFIX = '/images/brands/';

    public const MANIFEST = 'manifest.json';

    /** The seeded sample range is never dressed up as a manufacturer (home-brands.md §4.2). */
    public const SAMPLE_RANGE = 'demo';

    public const MIN_ASPECT = 0.2;

    public const MAX_ASPECT = 20.0;

    /**
     * What the brand wall accepts inside `url("…")` (the same pattern as brandWall.ts LOGO_PATH):
     * a path on this origin, never a protocol-relative `//host/…`. Nothing else is ever shipped.
     */
    public const URL_PATTERN = '~^/(?!/)[A-Za-z0-9/_.-]+\.(svg|png|webp)(\?v=[A-Za-z0-9]+)?$~';

    private const FILE_PATTERN = '~^[a-z0-9][a-z0-9-]*\.(svg|png|webp)$~';

    private const SLUG_PATTERN = '~^[a-z0-9][a-z0-9-]*$~';

    private const HASH_PATTERN = '~^[A-Za-z0-9]{1,32}$~';

    /** Enough to reach the root element of any SVG these files are. */
    private const SVG_HEAD_BYTES = 4096;

    /** Enough to reach a PNG's IHDR and any tRNS chunk before the image data. */
    private const PNG_HEAD_BYTES = 65536;

    private const CACHE_TTL = 86400;

    /** @var array<string, array<string, array{file: string, format: string, aspect: float, hash: string|null}>> */
    private static array $manifests = [];

    /** Where the processed logos and their manifest live, absolute. */
    public static function dir(): string
    {
        $dir = (string) config('rimify.brand_logos.dir', 'public/images/brands');

        if ($dir === '') {
            return base_path('public/images/brands');
        }

        return preg_match('~^([a-zA-Z]:[\\\\/]|/|\\\\\\\\)~', $dir) === 1 ? $dir : base_path($dir);
    }

    /**
     * The processed logos, by brand slug. An entry that is not well-formed is left out rather than
     * guessed at.
     *
     * @return array<string, array{file: string, format: string, aspect: float, hash: string|null}>
     */
    public static function manifest(): array
    {
        $file = self::dir().DIRECTORY_SEPARATOR.self::MANIFEST;
        $stamp = self::stamp($file);

        if ($stamp === null) {
            return [];
        }

        $key = $file.'|'.$stamp;

        if (! array_key_exists($key, self::$manifests)) {
            self::$manifests[$key] = self::readManifest($file);
        }

        return self::$manifests[$key];
    }

    /**
     * Brands the processing script recorded as having no usable official logo, with the reason.
     *
     * @return array<string, string>
     */
    public static function missing(): array
    {
        $raw = self::decodeManifest(self::dir().DIRECTORY_SEPARATOR.self::MANIFEST);
        $missing = $raw['missing'] ?? null;
        $out = [];

        foreach (is_array($missing) ? $missing : [] as $slug => $why) {
            if (is_string($slug) && is_string($why) && $why !== '') {
                $out[$slug] = $why;
            }
        }

        return $out;
    }

    /** What `logo_path` a brand's processed logo gets, or null when there is none on disk. */
    public static function bundledPath(string $slug): ?string
    {
        $entry = self::manifest()[$slug] ?? null;

        if ($entry === null || ! is_file(self::dir().DIRECTORY_SEPARATOR.$entry['file'])) {
            return null;
        }

        return self::BUNDLED_PREFIX.$entry['file'];
    }

    /**
     * The logo the brand wall draws for this brand, or null.
     *
     * @return array{url: string, aspect: float}|null
     */
    public static function resolve(string $slug, ?string $logoPath): ?array
    {
        if ($slug === self::SAMPLE_RANGE || $logoPath === null || trim($logoPath) === '') {
            return null;
        }

        $logo = str_starts_with($logoPath, self::BUNDLED_PREFIX)
            ? self::bundled(substr($logoPath, strlen(self::BUNDLED_PREFIX)))
            : self::uploaded($logoPath);

        if ($logo === null || preg_match(self::URL_PATTERN, $logo['url']) !== 1) {
            return null;
        }

        return $logo;
    }

    /**
     * The file's own width / height, to three decimals — the one source of `logoAspect`. Null when
     * the file is missing, is not a format that carries transparency, or cannot be measured.
     */
    public static function aspectOf(string $file): ?float
    {
        $stamp = self::stamp($file);

        if ($stamp === null) {
            return null;
        }

        $cached = Cache::remember(
            'brand-logo-aspect:'.sha1($file.'|'.$stamp),
            self::CACHE_TTL,
            static fn (): float|false => self::measure($file) ?? false,
        );

        return is_float($cached) ? $cached : null;
    }

    /** @return array{url: string, aspect: float}|null */
    private static function bundled(string $file): ?array
    {
        if (preg_match(self::FILE_PATTERN, $file) !== 1) {
            return null;
        }

        $entry = null;

        foreach (self::manifest() as $candidate) {
            if ($candidate['file'] === $file) {
                $entry = $candidate;
                break;
            }
        }

        if ($entry === null) {
            return null;
        }

        $aspect = self::aspectOf(self::dir().DIRECTORY_SEPARATOR.$file);

        // The file is the truth. A manifest that no longer agrees with it is stale, and a stale
        // aspect would draw the mark at the wrong width — so nothing is drawn.
        if ($aspect === null || abs($aspect - round($entry['aspect'], 3)) > 0.0005) {
            return null;
        }

        return [
            'url' => self::BUNDLED_PREFIX.$file.($entry['hash'] === null ? '' : '?v='.$entry['hash']),
            'aspect' => $aspect,
        ];
    }

    /** @return array{url: string, aspect: float}|null */
    private static function uploaded(string $path): ?array
    {
        if (str_contains($path, '\\') || str_contains($path, '..')) {
            return null;
        }

        $relative = ltrim($path, '/');

        if ($relative === '' || preg_match('~\.(svg|png|webp)$~', $relative) !== 1) {
            return null;
        }

        $aspect = self::aspectOf(Storage::disk('public')->path($relative));

        return $aspect === null ? null : ['url' => '/storage/'.$relative, 'aspect' => $aspect];
    }

    private static function measure(string $file): ?float
    {
        [$width, $height] = match (mb_strtolower(pathinfo($file, PATHINFO_EXTENSION))) {
            'svg' => self::svgSize($file),
            'png' => self::pngSize($file),
            'webp' => self::webpSize($file),
            default => [null, null],
        };

        if ($width === null || $height === null || $width <= 0.0 || $height <= 0.0) {
            return null;
        }

        $aspect = round($width / $height, 3);

        return $aspect >= self::MIN_ASPECT && $aspect <= self::MAX_ASPECT ? $aspect : null;
    }

    /**
     * The viewBox is the ink's bounding box, so it is what the aspect comes from; width and height
     * are the fallback for a file without one.
     *
     * @return array{0: float|null, 1: float|null}
     */
    private static function svgSize(string $file): array
    {
        $head = @file_get_contents($file, false, null, 0, self::SVG_HEAD_BYTES);

        if (! is_string($head) || preg_match('~<svg\b[^>]*>~is', $head, $root) !== 1) {
            return [null, null];
        }

        if (preg_match('~\sviewBox\s*=\s*(["\'])\s*([^"\']*)\1~i', $root[0], $viewBox) === 1) {
            $parts = preg_split('~[\s,]+~', trim($viewBox[2]));
            $parts = is_array($parts) ? $parts : [];

            if (count($parts) !== 4 || ! is_numeric($parts[2]) || ! is_numeric($parts[3])) {
                return [null, null];
            }

            return [(float) $parts[2], (float) $parts[3]];
        }

        return [self::svgLength($root[0], 'width'), self::svgLength($root[0], 'height')];
    }

    private static function svgLength(string $tag, string $name): ?float
    {
        if (preg_match('~\s'.$name.'\s*=\s*(["\'])\s*([0-9]*\.?[0-9]+)\s*(px)?\s*\1~i', $tag, $match) !== 1) {
            return null;
        }

        return (float) $match[2];
    }

    /**
     * A PNG without an alpha channel (and without a palette's tRNS) is opaque, and an opaque mask
     * paints a solid block over the cell — so it is refused rather than drawn.
     *
     * @return array{0: float|null, 1: float|null}
     */
    private static function pngSize(string $file): array
    {
        $bytes = @file_get_contents($file, false, null, 0, self::PNG_HEAD_BYTES);

        if (! is_string($bytes) || ! str_starts_with($bytes, "\x89PNG\r\n\x1a\n")) {
            return [null, null];
        }

        $length = strlen($bytes);
        $at = 8;
        $width = null;
        $height = null;
        $alpha = false;

        while ($at + 8 <= $length) {
            $size = self::uint32($bytes, $at);
            $type = substr($bytes, $at + 4, 4);

            if ($type === 'IHDR') {
                if ($at + 8 + 13 > $length) {
                    return [null, null];
                }

                $width = self::uint32($bytes, $at + 8);
                $height = self::uint32($bytes, $at + 12);
                // Colour types 4 (grey + alpha) and 6 (RGBA) carry transparency.
                $alpha = in_array(ord($bytes[$at + 8 + 9]), [4, 6], true);
            } elseif ($type === 'tRNS') {
                $alpha = true;
            } elseif ($type === 'IDAT' || $type === 'IEND') {
                break;
            }

            $at += 12 + $size;
        }

        if (! $alpha || $width === null || $height === null) {
            return [null, null];
        }

        return [(float) $width, (float) $height];
    }

    /**
     * WebP: only the forms that can carry an alpha channel — an extended file whose alpha flag is
     * set, or a lossless one that says it uses alpha.
     *
     * @return array{0: float|null, 1: float|null}
     */
    private static function webpSize(string $file): array
    {
        $head = @file_get_contents($file, false, null, 0, 64);

        if (! is_string($head) || strlen($head) < 30 || substr($head, 0, 4) !== 'RIFF' || substr($head, 8, 4) !== 'WEBP') {
            return [null, null];
        }

        $chunk = substr($head, 12, 4);

        if ($chunk === 'VP8X') {
            if ((ord($head[20]) & 0x10) === 0) {
                return [null, null];
            }

            $width = 1 + (ord($head[24]) | ord($head[25]) << 8 | ord($head[26]) << 16);
            $height = 1 + (ord($head[27]) | ord($head[28]) << 8 | ord($head[29]) << 16);

            return [(float) $width, (float) $height];
        }

        if ($chunk === 'VP8L' && ord($head[20]) === 0x2F) {
            $bits = ord($head[21]) | ord($head[22]) << 8 | ord($head[23]) << 16 | ord($head[24]) << 24;

            if ((($bits >> 28) & 1) !== 1) {
                return [null, null];
            }

            return [(float) (($bits & 0x3FFF) + 1), (float) ((($bits >> 14) & 0x3FFF) + 1)];
        }

        return [null, null];
    }

    private static function uint32(string $bytes, int $at): int
    {
        return (ord($bytes[$at]) << 24) | (ord($bytes[$at + 1]) << 16) | (ord($bytes[$at + 2]) << 8) | ord($bytes[$at + 3]);
    }

    /**
     * @return array<string, array{file: string, format: string, aspect: float, hash: string|null}>
     */
    private static function readManifest(string $file): array
    {
        $raw = self::decodeManifest($file);
        $logos = $raw['logos'] ?? null;
        $out = [];

        foreach (is_array($logos) ? $logos : [] as $slug => $entry) {
            if (! is_string($slug) || preg_match(self::SLUG_PATTERN, $slug) !== 1 || ! is_array($entry)) {
                continue;
            }

            $name = $entry['file'] ?? null;
            $aspect = $entry['aspect'] ?? null;
            $hash = $entry['hash'] ?? null;

            if (! is_string($name) || preg_match(self::FILE_PATTERN, $name) !== 1) {
                continue;
            }

            if (! is_int($aspect) && ! is_float($aspect)) {
                continue;
            }

            $out[$slug] = [
                'file' => $name,
                'format' => mb_strtolower(pathinfo($name, PATHINFO_EXTENSION)),
                'aspect' => round((float) $aspect, 3),
                'hash' => is_string($hash) && preg_match(self::HASH_PATTERN, $hash) === 1 ? $hash : null,
            ];
        }

        return $out;
    }

    /** @return array<string, mixed> */
    private static function decodeManifest(string $file): array
    {
        if (! is_file($file)) {
            return [];
        }

        $raw = @file_get_contents($file);
        $decoded = is_string($raw) ? json_decode($raw, true) : null;

        return is_array($decoded) ? $decoded : [];
    }

    /** The file's timestamp and size, the cache key of everything read from it. */
    private static function stamp(string $file): ?string
    {
        clearstatcache(true, $file);

        if (! is_file($file)) {
            return null;
        }

        $time = filemtime($file);
        $size = filesize($file);

        return $time === false || $size === false ? null : $time.'-'.$size;
    }
}
