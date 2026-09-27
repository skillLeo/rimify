<?php

declare(strict_types=1);

namespace App\Services\Storage;

use App\Models\StorageSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Which credential set the media disks are built from, in this order: the admin screen's saved and
 * tested set (Einstellungen › Medien und Speicher), else the `.env` values, else local folders.
 *
 * Read once per process and kept, beside a version stamp in the shared cache. A save bumps the
 * stamp: this process rebuilds at once (`flush`), and every other process — a queue worker, the next
 * request — sees the new stamp and rebuilds before it next touches a disk (`refreshIfChanged`). The
 * secret itself is never put in the cache: only the stamp is shared; the set is read from the
 * database, where it is encrypted.
 */
final class StorageSettings
{
    public const VERSION_KEY = 'storage.settings.version';

    private ?StorageConfig $memo = null;

    private ?int $memoVersion = null;

    public function current(): StorageConfig
    {
        $version = $this->version();

        if ($this->memo !== null && $this->memoVersion === $version) {
            return $this->memo;
        }

        $this->memoVersion = $version;

        return $this->memo = $this->fromDatabase() ?? $this->fromEnv() ?? StorageConfig::local();
    }

    /** The admin screen's active set, if one is saved whole. */
    public function fromDatabase(): ?StorageConfig
    {
        // No schema lookup first: an information_schema query on every request is slow on shared
        // MariaDB. A database without the table (before its migration) throws, and is caught.
        try {
            $row = StorageSetting::query()->where('state', StorageSetting::ACTIVE)->first();
        } catch (Throwable) {
            // No database or no table yet (a build step, a broken connection): the fallback serves.
            return null;
        }

        return $row !== null && $row->complete() ? self::fromRow($row, StorageConfig::DATABASE) : null;
    }

    /** The `.env` set (config/media.php `s3`), if it is whole. */
    public function fromEnv(): ?StorageConfig
    {
        /** @var array{key: ?string, secret: ?string, region: ?string, bucket: ?string, url: ?string, endpoint: ?string, path_style: bool} $env */
        $env = config('media.s3');

        if (blank($env['key'] ?? null) || blank($env['secret'] ?? null) || blank($env['bucket'] ?? null)) {
            return null;
        }

        return new StorageConfig(
            StorageConfig::ENV,
            (string) ($env['region'] ?: 'eu-north-1'),
            (string) $env['bucket'],
            $env['endpoint'] ?: null,
            (bool) $env['path_style'],
            $env['url'] ?: null,
            (string) $env['key'],
            (string) $env['secret'],
        );
    }

    public static function fromRow(StorageSetting $row, string $source): StorageConfig
    {
        return new StorageConfig($source, $row->region, $row->bucket, $row->endpoint, $row->path_style, $row->public_url, $row->access_key, $row->secret);
    }

    /** After a save: every process rebuilds its disks — this one now. */
    public function flush(): void
    {
        Cache::forever(self::VERSION_KEY, $this->version() + 1);
        Cache::forget(StorageProbe::CACHE_KEY);
        $this->memo = null;
        Storage::forgetDisk(array_keys((array) config('media.disks')));
    }

    /** Before a queued job: rebuild the disks if a save happened since this worker built them. */
    public function refreshIfChanged(): void
    {
        if ($this->memoVersion !== null && $this->memoVersion !== $this->version()) {
            $this->memo = null;
            Storage::forgetDisk(array_keys((array) config('media.disks')));
        }
    }

    private function version(): int
    {
        try {
            return (int) Cache::get(self::VERSION_KEY, 0);
        } catch (Throwable) {
            return 0;
        }
    }
}
