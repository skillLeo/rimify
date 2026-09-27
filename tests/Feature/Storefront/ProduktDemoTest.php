<?php

declare(strict_types=1);

use App\Models\WheelConfig;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia;

/**
 * The product page shows a model that is in the shop and no other: a demonstration row, a draft or
 * an archived model answers 404, whoever knows its address (the review release §2). And every
 * configuration carries its verified load rating (`maxLoadKg`), null where nobody has verified one (D2).
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('shows a published model, and nothing that is not in the shop', function (): void {
    $model = WheelModel::query()->orderBy('id')->firstOrFail();

    $this->get('/felgen/'.$model->slug)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Produkt/Index')->where('demo', false));

    // A demonstration row, then a real draft, then an archived model: none of them has a page.
    foreach ([['is_demo' => true, 'status' => 'draft'], ['is_demo' => false, 'status' => 'draft'], ['is_demo' => false, 'status' => 'archived']] as $state) {
        WheelModel::query()->whereKey($model->id)->update($state);

        $this->get('/felgen/'.$model->slug)->assertNotFound();
    }
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
