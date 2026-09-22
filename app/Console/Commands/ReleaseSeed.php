<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Setting;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Database\Seeders\VehicleSeeder;
use Illuminate\Console\Command;

/**
 * The seeded data a release brings, applied once per release on a database that already has data.
 *
 * deploy/remote.sh seeds an empty database in full, but it never re-seeds a populated one on its
 * own, because that would overwrite whatever has been edited since. Some releases still have to
 * change seeded rows: the accuracy pass renames the demo catalogue in place and retires demo
 * fitments that pair mismatched bolt patterns. A release like that bumps VERSION. On the next deploy
 * this command runs the idempotent seeders once, then records the version, so every deploy after it
 * is a no-op.
 *
 * Never the orders (CommerceSeeder) and never the accounts (AccessSeeder). Order-line fitments are
 * immutable (R-12), and none of the seeders below touches them.
 */
final class ReleaseSeed extends Command
{
    /** Bump when a release changes seeded data that must reach an existing database. */
    public const VERSION = 1;

    /** The idempotent seeders a release may re-apply, in dependency order. */
    public const SEEDERS = [
        ReferenceDataSeeder::class,
        VehicleSeeder::class,
        CatalogueSeeder::class,
        ApprovalSeeder::class,
        ContentSeeder::class,
    ];

    public const SETTING = 'release_seed_version';

    protected $signature = 'rimify:release-seed {--force : Run even when this release\'s seed has already been applied}';

    protected $description = 'Apply the seeded data this release brings, once';

    public function handle(): int
    {
        $applied = (int) Setting::get(self::SETTING, 0);

        if ($applied >= self::VERSION && ! $this->option('force')) {
            $this->line(sprintf('Release seed v%d already applied.', $applied));

            return self::SUCCESS;
        }

        foreach (self::SEEDERS as $seeder) {
            $status = $this->call('db:seed', ['--class' => $seeder, '--force' => true, '--no-interaction' => true]);

            if ($status !== self::SUCCESS) {
                $this->error(sprintf('%s failed; the release seed is not recorded and runs again next time.', class_basename($seeder)));

                return self::FAILURE;
            }
        }

        Setting::set(self::SETTING, self::VERSION);
        $this->info(sprintf('Release seed v%d applied.', self::VERSION));

        return self::SUCCESS;
    }
}
