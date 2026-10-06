<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The shop the client's list is proven in (`npm run kundenliste`, the operator's brief „THE 34“ §0): a test environment
 * as the preview is after its reset — the baseline's seeders (ResetBaselineCommand) and no example catalogue — with the
 * development accounts the specs sign in with. The acceptance set goes in next (`rimify:demo --abnahme`), so the specs
 * see what the client will see.
 *
 * Only locally, only on a database named `*_e2e` (E2eShopSeeder's fence).
 */
class KundenlisteShopSeeder extends Seeder
{
    public function run(): void
    {
        $database = (string) DB::connection()->getDatabaseName();

        if (! app()->environment(['local', 'testing']) || ! str_ends_with($database, E2eShopSeeder::SUFFIX)) {
            throw new RuntimeException('KundenlisteShopSeeder runs only locally, on a database named *'.E2eShopSeeder::SUFFIX.", not on „{$database}“.");
        }

        $this->call([ReferenceDataSeeder::class, AccessSeeder::class, ReviewAccountsSeeder::class, ContentSeeder::class]);
    }
}
