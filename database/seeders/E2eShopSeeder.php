<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The storefront's end-to-end database: a shop with wheels in it, for the Playwright specs that walk
 * the storefront (e2e/shop.ts). Built with `composer e2e:shop`.
 *
 * Example data never reaches the storefront (the review release §2): the demo catalogue is seeded as
 * drafts. A storefront spec needs published wheels, so this seeder makes the seeded catalogue the
 * e2e shop's own — published, not demo — exactly as the Pest storefront tests do in their throwaway
 * database (CatalogueSeeder::$shopFixture).
 *
 * It refuses to run anywhere else: only in the local or testing environment, and only on a database
 * whose name ends in `_e2e`. No database anyone could deploy can get a published invented product
 * from here.
 */
class E2eShopSeeder extends Seeder
{
    public const SUFFIX = '_e2e';

    public function run(): void
    {
        $database = (string) DB::connection()->getDatabaseName();

        if (! app()->environment(['local', 'testing']) || ! str_ends_with($database, self::SUFFIX)) {
            throw new RuntimeException('E2eShopSeeder runs only locally, on a database named *'.self::SUFFIX.", not on „{$database}“.");
        }

        $this->call(DatabaseSeeder::class);

        // The catalogue is this database's shop. The tyres too, so a Komplettrad can be walked.
        DB::table('wheel_models')->where('is_demo', true)->update(['is_demo' => false, 'status' => 'published']);
        DB::table('tyre_variants')->update(['is_demo' => false]);

        // The golden record's wheel — the one in the hero's photograph — published and priced as the client's shop had
        // it before its reset (229 € at 18″, 269 € at 19″, 12 a size): the hero states a wheel's values only once it is
        // published (D-155), and the protected suite needs them (P3). A seeded draft has no price, so this is its own.
        $golden = DB::table('wheel_models')->where('slug', GoldenRecordSeeder::SLUG)->value('id');

        if ($golden !== null) {
            $unpriced = DB::table('wheel_configs')->where('wheel_model_id', $golden)->where('price_cents', 0);
            (clone $unpriced)->where('diameter_in', '<', 19)->update(['price_cents' => 22_900, 'stock_qty' => 12]);
            (clone $unpriced)->where('diameter_in', '>=', 19)->update(['price_cents' => 26_900, 'stock_qty' => 12]);
            DB::table('wheel_models')->where('id', $golden)->update(['status' => 'published']);
        }
    }
}
