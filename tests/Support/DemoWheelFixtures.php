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
    /** The values the real photograph map gives the DB8GT2's stamped 18-inch size (wheel-photos.php `facts`). */
    public const STAMPED = ['width_in' => 8.5, 'diameter_in' => 18.0, 'et_mm' => 35, 'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 72.5, 'max_load_kg' => 650];

    /** A fresh, empty directory, and the config pointed at it. */
    public static function emptyDir(): string
    {
        $dir = storage_path('framework/testing/demo-wheels-'.bin2hex(random_bytes(4)));
        File::ensureDirectoryExists($dir);
        config(['rimify.demo.wheels_dir' => $dir, 'rimify.demo.placeholders_dir' => $dir.DIRECTORY_SEPARATOR.'placeholders']);

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

    /**
     * A photograph map of the test's own, and the config pointed at it — the shipped map is empty.
     *
     * @param  array<string, array<string, mixed>>  $entries  file => entry, as in wheel-photos.php
     */
    public static function photoMap(string $dir, array $entries): void
    {
        $file = $dir.DIRECTORY_SEPARATOR.'wheel-photos.php';
        File::put($file, '<?php return '.var_export($entries, true).';');
        config(['rimify.demo.photos_file' => $file]);
    }

    /**
     * A front view and a further angle of one finish, in the map's shape.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function photoPair(string $model, string $finish): array
    {
        $credit = ['source' => 'Test', 'photographer' => 'Test', 'licence' => 'Test', 'url' => 'https://example.test'];

        return [
            'fixture-front.jpg' => ['slug' => $model.'-front', 'model' => $model, 'finish' => $finish, 'circle' => [540, 540, 500], 'hub' => null, 'credit' => $credit],
            'fixture-angle.jpg' => ['slug' => $model.'-angle', 'model' => $model, 'finish' => $finish, 'circle' => [540, 540, 500], 'view' => 'Schräg von vorn', 'hub' => null, 'credit' => $credit],
        ];
    }

    /**
     * Front shots measured for the hero (App\Support\HeroPhotos), as `wheels:process-images` leaves them: per finish a
     * map entry with its anchors and stamp, and a manifest with the shadowless `bare` frame and the wheel anchor it rolls
     * about — and, with `$open`, the opened frame the dark band turns. The map is the test's own.
     *
     * @param  array<string, string>  $finishes  finish name => slug, the first leading
     * @param  array<string, int|float>|null  $facts  the photographed wheel's values (wheel-photos.php `facts`); the
     *                                                DB8GT2's stamped 18-inch size unless given, none with null
     */
    public static function heroPhotos(string $dir, string $model, array $finishes, ?string $stamp = '53841', bool $open = false, ?array $facts = self::STAMPED): void
    {
        $credit = ['source' => 'Kunde', 'photographer' => 'Borbet (Herstellerbild)', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''];
        $anchors = ['centre' => ['x' => 0.5, 'y' => 0.47], 'wheel' => ['x' => 0.5, 'y' => 0.47, 'r' => 0.41]];
        $entries = [];

        foreach ($finishes as $finish => $slug) {
            $entries["fixture-{$slug}.jpg"] = [
                'slug' => $slug, 'model' => $model, 'brand' => 'Borbet', 'name' => 'DB8GT2', 'finish' => $finish,
                'circle' => [540, 540, 500], 'hub' => null, 'anchors' => ['centre' => [540, 508], 'wheel' => [540, 508, 443]],
                'credit' => $credit,
            ] + ($stamp === null ? [] : ['stamp' => $stamp]) + ($facts === null ? [] : ['facts' => $facts]);

            $plain = self::manifest($slug);
            $frame = static fn (string $name): array => [...$plain, 'name' => $name, 'base' => '/storage/demo/wheels/'.$slug.'/'.$name, 'anchors' => $anchors];
            $manifest = [...$plain, 'anchors' => $anchors, 'bare' => $frame($slug.'-bare')]
                + ($stamp === null ? [] : ['stamp' => $stamp])
                + ($open ? ['open' => $frame($slug.'-open')] : []);

            File::ensureDirectoryExists($dir.DIRECTORY_SEPARATOR.$slug);
            File::put($dir.DIRECTORY_SEPARATOR.$slug.DIRECTORY_SEPARATOR.'manifest.json', (string) json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        self::photoMap($dir, $entries);
    }

    public static function remove(string $dir): void
    {
        File::deleteDirectory($dir);
    }
}
