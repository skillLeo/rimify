<?php

declare(strict_types=1);

use App\Console\Commands\ReleaseSeed;
use App\Models\Setting;
use Database\Seeders\GoldenRecordSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\DemoWheelFixtures;

/*
 * rimify:release-seed runs on the live database during a deploy (deploy/remote.sh). It has to be
 * safe there: it applies once per release, re-running it duplicates and loses nothing, and it never
 * touches orders or their frozen verdicts (R-12).
 */

beforeEach(function (): void {
    $this->dir = DemoWheelFixtures::emptyDir();
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

/** Row counts of every table the release seeders write, plus the ids of the catalogue's models. */
function seededState(): array
{
    $tables = ['brands', 'wheel_models', 'wheel_finishes', 'wheel_configs', 'tyre_variants', 'vehicles', 'approval_documents', 'fitments', 'pages', 'faq_entries', 'nav_items', 'settings'];
    $state = [];

    foreach ($tables as $table) {
        $state[$table] = DB::table($table)->count();
    }

    $state['model_ids'] = DB::table('wheel_models')->orderBy('id')->pluck('slug', 'id')->all();

    return $state;
}

it('applies the release seed once and records it', function (): void {
    $this->artisan('rimify:release-seed')
        ->expectsOutputToContain('Release seed v'.ReleaseSeed::VERSION.' applied.')
        ->assertSuccessful();

    expect((int) Setting::get(ReleaseSeed::SETTING))->toBe(ReleaseSeed::VERSION)
        ->and(DB::table('wheel_models')->count())->toBeGreaterThan(0);

    $this->artisan('rimify:release-seed')
        ->expectsOutputToContain('already applied')
        ->assertSuccessful();
});

it('duplicates nothing and loses nothing when it runs again', function (): void {
    $this->artisan('rimify:release-seed')->assertSuccessful();
    $first = seededState();

    $this->artisan('rimify:release-seed', ['--force' => true])->assertSuccessful();

    expect(seededState())->toBe($first);
});

/*
 * D-089, the preview's state since 28.09.: its hero setting still named a demo model from before the demo catalogue left
 * the storefront. GoldenRecordSeeder claimed the hero only where none was chosen, ContentSeeder then cleared the demo
 * choice, and the homepage had no hero product — no photograph rolling in, no numbers section — while every test on a
 * fresh database stayed green.
 */
it('gives the hero back its real wheel where the setting still names a demo model', function (): void {
    $this->artisan('rimify:release-seed')->assertSuccessful();
    $demo = (int) DB::table('wheel_models')->where('is_demo', true)->value('id');
    $golden = (int) DB::table('wheel_models')->where('slug', GoldenRecordSeeder::SLUG)->value('id');
    Setting::set('hero_product_id', $demo);

    $this->artisan('rimify:release-seed', ['--force' => true])->assertSuccessful();

    expect((int) Setting::get('hero_product_id'))->toBe($golden);

    $this->get('/')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('hero.product.slug', GoldenRecordSeeder::SLUG)
        ->where('hero.product.facts', fn ($facts): bool => $facts !== null && $facts !== []));

    // A real wheel a person chose stays chosen.
    $chosen = (int) DB::table('wheel_models')->where('is_demo', false)->where('id', '<>', $golden)->value('id');

    if ($chosen > 0) {
        Setting::set('hero_product_id', $chosen);
        $this->artisan('rimify:release-seed', ['--force' => true])->assertSuccessful();
        expect((int) Setting::get('hero_product_id'))->toBe($chosen);
    }
});

it('never seeds orders and never touches frozen verdicts', function (): void {
    $orders = DB::table('orders')->count();
    $snapshots = DB::table('order_line_fitments')->count();

    $this->artisan('rimify:release-seed', ['--force' => true])->assertSuccessful();

    expect(DB::table('orders')->count())->toBe($orders)
        ->and(DB::table('order_line_fitments')->count())->toBe($snapshots);
});
