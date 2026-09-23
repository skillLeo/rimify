<?php

declare(strict_types=1);

namespace Tests\Support;

use Illuminate\Support\Facades\File;

/**
 * A stand-in for what `node scripts/brand-logo.mjs` writes: processed one-colour logos and their
 * manifest, in a directory of the test's own, so a page or a seed can be tested with and without
 * a logo no matter what has been processed on this machine.
 */
final class BrandLogoFixtures
{
    /** A fresh, empty logo directory with an empty manifest, and the config pointed at it. */
    public static function dir(): string
    {
        $dir = storage_path('framework/testing/brand-logos-'.bin2hex(random_bytes(4)));
        File::ensureDirectoryExists($dir);
        config(['rimify.brand_logos.dir' => $dir]);
        self::write($dir, ['logos' => [], 'missing' => []]);

        return $dir;
    }

    /**
     * A one-colour SVG with a transparent background, listed in the manifest under `$slug`.
     *
     * @return string the `logo_path` a brand row would carry for it
     */
    public static function svg(
        string $dir,
        string $slug,
        float $width,
        float $height,
        ?string $hash = null,
        ?float $aspect = null,
        ?string $file = null,
    ): string {
        $name = $file ?? $slug.'.svg';
        File::put($dir.DIRECTORY_SEPARATOR.$name, self::markup($width, $height));

        $entry = [
            'file' => $name,
            'format' => 'svg',
            'width' => $width,
            'height' => $height,
            'aspect' => $aspect ?? round($width / $height, 3),
        ];

        if ($hash !== null) {
            $entry['hash'] = $hash;
        }

        self::add($dir, $slug, $entry);

        return '/images/brands/'.$name;
    }

    /** A manifest entry whose file was never written — the stale case. */
    public static function entryWithoutFile(string $dir, string $slug, float $aspect): string
    {
        self::add($dir, $slug, ['file' => $slug.'.svg', 'format' => 'svg', 'aspect' => $aspect]);

        return '/images/brands/'.$slug.'.svg';
    }

    /** A triangle, so the fixture is never mistaken for a background plate. */
    public static function markup(float $width, float $height): string
    {
        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %s %s" width="%s" height="%s" fill="#000">'
            .'<path d="M0,0L%s,%s L0,%s Z"/></svg>',
            $width,
            $height,
            $width,
            $height,
            $width,
            $height / 2,
            $height,
        );
    }

    /** @param array<string, mixed> $entry */
    public static function add(string $dir, string $slug, array $entry): void
    {
        $manifest = self::read($dir);
        $logos = is_array($manifest['logos'] ?? null) ? $manifest['logos'] : [];
        $logos[$slug] = $entry;
        $manifest['logos'] = $logos;
        self::write($dir, $manifest);
    }

    /** @return array<string, mixed> */
    public static function read(string $dir): array
    {
        $file = $dir.DIRECTORY_SEPARATOR.'manifest.json';

        if (! is_file($file)) {
            return ['logos' => [], 'missing' => []];
        }

        $decoded = json_decode(File::get($file), true);

        return is_array($decoded) ? $decoded : ['logos' => [], 'missing' => []];
    }

    /** @param array<string, mixed> $manifest */
    public static function write(string $dir, array $manifest): void
    {
        File::put(
            $dir.DIRECTORY_SEPARATOR.'manifest.json',
            (string) json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        );
    }

    public static function remove(string $dir): void
    {
        File::deleteDirectory($dir);
    }
}
