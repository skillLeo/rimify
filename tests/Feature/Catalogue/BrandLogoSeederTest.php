<?php

declare(strict_types=1);

use App\Console\Commands\ReleaseSeed;
use App\Models\Brand;
use App\Models\WheelModel;
use App\Support\MakeName;
use Database\Seeders\BrandLogoSeeder;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Support\Str;
use Tests\Support\BrandLogoFixtures;
use Tests\Support\DemoWheelFixtures;

/*
 * The researched wheel brands as rows — name, slug, order, logo — and nothing else. The seeder
 * runs again on every release, so it has to create each brand exactly once, put back what an
 * earlier catalogue retired, and leave everything it does not own untouched.
 */

beforeEach(function (): void {
    $this->wheels = DemoWheelFixtures::emptyDir();
    $this->logos = BrandLogoFixtures::dir();
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->wheels);
    BrandLogoFixtures::remove($this->logos);
});

/**
 * Every brand row, with the columns this seeder may write.
 *
 * @return list<array<string, string|int|null>>
 */
function brandRowState(): array
{
    return Brand::withTrashed()
        ->orderBy('id')
        ->get()
        ->map(static fn (Brand $brand): array => [
            'id' => (int) $brand->id,
            'name' => (string) $brand->name,
            'slug' => (string) $brand->slug,
            'logo_path' => is_string($brand->logo_path) ? $brand->logo_path : null,
            'sort_order' => (int) $brand->sort_order,
            'deleted_at' => $brand->deleted_at?->toIso8601String(),
            'updated_at' => $brand->updated_at?->toIso8601String(),
        ])
        ->all();
}

it('creates every researched brand once, MOTEC first, with the processed logo where there is one', function (): void {
    BrandLogoFixtures::svg($this->logos, 'motec', 1030.9, 762.3, 'a1b2c3d4');
    BrandLogoFixtures::svg($this->logos, 'bbs', 159.663, 59.111);

    $this->seed(CatalogueSeeder::class);
    $models = WheelModel::withTrashed()->count();

    $this->seed(BrandLogoSeeder::class);

    foreach (BrandLogoSeeder::BRANDS as $spec) {
        $brand = Brand::query()->where('slug', $spec['slug'])->first();

        expect($brand)->not->toBeNull("{$spec['name']} was not created")
            ->and($brand?->name)->toBe($spec['name'])
            ->and((int) $brand?->sort_order)->toBe(BrandLogoSeeder::sortOrder($spec['rank']))
            ->and(Brand::withTrashed()->whereRaw('LOWER(name) = ?', [mb_strtolower($spec['name'])])->count())->toBe(1);
    }

    expect(Brand::query()->where('slug', 'motec')->value('logo_path'))->toBe('/images/brands/motec.svg')
        ->and(Brand::query()->where('slug', 'bbs')->value('logo_path'))->toBe('/images/brands/bbs.svg')
        // Nothing processed for this one: no logo, and the name stays the mark.
        ->and(Brand::query()->where('slug', 'borbet')->value('logo_path'))->toBeNull()
        // A brand row is never a product: the seeder adds no wheel, so no page changes.
        ->and(WheelModel::withTrashed()->count())->toBe($models);

    $slugs = array_column(BrandLogoSeeder::BRANDS, 'slug');

    expect(Brand::query()->whereIn('slug', $slugs)->orderBy('sort_order')->orderBy('id')->pluck('slug')->all())->toBe($slugs);
});

it('is safe to run again, and after the catalogue seeder, without moving a row', function (): void {
    BrandLogoFixtures::svg($this->logos, 'motec', 1030.9, 762.3, 'a1b2c3d4');

    $this->seed(CatalogueSeeder::class);
    $this->seed(BrandLogoSeeder::class);

    $settled = brandRowState();

    $this->seed(BrandLogoSeeder::class);
    $this->seed(CatalogueSeeder::class);
    $this->seed(BrandLogoSeeder::class);

    expect(brandRowState())->toBe($settled);
});

