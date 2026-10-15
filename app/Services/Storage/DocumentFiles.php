<?php

declare(strict_types=1);

namespace App\Services\Storage;

use App\Http\Controllers\Admin\GutachtenController;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Where a Gutachten's PDF is, found when it is read (EIGENE-FUNDE 105, ADMIN-GEFUNDEN 501; the operator's brief of
 * 14.10.2026 §6; D-229).
 *
 * Switching the shop from the server's disk to the bucket moves no file: a PDF uploaded before the switch stays on the
 * disk, and a link built for wherever storage points *now* answered 403 for both of the client's Gutachten. So the file
 * is looked for on the disk in force first, then on the other side, and a link is only ever built to where the file
 * is. A file found nowhere is reported as missing — in the log, in the admin, by the go-live check — never handed to a
 * customer as a link that fails. `rimify:pdf-migrate` brings the stragglers over.
 *
 * Asked on every product page with a Gutachten, so where a file was found is kept for ten minutes per key and disk; a
 * file not found is looked for again on every read.
 */
final class DocumentFiles
{
    public const FOUND = 'found';

    /** Not on the disk in force, but on the other side: the local disk while the bucket is in force. */
    public const ELSEWHERE = 'elsewhere';

    public const MISSING = 'missing';

    private const CACHE_SECONDS = 600;

    public function __construct(private readonly StorageSettings $settings, private readonly MediaDisks $disks) {}

    /** @return array{state: string, url: string|null} */
    public function locate(string $key): array
    {
        $cacheKey = self::cacheKey($key, $this->settings->current()->isBucket());
        $found = Cache::get($cacheKey);

        if (is_array($found) && is_string($found['state'] ?? null)) {
            /** @var array{state: string, url: string|null} $found */
            return $found;
        }

        $found = $this->look($key);

        // Only a file that is there is remembered: a missing one is looked for again on the next read, so it shows the
        // moment it arrives — an upload, a copy, `rimify:pdf-migrate` — and is never „missing“ for ten more minutes.
        if ($found['state'] === self::MISSING) {
            Log::warning('Gutachten-PDF nicht gefunden', ['key' => $key]);
        } else {
            Cache::put($cacheKey, $found, self::CACHE_SECONDS);
        }

        return $found;
    }

    /** After a file was copied over: the next read looks again. */
    public function forget(string $key): void
    {
        Cache::forget(self::cacheKey($key, true));
        Cache::forget(self::cacheKey($key, false));
    }

    /** The disk in force, as code names it. */
    public function current(): Filesystem
    {
        return Storage::disk(GutachtenController::DISK);
    }

    /** The server's own disk, whatever is in force — where a PDF uploaded before the switch to the bucket stayed. */
    public function local(): Filesystem
    {
        return $this->disks->make($this->disks->config(GutachtenController::DISK, StorageConfig::local()));
    }

    /** @return array{state: string, url: string|null} */
    private function look(string $key): array
    {
        try {
            $current = $this->current();

            if ($current->exists($key)) {
                return ['state' => self::FOUND, 'url' => $current->url($key)];
            }
        } catch (Throwable) {
            // The bucket cannot be asked just now: the server's disk may still hold the file.
        }

        if ($this->settings->current()->isBucket()) {
            try {
                $local = $this->local();

                if ($local->exists($key)) {
                    return ['state' => self::ELSEWHERE, 'url' => $local->url($key)];
                }
            } catch (Throwable) {
                // Nowhere to be found.
            }
        }

        return ['state' => self::MISSING, 'url' => null];
    }

    private static function cacheKey(string $key, bool $bucket): string
    {
        return 'gutachten-pdf:'.($bucket ? 'bucket' : 'local').':'.sha1($key);
    }
}
