<?php

declare(strict_types=1);

use App\Models\Order;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\DatabaseSeeder;

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
            // The catalogue is still seeded: only the orders are held back.
            ->and(WheelModel::query()->count())->toBeGreaterThan(0);
    });
});

it('seeds the demo orders locally', function (): void {
    seedInEnvironment('local', function (): void {
        $this->seed(CommerceSeeder::class);

        expect(Order::query()->count())->toBeGreaterThan(0);
    });
});