it('brings a retired brand back in place, under the spelling the brand uses', function (): void {
    $old = Brand::query()->create(['name' => 'Dezent', 'slug' => 'dezent', 'sort_order' => 100]);
    $old->delete();

    $this->seed(BrandLogoSeeder::class);

    $brand = Brand::query()->find($old->id);

    expect($brand)->not->toBeNull()
        ->and($brand?->name)->toBe('DEZENT')
        ->and(Brand::withTrashed()->where('slug', 'dezent')->count())->toBe(1);
});

it('leaves a retired brand that still carries wheels retired', function (): void {
    $brand = Brand::query()->create(['name' => 'ATS', 'slug' => 'ats', 'sort_order' => 100]);
    WheelModel::factory()->create(['brand_id' => $brand->id, 'name' => 'Irgendein Rad']);
    $brand->delete();

    $this->seed(BrandLogoSeeder::class);

    expect(Brand::withTrashed()->find($brand->id)?->trashed())->toBeTrue()
        ->and(Brand::query()->where('slug', 'ats')->exists())->toBeFalse();
});

it('keeps an uploaded logo, and never gives the sample range one', function (): void {
    BrandLogoFixtures::svg($this->logos, 'bbs', 400.0, 100.0);

    $this->seed(CatalogueSeeder::class);

    Brand::query()->create(['name' => 'BBS', 'slug' => 'bbs', 'sort_order' => 100, 'logo_path' => 'brands/bbs-eigenes.png']);
    Brand::query()->where('slug', 'demo')->update(['logo_path' => '/images/brands/bbs.svg']);

    $this->seed(BrandLogoSeeder::class);

    expect(Brand::query()->where('slug', 'bbs')->value('logo_path'))->toBe('brands/bbs-eigenes.png')
        ->and(Brand::query()->where('slug', 'demo')->value('logo_path'))->toBeNull();
});

it('clears a bundled logo whose file is no longer there', function (): void {
    $this->seed(CatalogueSeeder::class);
    Brand::query()->where('slug', 'motec')->update(['logo_path' => '/images/brands/motec.svg']);

    // The fixture directory holds no motec.svg: a path to a file that is gone draws nothing.
    $this->seed(BrandLogoSeeder::class);

    expect(Brand::query()->where('slug', 'motec')->value('logo_path'))->toBeNull();
});

it('spells and orders the brands the way the rest of the app does', function (): void {
    $slugs = array_column(BrandLogoSeeder::BRANDS, 'slug');
    $ranks = array_column(BrandLogoSeeder::BRANDS, 'rank');

    expect(array_values(array_unique($slugs)))->toBe($slugs)
        ->and(array_values(array_unique($ranks)))->toBe($ranks)
        ->and($ranks[0])->toBe(0)
        ->and(BrandLogoSeeder::sortOrder(0))->toBe(BrandLogoSeeder::MOTEC_SORT_ORDER)
        ->and(BrandLogoSeeder::sortOrder(1))->toBeGreaterThan(BrandLogoSeeder::MOTEC_SORT_ORDER)
        ->and(BrandLogoSeeder::maintains('Demo'))->toBeFalse();

    foreach (BrandLogoSeeder::BRANDS as $spec) {
        expect(MakeName::normalise($spec['name']))->toBe($spec['name'], "{$spec['name']} is spelled differently elsewhere")
            ->and(Str::slug($spec['name']))->toBe($spec['slug'])
            ->and(BrandLogoSeeder::maintains($spec['name']))->toBeTrue()
            ->and(BrandLogoSeeder::maintains($spec['slug']))->toBeTrue();
    }
});

it('reaches an existing database through the release seed', function (): void {
    BrandLogoFixtures::svg($this->logos, 'motec', 1030.9, 762.3);

    expect(ReleaseSeed::SEEDERS)->toContain(BrandLogoSeeder::class);

    $this->artisan('rimify:release-seed')->assertSuccessful();

    expect(Brand::query()->where('slug', 'bbs')->exists())->toBeTrue()
        ->and(Brand::query()->where('slug', 'motec')->value('logo_path'))->toBe('/images/brands/motec.svg');
});
