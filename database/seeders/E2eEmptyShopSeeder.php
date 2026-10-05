<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The end-to-end database of a shop with no wheel at all (e2e/shop.ts EMPTY_SHOP): the reference data, the cars, the
 * team and the delivered content with the hero's photograph — and no catalogue, no Gutachten, no order, as after a reset
 * to Shopdaten once the vehicle data is back in (the operator's brief of 05.10.2026, §2). The cars are there, so a car
 * can be chosen and the selector's 0 walked.
 *
 * It refuses to run anywhere else: only in the local or testing environment, and only on a database whose name ends in
 * `_e2e_leer`.
 */
class E2eEmptyShopSeeder extends Seeder
{
    public const EMPTY_SUFFIX = '_e2e_leer';

    public function run(): void
    {
        $database = (string) DB::connection()->getDatabaseName();

        if (! app()->environment(['local', 'testing']) || ! str_ends_with($database, self::EMPTY_SUFFIX)) {
            throw new RuntimeException('E2eEmptyShopSeeder runs only locally, on a database named *'.self::EMPTY_SUFFIX.", not on „{$database}“.");
        }

        $this->call([ReferenceDataSeeder::class, VehicleSeeder::class, AccessSeeder::class, ContentSeeder::class]);
    }
}
