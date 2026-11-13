<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\Vehicle;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\GoldenRecordSeeder;
use Illuminate\Support\Facades\DB;

/**
 * Finding #43 and ACCURACY.md §7: demo orders are written in the local and testing environments
 * only. On any other database an invented order with an invented tracking number would read as a
 * real one — and the frozen snapshots it carries could never be removed again (R-12).
 */
function seedInEnvironment(string $environment, Closure $run): void
{
    $previous = app()['env'];

    try {
        app()['env'] = $environment;
        $run();
    } finally {
        app()['env'] = $previous;
    }
}

it('seeds no demo orders outside the local and testing environments', function (): void {
    seedInEnvironment('production', function (): void {
        // `--force`: in production db:seed asks for confirmation, and a test cannot answer.
        $this->artisan('db:seed', ['--class' => CommerceSeeder::class, '--force' => true])->assertSuccessful();
        expect(Order::query()->count())->toBe(0);

        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true])->assertSuccessful();
        expect(Order::query()->count())->toBe(0)
            // The example catalogue is demo too (the launch release §3), and so are the development cars
            // (made-up type numbers): the live shop starts with the reference data and one real wheel —
            // the golden record's Borbet DB8GT2, a draft until priced; its cars come from the vehicle
            // data import.
            ->and(WheelModel::query()->pluck('slug')->all())->toBe([GoldenRecordSeeder::SLUG])
            ->and(WheelModel::query()->where('is_demo', true)->count())->toBe(0)
            ->and(Vehicle::query()->count())->toBe(0)
            ->and(DB::table('load_index_table')->count())->toBeGreaterThan(0);
    });
});

it('seeds the demo orders locally', function (): void {
    seedInEnvironment('local', function (): void {
        $this->seed(CommerceSeeder::class);

        expect(Order::query()->count())->toBeGreaterThan(0);
    });
});

it('gives every seeded order its public id, also where the seeding runs without model events (D-354, D-471)', function (): void {
    seedInEnvironment('local', function (): void {
        // DatabaseSeeder runs its seeders WithoutModelEvents: the order's own hook never fires there.
        Order::withoutEvents(fn () => $this->seed(CommerceSeeder::class));

        $ids = Order::query()->pluck('public_id');

        expect($ids)->not->toBeEmpty()
            ->and($ids->filter()->count())->toBe($ids->count())
            ->and($ids->unique()->count())->toBe($ids->count());

        // The order page opens by it, without signing in — the link the gate's QA follows.
        $this->get('/bestellung/'.$ids->first())->assertOk();
    });
});
