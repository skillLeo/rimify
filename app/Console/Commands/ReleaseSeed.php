<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoTables;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\BrandLogoSeeder;
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
    /**
     * Bump when a release changes seeded data that must reach an existing database.
     *
     * v2: the researched wheel brands and their one-colour logos (BrandLogoSeeder). Brand rows
     * only — no product, so no page shows anything new until a catalogue lands behind one.
     *
     * v3: `fitments.centre_bore_mm`. The migration adds the column nullable, which is right — a
     * document that states no bore must leave it empty — but it means an existing database keeps
     * NULL everywhere and the product page goes on showing only the rim's own figure. The bore the
     * documents state is seeded data, so ApprovalSeeder has to run once more to write it.
     *
     * v4: the invented example catalogue (the review release §2) — brands and models renamed in place,
     * drafts only, placeholder drawings — and a demo set written again where one is kept (a staging
     * preview): its order lines froze the old names, and frozen rows are renewed, never edited (R-12).
     */
    public const VERSION = 4;

    /** From this version on, a kept demo set is written again once, so its frozen labels match. */
    public const DEMO_RENEWED_AT = 4;

    /** The idempotent seeders a release may re-apply, in dependency order. */
    public const SEEDERS = [
        ReferenceDataSeeder::class,
        VehicleSeeder::class,
        CatalogueSeeder::class,
        BrandLogoSeeder::class,
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

        // A demo set kept on this database (only a staging preview keeps one; the live shop holds none,
        // demo:assert-clean) froze names the seeders above just changed: its figures taken away and
        // written anew, on the example catalogue the seeders just renewed.
        if ($applied < self::DEMO_RENEWED_AT && DemoTables::setTotal() > 0) {
            app(DemoPurge::class)->run(DemoPurgeCommand::operator('rimify:release-seed'), catalogue: false);
            $this->call('demo:seed', ['--no-interaction' => true]);
        }

        Setting::set(self::SETTING, self::VERSION);
        $this->info(sprintf('Release seed v%d applied.', self::VERSION));

        return self::SUCCESS;
    }
}
