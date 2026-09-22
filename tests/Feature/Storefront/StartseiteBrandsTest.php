<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\BrandLogos;
use Database\Seeders\AccessSeeder;
use Database\Seeders\BrandLogoSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Storage;
use Tests\Support\BrandLogoFixtures;
use Tests\Support\DemoWheelFixtures;

/*
 * The `brands` prop of the homepage (docs/design/sections/home-brands.md §4.2):
 *
 *   { name, slug, logo, logoAspect, count, href }
 *
 * `logo` and `logoAspect` are both there or both null — a mark that cannot be sized is not drawn,
 * the name is. Which brands are in the list is the old gate, unchanged: a published model with an
 * in-stock configuration. A brand row without a wheel is nowhere on the page.
 */

beforeEach(function (): void {
    $this->wheels = DemoWheelFixtures::emptyDir();
    $this->logos = BrandLogoFixtures::dir();
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->wheels);
    BrandLogoFixtures::remove($this->logos);
});

/** @return array<string, array<string, mixed>> the `brands` prop, keyed by slug */
function homepageBrands(): array
{
    $brands = test()->get('/')->assertOk()->inertiaProps('brands');

    return collect(is_array($brands) ? $brands : [])->keyBy('slug')->all();
}

it('ships the processed logo and its aspect, and never one for the sample range', function (): void {
    BrandLogoFixtures::svg($this->logos, 'motec', 420.0, 100.0, 'a1b2c3d4');
    $this->seed(BrandLogoSeeder::class);

    $brands = homepageBrands();

    expect($brands)->toHaveKey('motec')
        ->and($brands['motec']['logo'])->toBe('/images/brands/motec.svg?v=a1b2c3d4')
        ->and($brands['motec']['logoAspect'])->toEqual(4.2)
        ->and($brands['motec']['count'])->toBeGreaterThanOrEqual(1)
        ->and($brands['motec']['href'])->toBe('/felgen?marke=motec')
        // Beispielsortiment: a range, never a make, so never a mark of its own.
        ->and($brands)->toHaveKey('demo')
        ->and($brands['demo']['logo'])->toBeNull()
        ->and($brands['demo']['logoAspect'])->toBeNull();

    foreach ($brands as $slug => $brand) {
        expect($brand['logo'] === null)->toBe($brand['logoAspect'] === null, "{$slug}: a logo without an aspect, or the other way round");

        if ($brand['logoAspect'] !== null) {
            $aspect = (float) $brand['logoAspect'];

            expect(round($aspect, 3))->toEqual($aspect)
                ->and($aspect)->toBeGreaterThanOrEqual(BrandLogos::MIN_ASPECT)
                ->and($aspect)->toBeLessThanOrEqual(BrandLogos::MAX_ASPECT)
                ->and(preg_match(BrandLogos::URL_PATTERN, (string) $brand['logo']))->toBe(1, "{$slug}: a logo path the wall would refuse");
        }
    }
});

it('lists a brand only once it has a published wheel in stock, logo or not', function (): void {
    BrandLogoFixtures::svg($this->logos, 'bbs', 400.0, 100.0);
    BrandLogoFixtures::svg($this->logos, 'borbet', 240.4, 32.1);
    $this->seed(BrandLogoSeeder::class);

    // Seeded rows with their logos, and no catalogue: nowhere on the page.
    expect(homepageBrands())->not->toHaveKey('bbs')->not->toHaveKey('borbet');

    $bbs = Brand::query()->where('slug', 'bbs')->firstOrFail();
    $model = WheelModel::factory()->create(['brand_id' => $bbs->id, 'name' => 'Testrad']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    WheelConfig::factory()->outOfStock()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id]);

    // A published wheel nobody can buy is still not a tile.
    expect(homepageBrands())->not->toHaveKey('bbs');

    // A draft with stock is not one either.
    $borbet = Brand::query()->where('slug', 'borbet')->firstOrFail();
    $draft = WheelModel::factory()->draft()->create(['brand_id' => $borbet->id, 'name' => 'Entwurfsrad']);
    $draftFinish = WheelFinish::factory()->create(['wheel_model_id' => $draft->id]);
    WheelConfig::factory()->create(['wheel_model_id' => $draft->id, 'wheel_finish_id' => $draftFinish->id, 'stock_qty' => 9]);

    expect(homepageBrands())->not->toHaveKey('borbet');

    WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'stock_qty' => 5]);

    $brands = homepageBrands();

    expect($brands)->toHaveKey('bbs')
        ->and($brands['bbs']['logo'])->toBe('/images/brands/bbs.svg')
        ->and($brands['bbs']['logoAspect'])->toEqual(4.0)
        ->and($brands['bbs']['count'])->toBe(1);
});

it('draws no mark it cannot size', function (): void {
    BrandLogoFixtures::svg($this->logos, 'motec', 420.0, 100.0);
    // A manifest entry whose file was never written, and one whose file says something else.
    BrandLogoFixtures::entryWithoutFile($this->logos, 'geist', 3.0);
    BrandLogoFixtures::svg($this->logos, 'veraltet', 300.0, 100.0, null, 2.0);
    $this->seed(BrandLogoSeeder::class);

    $motec = Brand::query()->where('slug', 'motec')->firstOrFail();

    $refused = [
        '/images/brands/geist.svg' => 'a manifest entry with no file behind it',
        '/images/brands/veraltet.svg' => 'a manifest aspect the file no longer has',
        '/images/brands/unbekannt.svg' => 'a file in no manifest',
        '/images/brands/../../geheim.svg' => 'a path that climbs out of the directory',
        'marken/logo.jpg' => 'a format that cannot be transparent',
        '' => 'no path at all',
    ];

    foreach ($refused as $path => $why) {
        $motec->forceFill(['logo_path' => $path])->save();
        $brands = homepageBrands();

        expect($brands['motec']['logo'])->toBeNull($why)
            ->and($brands['motec']['logoAspect'])->toBeNull($why);
    }

    // An uploaded logo keeps working, and is measured from the file like any other.
    Storage::fake('public');
    Storage::disk('public')->put('marken/eigenes.svg', BrandLogoFixtures::markup(300.0, 100.0));
    $motec->forceFill(['logo_path' => 'marken/eigenes.svg'])->save();

    $brands = homepageBrands();

    expect($brands['motec']['logo'])->toBe('/storage/marken/eigenes.svg')
        ->and($brands['motec']['logoAspect'])->toEqual(3.0);
});
