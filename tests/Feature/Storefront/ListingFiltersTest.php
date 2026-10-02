<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Http\Controllers\Storefront\FelgenController;
use App\Models\Brand;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #30 and #27 (D-118): the listing filters without a car, by the same five facets a car's listing has,
 * and the listing's last filters survive choosing a car.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/** A rim diameter some published models have and others do not — the filter must tell them apart. */
function filtersDiameter(): string
{
    $rows = DB::table('wheel_configs as wc')
        ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
        ->where('wm.status', CatalogueStatus::Published->value)
        ->whereNull('wc.deleted_at')->whereNull('wm.deleted_at')
        ->groupBy('wc.diameter_in')
        ->selectRaw('wc.diameter_in AS d, COUNT(DISTINCT wm.id) AS n')
        ->orderBy('n')
        ->get();

    return (string) (int) (float) $rows->first()->d;
}

it('narrows the catalogue without a car to the wheels in the chosen size, and counts every facet', function (): void {
    $inch = filtersDiameter();
    $models = WheelConfig::query()->whereRaw('CAST(diameter_in AS DECIMAL(4,1)) = ?', [(float) $inch])->pluck('wheel_model_id')->unique();

    $this->get('/felgen?zoll='.$inch)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('hasVehicle', false)
            // As the homepage's size tile sends it (19), written as the options write it (19.0), so it shows as chosen.
            ->where('filters.zoll', [$inch.'.0'])
            ->where('cards', fn ($cards) => collect($cards)->isNotEmpty() && collect($cards)->every(fn ($c) => $models->contains($c['modelId'])))
            ->has('facets.marke')
            ->has('facets.zoll')
            ->has('facets.breite')
            ->missing('facets.ohne_eintragung'));
});

it('counts a facet with the other filters applied but not its own, as the car listing does', function (): void {
    $inch = filtersDiameter();

    $this->get('/felgen?zoll='.$inch)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            // Its own filter does not narrow its own counts: the other sizes stay choosable.
            ->where('facets.zoll', fn ($options) => collect($options)->count() > 1));
});

it('takes no Eintragung filter without a car — it is a statement about one', function (): void {
    $this->get('/felgen?ohne_eintragung=1')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->missing('filters.ohne_eintragung'));
});

it('reads a brand from the homepage’s brand wall by its slug as the brand itself', function (): void {
    $brand = Brand::query()->whereColumn('slug', '!=', 'name')->orderBy('id')->firstOrFail();

    $this->get('/felgen?marke='.rawurlencode((string) $brand->slug))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('filters.marke', [(string) $brand->name]));
});

it('keeps the listing’s size when a car is chosen afterwards — the client’s #27', function (): void {
    $inch = filtersDiameter();
    $vehicle = Vehicle::query()->orderBy('id')->firstOrFail();

    $this->get('/felgen?zoll='.$inch)->assertOk();
    expect(session(FelgenController::FILTERS_SESSION))->toBe(['zoll' => [$inch.'.0']]);

    $location = $this->from('/felgen-suchen')->post('/fahrzeug', ['fahrzeug' => $vehicle->id])->assertRedirect()->headers->get('Location');

    expect(urldecode((string) $location))->toContain('/felgen?zoll[0]='.$inch.'.0');
});
