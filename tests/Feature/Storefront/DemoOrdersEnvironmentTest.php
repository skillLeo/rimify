<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\Vehicle;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\DatabaseSeeder;
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
            // (made-up type numbers): the live shop starts with the reference data alone; its cars come
            // from the vehicle data import and its first wheel is a real one.
            ->and(WheelModel::query()->count())->toBe(0)
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
