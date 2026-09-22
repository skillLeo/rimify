<?php

declare(strict_types=1);

use App\Models\WheelConfig;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia;

/**
 * ACCURACY.md D4 and findings #48/#59: the product page knows when it shows a demo model, so it
 * can say "Beispielbestand" and "not orderable yet"; and every configuration carries its verified
 * load rating (`maxLoadKg`), null where nobody has verified one (D2).
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('tells the product page that a demo model is demonstration data', function (): void {
    $model = WheelModel::query()->where('is_demo', true)->firstOrFail();

    $this->get('/felgen/'.$model->slug)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Produkt/Index')->where('demo', true));

    $model->update(['is_demo' => false]);

    $this->get('/felgen/'.$model->slug)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('demo', false));
});

it('carries the load rating in every configuration, null until one is verified', function (): void {
    $model = WheelModel::query()->whereHas('configs')->firstOrFail();

    $this->get('/felgen/'.$model->slug)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('configs.0.maxLoadKg')
            ->where('configs', fn ($configs) => collect($configs)->every(
                fn (array $c): bool => $c['maxLoadKg'] === null || (is_int($c['maxLoadKg']) && $c['maxLoadKg'] > 0)
            ))
        );

    // The column arrives with W1's migration; with it, a verified value travels as an integer.
    if (Schema::hasColumn('wheel_configs', 'max_load_kg')) {
        $config = WheelConfig::query()->where('wheel_model_id', $model->id)->orderBy('id')->firstOrFail();
        DB::table('wheel_configs')->where('wheel_model_id', $model->id)->update(['max_load_kg' => null]);
        DB::table('wheel_configs')->where('id', $config->id)->update(['max_load_kg' => 620]);

        $this->get('/felgen/'.$model->slug)
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('configs', fn ($configs) => collect($configs)->firstWhere('id', $config->id)['maxLoadKg'] === 620
                    && collect($configs)->where('id', '!=', $config->id)->every(fn (array $c): bool => $c['maxLoadKg'] === null))
            );
    }
});
