<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Whether the bucket answers — for the health line in the rail (SystemHealth: „Speicher nicht
 * erreichbar“, amber). One small write to the private prefix's check file, at most every five
 * minutes, on a short timeout: a bucket that hangs must not hang the admin with it. A save of the
 * settings forgets the answer (StorageSettings::flush), so the next page asks the new bucket.
 *
 * The cache holds the answer and the storage's reason, never a key.
 *
 * @phpstan-type Status array{reachable: bool, reason: string|null, at: string}
 */
final class StorageProbe
{
    public const CACHE_KEY = 'storage.reachable';

    public const TTL_SECONDS = 300;

    public function __construct(private readonly StorageSettings $settings, private readonly AwsClients $aws) {}

    /**
     * Null when there is no bucket (local folders): nothing to reach.
     *
     * @return Status|null
     */
    public function status(): ?array
    {
        $set = $this->settings->current();

        if (! $set->isBucket()) {
            return null;
        }

        /** @var Status */
        return Cache::remember(self::CACHE_KEY, self::TTL_SECONDS, fn (): array => $this->probe($set));
    }

    /**
     * A write that just failed says more than a probe five minutes old: the health line turns amber
     * now, not at the next probe.
     */
    public function markDown(Throwable $e): void
    {
        if ($this->settings->current()->isBucket()) {
            Cache::put(self::CACHE_KEY, ['reachable' => false, 'reason' => StorageTester::reason($e), 'at' => now()->toIso8601String()], self::TTL_SECONDS);
        }
    }

    /** @return Status */
    private function probe(StorageConfig $set): array
    {
        $key = config('media.disks.docs_private.prefix').'/'.config('media.healthcheck', '.healthcheck');

        try {
            $this->aws->s3($set, ['http' => ['connect_timeout' => 3, 'timeout' => 5]])->putObject([
                'Bucket' => $set->bucket,
                'Key' => $key,
                'Body' => 'rimify-probe',
                'ContentType' => 'text/plain',
            ]);

            return ['reachable' => true, 'reason' => null, 'at' => now()->toIso8601String()];
        } catch (Throwable $e) {
            return ['reachable' => false, 'reason' => StorageTester::reason($e), 'at' => now()->toIso8601String()];
        }
    }
}
