<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * A database somebody can open the site against.
 *
 * Order matters and is not alphabetical: reference tables first because a missing load-index row
 * makes the engine throw rather than guess (R-03), then vehicles and the catalogue, then the
 * approvals that relate the two, then the orders that freeze a verdict against them. Content and
 * access hang off nothing and go last.
 *
 * The orders are demonstration data and are seeded only in the local and testing environments:
 * on any other database an invented order with an invented tracking number would read as a real
 * one (ACCURACY.md §7).
 *
 * Every seeder below is idempotent, so this can be re-run against a populated database without
 * duplicating a row — which matters because the one table that must never be rewritten,
 * `order_line_fitments`, would refuse anyway.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            ReferenceDataSeeder::class,
            VehicleSeeder::class,
            CatalogueSeeder::class,
            ApprovalSeeder::class,
        ]);

        if (app()->environment(['local', 'testing'])) {
            $this->call(CommerceSeeder::class);
        }

        $this->call([
            AccessSeeder::class,
            ContentSeeder::class,
        ]);
    }
}
