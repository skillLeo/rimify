<?php

declare(strict_types=1);

namespace Tests\Support;

use Illuminate\Support\Facades\File;

/**
 * A stand-in for `wheels:process-images` output: manifests of the shape the Picture component
 * reads, written into a directory of the test's own, so a seed or a page can be tested with and
 * without cut-outs no matter what this machine has rendered.
 */
final class DemoWheelFixtures
{
    /** A fresh, empty directory, and the config pointed at it. */
    public static function emptyDir(): string
    {
        $dir = storage_path('framework/testing/demo-wheels-'.bin2hex(random_bytes(4)));
        File::ensureDirectoryExists($dir);
        config(['rimify.demo.wheels_dir' => $dir]);

        return $dir;
    }

    /** @return array<string, mixed> */
    public static function manifest(string $slug): array
    {
        $frame = static fn (string $name, int $height): array => [
            'name' => $name,
            'base' => '/storage/demo/wheels/'.$slug.'/'.$name,
            'width' => 1080,
            'height' => $height,
            'widths' => [480, 768, 1080],
            'fallback' => 'png',
            'placeholder' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        ];

        return $frame($slug, 1080) + [
            'wide' => $frame($slug.'-4x3', 810),
            'source' => $slug.'.jpg',
            'credit' => ['source' => 'Test', 'photographer' => 'Test', 'licence' => 'Test', 'url' => 'https://example.test'],
            'pipeline' => 2,
            'fingerprint' => sha1($slug),
        ];
    }

    /**
     * Write a manifest for each slug into the directory.
     *
     * @param  list<string>  $slugs
     */
    public static function write(string $dir, array $slugs): void
    {
        foreach ($slugs as $slug) {
            File::ensureDirectoryExists($dir.DIRECTORY_SEPARATOR.$slug);
            File::put(
                $dir.DIRECTORY_SEPARATOR.$slug.DIRECTORY_SEPARATOR.'manifest.json',
                (string) json_encode(self::manifest($slug), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            );
        }
    }

    public static function remove(string $dir): void
    {
        File::deleteDirectory($dir);
    }
}
