<?php

declare(strict_types=1);

use App\Console\Commands\ReleaseSeed;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
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

it('never seeds orders and never touches frozen verdicts', function (): void {
    $orders = DB::table('orders')->count();
    $snapshots = DB::table('order_line_fitments')->count();

    $this->artisan('rimify:release-seed', ['--force' => true])->assertSuccessful();

    expect(DB::table('orders')->count())->toBe($orders)
        ->and(DB::table('order_line_fitments')->count())->toBe($snapshots);
});
