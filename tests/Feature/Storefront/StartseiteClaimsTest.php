<?php

declare(strict_types=1);

use App\Models\TyreVariant;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * ACCURACY.md D7 on the homepage: no "Beliebt" without data behind it (#51), and an EU tyre label
 * only for a tyre with a verified EPREL entry (#66).
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

it('labels the coverage order for what it counts', function (): void {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', 'Felgen mit den meisten Freigaben')
        ->where('popular.tabs.0', ['key' => 'beliebt', 'label' => 'Meiste Freigaben'])
        ->where('popular.tabs', fn ($tabs) => collect($tabs)->every(fn (array $tab): bool => ! str_contains(mb_strtolower($tab['label']), 'beliebt')))
    );
});

it('shows no tyre label without a verified EPREL entry', function (): void {
    DB::table('tyre_variants')->update(['eprel_id' => null]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('komplettrad.tyre', null));
});

it('shows the label of a tyre whose EPREL entry is on record', function (): void {
    DB::table('tyre_variants')->update(['eprel_id' => null]);

    // The seeded tyres are invented and carry no label: this one gets a registration and its values.
    $tyre = TyreVariant::query()->where('stock_qty', '>', 0)->orderByDesc('id')->firstOrFail();
    DB::table('tyre_variants')->where('id', $tyre->id)->update([
        'eprel_id' => '123456', 'eu_fuel_class' => 'C', 'eu_wet_grip_class' => 'A', 'eu_noise_db' => 72, 'eu_noise_class' => 'B',
    ]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('komplettrad.tyre.eprelId', '123456')
        ->where('komplettrad.tyre.fuel', 'C')
    );
});
