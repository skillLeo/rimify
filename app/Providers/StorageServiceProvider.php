<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\Storage\AwsClients;
use App\Services\Storage\MediaDisks;
use App\Services\Storage\NoVirusScanner;
use App\Services\Storage\StorageSettings;
use App\Services\Storage\VirusScanner;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;

/**
 * The media disks (config/media.php) as a driver of their own, `rimify`: a disk is built at its
 * first use from the settings in force (StorageSettings), so nothing is read at boot and a saved
 * change rebuilds them without a restart — in this process at once, in a queue worker before its
 * next job.
 */
final class StorageServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // One per process: its memo and the disks it built belong together.
        $this->app->singleton(StorageSettings::class);
        // The SDK's own transport; a test swaps in one that answers every command itself.
        $this->app->singleton(AwsClients::class, static fn (): AwsClients => new AwsClients);
        // No scanner on the host yet (docs/launch/BLOCKED.md); the hook is in every upload already.
        $this->app->bind(VirusScanner::class, NoVirusScanner::class);
    }

    public function boot(): void
    {
        Storage::extend('rimify', fn ($app, array $config) => $app->make(MediaDisks::class)->build((string) $config['disk']));

        foreach (MediaDisks::names() as $name) {
            config(["filesystems.disks.{$name}" => ['driver' => 'rimify', 'disk' => $name]]);
        }

        Queue::before(fn () => $this->app->make(StorageSettings::class)->refreshIfChanged());
    }
}
