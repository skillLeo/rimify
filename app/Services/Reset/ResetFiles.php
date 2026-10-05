<?php

declare(strict_types=1);

namespace App\Services\Reset;

use App\Services\Admin\Catalogue\BrandLogoStore;
use App\Services\Demo\DemoPlaceholders;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\FileAttributes;
use Throwable;

/**
 * The files that belong to what a reset removes: the wheels' pictures (product-images/), the Gutachten PDFs (ABEs/),
 * the brands' uploaded logos and the example catalogue's placeholder drawings. They are moved into the reset's own
 * folder, not deleted, so „rückgängig machen“ can put them back; the folder goes after seven days (TestReset::prune).
 *
 * Never touched: the content's pictures (website-images/) and the invoices (invoices/) — neither belongs to the
 * shop's data — and the photographs that ship with a release (storage/app/public/demo/wheels), which the deploy
 * brings back anyway.
 */
final class ResetFiles
{
    /** Where in a reset's folder each kind of file is kept. */
    private const PRODUCT = 'product-images';

    private const DOCUMENTS = 'ABEs';

    private const LOGOS = 'brands';

    private const DRAWINGS = 'placeholders';

    /**
     * The files a level would move, counted: pictures and PDFs.
     *
     * @return array{images: int, pdfs: int}
     */
    public function count(ResetLevel $level): array
    {
        if (! $level->replacesShop()) {
            return ['images' => count(self::drawings()), 'pdfs' => 0];
        }

        return [
            'images' => count(self::listed(self::disk('media_products'), '')) + count(self::listed(Storage::disk('public'), BrandLogoStore::DIR)) + count(self::drawings()),
            'pdfs' => count(self::listed(self::disk('docs_public'), '')),
        ];
    }

    /**
     * The bytes a level would move (or, at the demo level, copy) into its folder — what ResetDisk counts before the
     * safety copy is begun. Sizes come from the listing itself, so a bucket answers in one request per page of files.
     */
    public function bytes(ResetLevel $level): int
    {
        $total = 0;

        foreach (self::drawings() as $absolute) {
            $total += (int) @filesize($absolute);
        }

        if (! $level->replacesShop()) {
            return $total;
        }

        foreach ([[self::disk('media_products'), ''], [Storage::disk('public'), BrandLogoStore::DIR], [self::disk('docs_public'), '']] as [$disk, $prefix]) {
            $total += self::sized($disk, $prefix);
        }

        return $total;
    }

    /**
     * Moves the files a level removes into `$dir/files`. The demo level only copies the drawings: DemoPurge removes
     * them itself, and only once no finish shows one.
     *
     * @return array{images: int, pdfs: int, failed: int}
     */
    public function trash(ResetLevel $level, string $dir): array
    {
        $moved = ['images' => 0, 'pdfs' => 0, 'failed' => 0];

        foreach (self::drawings() as $relative => $absolute) {
            $target = $dir.'/files/'.self::DRAWINGS.'/'.$relative;
            File::ensureDirectoryExists(dirname($target));

            $ok = $level->replacesShop() ? @rename($absolute, $target) : @copy($absolute, $target);
            $moved[$ok ? 'images' : 'failed']++;
        }

        if (! $level->replacesShop()) {
            return $moved;
        }

        foreach ([[self::PRODUCT, self::disk('media_products'), '', 'images'], [self::LOGOS, Storage::disk('public'), BrandLogoStore::DIR, 'images'], [self::DOCUMENTS, self::disk('docs_public'), '', 'pdfs']] as [$kind, $disk, $prefix, $counter]) {
            foreach (self::listed($disk, $prefix) as $path) {
                $moved[self::moveOut($disk, $path, $dir.'/files/'.$kind.'/'.$path) ? $counter : 'failed']++;
            }
        }

        return $moved;
    }

    /**
     * Puts back what trash() moved, where it came from.
     *
     * @return array{restored: int, failed: int}
     */
    public function restore(string $dir): array
    {
        $result = ['restored' => 0, 'failed' => 0];
        $root = $dir.'/files';

        if (! is_dir($root)) {
            return $result;
        }

        foreach (File::allFiles($root) as $file) {
            $relative = str_replace('\\', '/', $file->getRelativePathname());
            [$kind, $path] = array_pad(explode('/', $relative, 2), 2, '');

            try {
                $ok = match ($kind) {
                    self::DRAWINGS => self::putLocal($file->getPathname(), DemoPlaceholders::dir().'/'.$path),
                    self::PRODUCT => self::moveIn(self::disk('media_products'), $file->getPathname(), $path),
                    self::LOGOS => self::moveIn(Storage::disk('public'), $file->getPathname(), $path),
                    self::DOCUMENTS => self::moveIn(self::disk('docs_public'), $file->getPathname(), $path),
                    default => false,
                };
            } catch (Throwable $e) {
                report($e);
                $ok = false;
            }

            $result[$ok ? 'restored' : 'failed']++;
        }

        return $result;
    }

    private static function disk(string $name): Filesystem
    {
        return Storage::disk($name);
    }

    /**
     * Every file under a prefix of a disk; none when the disk cannot be listed (a bucket that is not set up yet).
     *
     * @return list<string>
     */
    private static function listed(Filesystem $disk, string $prefix): array
    {
        try {
            return array_values(array_filter($disk->allFiles($prefix), static fn (string $path): bool => ! str_starts_with(basename($path), '.')));
        } catch (Throwable $e) {
            report($e);

            return [];
        }
    }

    /** The bytes of every file under a prefix of a disk, skipping dotfiles as listed() does; 0 when it cannot be listed. */
    private static function sized(Filesystem $disk, string $prefix): int
    {
        try {
            if ($disk instanceof FilesystemAdapter) {
                $sum = 0;

                foreach ($disk->getDriver()->listContents($prefix, true) as $item) {
                    if ($item instanceof FileAttributes && ! str_starts_with(basename($item->path()), '.')) {
                        $sum += (int) ($item->fileSize() ?? 0);
                    }
                }

                return $sum;
            }

            return array_sum(array_map(static fn (string $path): int => (int) $disk->size($path), self::listed($disk, $prefix)));
        } catch (Throwable $e) {
            report($e);

            return 0;
        }
    }

    /**
     * The placeholder drawings on disk, relative path => absolute path.
     *
     * @return array<string, string>
     */
    private static function drawings(): array
    {
        $dir = DemoPlaceholders::dir();

        if (! is_dir($dir)) {
            return [];
        }

        $files = [];

        foreach (File::allFiles($dir) as $file) {
            $files[str_replace('\\', '/', $file->getRelativePathname())] = $file->getPathname();
        }

        return $files;
    }

    private static function moveOut(Filesystem $disk, string $path, string $target): bool
    {
        try {
            $stream = $disk->readStream($path);

            if (! is_resource($stream)) {
                return false;
            }

            File::ensureDirectoryExists(dirname($target));
            $out = fopen($target, 'wb');

            if ($out === false) {
                fclose($stream);

                return false;
            }

            stream_copy_to_stream($stream, $out);
            fclose($stream);
            fclose($out);

            return $disk->delete($path);
        } catch (Throwable $e) {
            report($e);

            return false;
        }
    }

    private static function moveIn(Filesystem $disk, string $source, string $path): bool
    {
        $stream = fopen($source, 'rb');

        if ($stream === false) {
            return false;
        }

        try {
            $ok = $disk->writeStream($path, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        if ($ok) {
            @unlink($source);
        }

        return $ok;
    }

    private static function putLocal(string $source, string $target): bool
    {
        File::ensureDirectoryExists(dirname($target));

        return @rename($source, $target);
    }
}
