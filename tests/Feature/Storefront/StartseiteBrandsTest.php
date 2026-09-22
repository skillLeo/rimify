<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\BrandLogos;
use Database\Seeders\AccessSeeder;
use Database\Seeders\BrandLogoSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\Support\BrandLogoFixtures;
use Tests\Support\DemoWheelFixtures;

/*
 * The `brands` prop of the homepage (docs/design/sections/home-brands.md §4.2):
 *
 *   { name, slug, logo, logoAspect, count, href }
 *
 * `logo` and `logoAspect` are both there or both null — a mark that cannot be sized is not drawn,
 * the name is. Which brands are in the list: every wheel brand (`brands.is_wheel_brand`), stock or
 * not, and any brand with a published model that has an in-stock configuration. `count` is the
 * published models with stock, 0 allowed; `href` is the listing link only when the count is above
 * zero — a brand without stock is greyed on the wall and never a link into an empty listing
 * (CLAUDE.md §2). A tyre brand with no wheel is nowhere on the page.
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

it('lists every researched wheel brand in order, with its logo, whether or not it has wheels on stock', function (): void {
    BrandLogoFixtures::svg($this->logos, 'bbs', 400.0, 100.0);
    $this->seed(BrandLogoSeeder::class);

    $brands = homepageBrands();

    // brands.sort_order: MOTEC and the sample range from the catalogue seed, then the researched brands by rank.
    expect(array_keys($brands))->toBe(['motec', 'demo', 'bbs', 'borbet', 'oz-racing', 'ronal', 'aez', 'rial', 'dezent', 'dotz', 'alutec', 'ats', 'brock', 'cms'])
        // A researched brand waiting for its catalogue: its logo, no wheel, no link.
        ->and($brands['bbs'])->toMatchArray(['name' => 'BBS', 'logo' => '/images/brands/bbs.svg', 'count' => 0, 'href' => null])
        ->and($brands['bbs']['logoAspect'])->toEqual(4.0)
        // One without a processed logo: the name is the mark, and still no link.
        ->and($brands['borbet'])->toMatchArray(['name' => 'BORBET', 'logo' => null, 'logoAspect' => null, 'count' => 0, 'href' => null])
        // The ones with wheels on stock are linked, with their counts.
        ->and($brands['motec']['count'])->toBeGreaterThanOrEqual(1)
        ->and($brands['motec']['href'])->toBe('/felgen?marke=motec')
        ->and($brands['demo']['count'])->toBeGreaterThanOrEqual(1)
        ->and($brands['demo']['href'])->toBe('/felgen?marke=demo');

    foreach ($brands as $slug => $brand) {
        expect($brand['count'] > 0)->toBe($brand['href'] !== null, "{$slug}: a link without stock, or stock without a link");
    }
});

it('counts and links a wheel brand only once it has a published wheel in stock', function (): void {
    BrandLogoFixtures::svg($this->logos, 'bbs', 400.0, 100.0);
    BrandLogoFixtures::svg($this->logos, 'borbet', 240.4, 32.1);
    $this->seed(BrandLogoSeeder::class);

    // Seeded rows with their logos and no catalogue: on the wall, greyed — count 0, no link.
    $brands = homepageBrands();

    expect($brands['bbs'])->toMatchArray(['count' => 0, 'href' => null, 'logo' => '/images/brands/bbs.svg'])
        ->and($brands['borbet'])->toMatchArray(['count' => 0, 'href' => null, 'logo' => '/images/brands/borbet.svg']);

    $bbs = Brand::query()->where('slug', 'bbs')->firstOrFail();
    $model = WheelModel::factory()->create(['brand_id' => $bbs->id, 'name' => 'Testrad']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    WheelConfig::factory()->outOfStock()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id]);

    // A published wheel nobody can buy is still nothing to link to.
    expect(homepageBrands()['bbs'])->toMatchArray(['count' => 0, 'href' => null]);

    // A draft with stock is not either.
    $borbet = Brand::query()->where('slug', 'borbet')->firstOrFail();
    $draft = WheelModel::factory()->draft()->create(['brand_id' => $borbet->id, 'name' => 'Entwurfsrad']);
    $draftFinish = WheelFinish::factory()->create(['wheel_model_id' => $draft->id]);
    WheelConfig::factory()->create(['wheel_model_id' => $draft->id, 'wheel_finish_id' => $draftFinish->id, 'stock_qty' => 9]);

    expect(homepageBrands()['borbet'])->toMatchArray(['count' => 0, 'href' => null]);

    WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'stock_qty' => 5]);

    $brands = homepageBrands();

    expect($brands['bbs'])->toMatchArray(['count' => 1, 'href' => '/felgen?marke=bbs', 'logo' => '/images/brands/bbs.svg'])
        ->and($brands['bbs']['logoAspect'])->toEqual(4.0)
        ->and($brands['borbet'])->toMatchArray(['count' => 0, 'href' => null]);
});

it('links a brand with wheels on stock even when nobody flagged it — MOTEC and the sample range on a fresh database', function (): void {
    // A fresh database: the migration backfill found no rows and BrandLogoSeeder has not run.
    expect(Brand::query()->whereIn('slug', ['motec', 'demo'])->where('is_wheel_brand', true)->exists())->toBeFalse();

    $brands = homepageBrands();

    expect(array_keys($brands))->toBe(['motec', 'demo'])
        ->and($brands['motec']['count'])->toBeGreaterThanOrEqual(1)
        ->and($brands['motec']['href'])->toBe('/felgen?marke=motec')
        ->and($brands['demo']['count'])->toBeGreaterThanOrEqual(1)
        ->and($brands['demo']['href'])->toBe('/felgen?marke=demo');
});

it('never lists a tyre brand, and never a retired one', function (): void {
    // The seeded tyre brands carry tyres with verified labels and not one wheel.
    $tyreBrands = Brand::query()->whereIn('slug', ['bridgestone', 'continental', 'michelin'])->get();

    expect($tyreBrands)->toHaveCount(3);

    foreach ($tyreBrands as $tyreBrand) {
        expect($tyreBrand->is_wheel_brand)->toBeFalse()
            ->and($tyreBrand->tyreVariants()->exists())->toBeTrue();
    }

    $reifenwerk = Brand::factory()->create(['name' => 'Reifenwerk', 'slug' => 'reifenwerk', 'sort_order' => 5]);
    TyreVariant::factory()->create(['brand_id' => $reifenwerk->id]);

    expect(homepageBrands())
        ->not->toHaveKey('bridgestone')
        ->not->toHaveKey('continental')
        ->not->toHaveKey('michelin')
        ->not->toHaveKey('reifenwerk');

    // A flagged wheel brand is on the wall until it is retired (R-04: retired, never hard-deleted).
    $retired = Brand::factory()->create(['name' => 'Ehemals', 'slug' => 'ehemals', 'is_wheel_brand' => true]);

    expect(homepageBrands()['ehemals'])->toMatchArray(['count' => 0, 'href' => null]);

    $retired->delete();

    expect(homepageBrands())->not->toHaveKey('ehemals');
});

it('marks every brand with a wheel model a wheel brand when the column arrives, and nothing else', function (): void {
    expect(Schema::hasColumn('brands', 'is_wheel_brand'))->toBeTrue();

    $migration = require database_path('migrations/fitment/2026_09_25_000300_add_is_wheel_brand_to_brands.php');

    $draftOnly = Brand::factory()->create(['name' => 'Entwurf AG', 'slug' => 'entwurf-ag']);
    WheelModel::factory()->draft()->create(['brand_id' => $draftOnly->id]);

    $retiredWheel = Brand::factory()->create(['name' => 'Altrad', 'slug' => 'altrad']);
    WheelModel::factory()->create(['brand_id' => $retiredWheel->id])->delete();

    $tyresOnly = Brand::factory()->create(['name' => 'Reifenwerk', 'slug' => 'reifenwerk']);
    TyreVariant::factory()->create(['brand_id' => $tyresOnly->id]);

    $bare = Brand::factory()->create(['name' => 'Leer', 'slug' => 'leer']);

    // The default is false: a new row claims nothing.
    expect($bare->fresh()?->is_wheel_brand)->toBeFalse();

    // As on a database from before the column: nobody flagged.
    Brand::query()->update(['is_wheel_brand' => false]);

    $migration->backfill();

    $flag = static fn (string $slug): bool => (bool) Brand::query()->where('slug', $slug)->value('is_wheel_brand');

    expect($flag('motec'))->toBeTrue()
        ->and($flag('demo'))->toBeTrue()
        // Any wheel_models row counts: a draft, and one that was retired.
        ->and($flag('entwurf-ag'))->toBeTrue()
        ->and($flag('altrad'))->toBeTrue()
        // Tyres are not wheels; nothing at all is nothing.
        ->and($flag('bridgestone'))->toBeFalse()
        ->and($flag('reifenwerk'))->toBeFalse()
        ->and($flag('leer'))->toBeFalse();
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
