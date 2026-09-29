<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Demo\DemoPlaceholders;
use App\Support\DemoWheels;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\GoldenRecordSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Tests\Support\DemoWheelFixtures;

/*
 * The demo catalogue — the example data the admin is reviewed on (the review release §2): invented
 * brands only, sizes that exist, no fact a document would have to state, every row flagged as a
 * demonstration and never published. A finish carries a picture only where a cut-out was mapped and
 * rendered: missing imagery fails closed to NULL, and a finish never borrows another's picture.
 */

beforeEach(function (): void {
    $this->dir = DemoWheelFixtures::emptyDir();
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

/** Finishes that carry a photograph's manifest — not a drawn placeholder. */
function photographedFinishes(): int
{
    return WheelFinish::query()->whereNotNull('image_manifest')->get()
        ->filter(static fn (WheelFinish $f): bool => ($f->image_manifest['kind'] ?? null) !== 'placeholder')
        ->count();
}

it('seeds sixteen to twenty-four demo models with specifications that exist, all of them drafts', function (): void {
    $this->seed(CatalogueSeeder::class);

    $models = WheelModel::query()->with(['finishes', 'configs'])->get();

    expect($models->count())->toBeGreaterThanOrEqual(16)
        ->and($models->count())->toBeLessThanOrEqual(24);

    foreach ($models as $model) {
        expect($model->is_demo)->toBeTrue()
            ->and($model->status->value)->toBe('draft')
            ->and(in_array($model->spoke_count, [5, 7, 10, 20], true))->toBeTrue()
            ->and($model->finishes)->not->toBeEmpty()
            ->and($model->configs->count())->toBeGreaterThanOrEqual(2);
    }

    foreach (WheelConfig::query()->get() as $config) {
        expect($config->bolt_holes)->toBe(5)
            ->and(in_array((float) $config->bolt_circle_mm, [108.0, 112.0, 114.3, 120.0], true))->toBeTrue()
            ->and($config->centre_bore_mm)->toBeGreaterThan(50.0)
            ->and($config->width_in)->toBeGreaterThanOrEqual(6.5)
            ->and($config->diameter_in)->toBeGreaterThanOrEqual(16.0)
            ->and($config->et_mm)->toBeGreaterThanOrEqual(20)
            ->and($config->price_cents)->toBeGreaterThanOrEqual(40_000)
            ->and($config->price_cents)->toBeLessThanOrEqual(150_000)
            ->and($config->currency)->toBe('EUR');
    }
});

it('names every wheel and tyre under an invented brand, never a real maker', function (): void {
    $this->seed(CatalogueSeeder::class);

    $live = Brand::query()->whereHas('wheelModels')->orWhereHas('tyreVariants')->orderBy('sort_order')->pluck('name')->all();

    expect($live)->toBe(CatalogueSeeder::BRANDS);

    foreach (WheelModel::query()->with('brand')->get() as $model) {
        expect(CatalogueSeeder::BRANDS)->toContain($model->brand->name)
            ->and($model->slug)->toBe(CatalogueSeeder::slugFor($model->brand->name, $model->name));

        // No real maker's name in a model's name either.
        foreach (CatalogueSeeder::FORMER_BRANDS as $real) {
            expect(mb_stripos($model->name, $real))->toBeFalse("{$model->name} carries {$real}");
        }
    }

    // Never the same brand twice under two spellings.
    $lower = array_map(static fn (string $n): string => mb_strtolower($n), $live);
    expect(count($lower))->toBe(count(array_unique($lower)));
});

it('claims no type designation, no rating, no KBA number, no Radlast and no hump for any wheel', function (): void {
    $this->seed(CatalogueSeeder::class);

    foreach (WheelModel::query()->with('configs')->get() as $model) {
        expect($model->type_designation)->toBeNull()
            ->and($model->rating)->toBeNull()
            ->and($model->rating_count)->toBe(0);

        foreach ($model->configs as $config) {
            // Designations only a Gutachten can state; an invented wheel has none.
            expect($config->kba_number)->toBeNull()
                ->and($config->max_load_kg)->toBeNull()
                ->and($config->hump)->toBeNull()
                ->and($config->bead_profile)->toBeNull();
        }
    }
});

it('keeps Bergsteig Gipfel in eleven sizes over four bolt patterns, with the article numbers it had', function (): void {
    $this->seed(CatalogueSeeder::class);

    $model = WheelModel::query()->where('slug', 'bergsteig-gipfel')->with(['finishes', 'configs'])->firstOrFail();
    $sizes = $model->configs->map(fn (WheelConfig $c): string => sprintf('%.1fx%.1f ET%d %dx%.1f/%.1f', $c->width_in, $c->diameter_in, $c->et_mm, $c->bolt_holes, $c->bolt_circle_mm, $c->centre_bore_mm))->sort()->values()->all();

    expect($model->finishes->pluck('name_de')->all())->toBe(['Hellgrau'])
        ->and($sizes)->toBe([
            '8.0x18.0 ET45 5x108.0/72.6', '8.0x18.0 ET45 5x112.0/66.5', '8.0x18.0 ET50 5x114.3/72.6', '8.0x19.0 ET48 5x112.0/66.5',
            '8.5x19.0 ET30 5x112.0/66.5', '8.5x19.0 ET35 5x120.0/72.6', '8.5x19.0 ET45 5x112.0/66.5', '8.5x19.0 ET45 5x114.3/72.6',
            '8.5x20.0 ET35 5x120.0/72.6', '9.5x19.0 ET20 5x112.0/66.5', '9.5x20.0 ET37 5x114.3/72.6',
        ])
        ->and($model->configs->pluck('sku')->sort()->values()->all())->toBe(['RMF-000095', 'RMF-000096', 'RMF-000099', 'RMF-000100', 'RMF-000101', 'RMF-000102', 'RMF-000103', 'RMF-000104', 'RMF-000105', 'RMF-000106', 'RMF-000107']);
});

it('seeds the tyres under an invented maker, in sizes that exist, without an EU label', function (): void {
    $this->seed(CatalogueSeeder::class);

    $tyres = TyreVariant::query()->with('brand')->get();

    expect($tyres)->toHaveCount(6);

    foreach ($tyres as $tyre) {
        expect($tyre->brand->name)->toBe('Laufwerk')
            ->and($tyre->is_demo)->toBeTrue()
            ->and($tyre->eprel_id)->toBeNull()
            ->and($tyre->eu_fuel_class)->toBeNull()
            ->and($tyre->eu_wet_grip_class)->toBeNull()
            ->and($tyre->eu_noise_db)->toBeNull()
            ->and(in_array([(int) $tyre->width_mm, (int) $tyre->aspect, (float) $tyre->diameter_in], [[245, 45, 18.0], [255, 40, 19.0]], true))->toBeTrue();
    }
});

it('never lets a demo model be published: the table refuses it', function (): void {
    $this->seed(CatalogueSeeder::class);

    $model = WheelModel::query()->firstOrFail();

    expect(fn () => DB::table('wheel_models')->where('id', $model->id)->update(['status' => 'published']))
        ->toThrow(QueryException::class);

    // A real record may be published.
    DB::table('wheel_models')->where('id', $model->id)->update(['is_demo' => false, 'status' => 'published']);

    expect(DB::table('wheel_models')->where('id', $model->id)->value('status'))->toBe('published');
});

it('ships photographs of real products only, and draws an honest placeholder for every demo finish', function (): void {
    // Example data carries no maker's photograph: the map names the golden record's wheel and nothing
    // else, each picture the client's own (CLAUDE.md, "Placeholder imagery").
    $map = require database_path('seeders/content/wheel-photos.php');

    expect($map)->not->toBeEmpty();

    foreach ($map as $entry) {
        expect($entry['model'])->toBe(GoldenRecordSeeder::SLUG)
            ->and($entry['credit']['source'])->toBe('Kunde');
    }

    $this->seed(CatalogueSeeder::class);

    expect(photographedFinishes())->toBe(0);

    foreach (WheelFinish::query()->with('wheelModel.brand')->get() as $finish) {
        $manifest = $finish->image_manifest;

        expect(DemoWheels::wellFormed($manifest))->toBeTrue()
            ->and($manifest['kind'])->toBe('placeholder')
            ->and($manifest['fallback'])->toBe('svg')
            ->and($manifest['formats'])->toBe([])
            ->and($manifest['wide']['height'])->toBe(810);

        // The file is there, says what it is, and names the brand the ground's colour stands for.
        $svg = (string) file_get_contents(DemoPlaceholders::dir().'/'.$manifest['name'].'-1080.svg');

        expect($svg)->toContain('Platzhalterbild · kein Produktfoto')
            ->and($svg)->toContain($finish->wheelModel->brand->name)
            ->and($svg)->toContain(CatalogueSeeder::BRAND_COLOURS[$finish->wheelModel->brand->name])
            ->and($svg)->toContain(' Zoll');
    }
});

it('attaches a mapped, rendered cut-out to its finish — the further angle beside it, the rest none', function (): void {
    $photos = DemoWheelFixtures::photoPair('bergsteig-gipfel', 'Hellgrau');
    DemoWheelFixtures::photoMap($this->dir, $photos);
    DemoWheelFixtures::write($this->dir, ['bergsteig-gipfel-front', 'bergsteig-gipfel-angle']);

    $this->seed(CatalogueSeeder::class);

    $finish = WheelFinish::query()->whereHas('wheelModel', fn ($q) => $q->where('slug', 'bergsteig-gipfel'))->where('name_de', 'Hellgrau')->firstOrFail();

    expect(DemoWheels::wellFormed($finish->image_manifest))->toBeTrue()
        ->and($finish->image_manifest['name'])->toBe('bergsteig-gipfel-front')
        ->and($finish->image_manifest['widths'])->toBe([480, 768, 1080])
        ->and($finish->image_manifest['views'])->toHaveCount(1)
        ->and($finish->image_manifest['views'][0]['label'])->toBe('Schräg von vorn')
        // One photograph; every other finish draws its placeholder.
        ->and(photographedFinishes())->toBe(1);
});

it('shows a further angle only beside its front view, never alone', function (): void {
    DemoWheelFixtures::photoMap($this->dir, DemoWheelFixtures::photoPair('bergsteig-gipfel', 'Hellgrau'));
    // The angle rendered, the front view not.
    DemoWheelFixtures::write($this->dir, ['bergsteig-gipfel-angle']);

    $this->seed(CatalogueSeeder::class);

    // No photograph, so the placeholder — and no angle hanging off it.
    $manifest = WheelFinish::query()->whereHas('wheelModel', fn ($q) => $q->where('slug', 'bergsteig-gipfel'))->firstOrFail()->image_manifest;

    expect(photographedFinishes())->toBe(0)
        ->and($manifest['kind'])->toBe('placeholder')
        ->and($manifest)->not->toHaveKey('views');
});

it('drops malformed anchors, a malformed bare frame and a malformed stamp, and keeps the picture', function (): void {
    $slug = 'fixture-wheel';

    $manifest = DemoWheelFixtures::manifest($slug) + [
        // A point outside the frame, and no centre.
        'anchors' => ['pcd' => ['x' => 1.4, 'y' => 0.5, 'r' => 0.1]],
        'bare' => ['name' => 'x'],
        'stamp' => 'KBA 12345',
    ];
    $manifest['wide']['anchors'] = ['centre' => ['x' => 0.5]];

    File::ensureDirectoryExists($this->dir.'/'.$slug);
    File::put($this->dir.'/'.$slug.'/manifest.json', (string) json_encode($manifest));

    $read = DemoWheels::manifest($slug);

    expect($read)->not->toBeNull()
        ->and($read)->not->toHaveKeys(['anchors', 'bare', 'stamp'])
        ->and($read['wide'])->not->toHaveKey('anchors')
        ->and($read['name'])->toBe($slug);

    expect(DemoWheels::anchorsWellFormed(['centre' => ['x' => 0.5, 'y' => 0.5], 'kba' => ['x' => 0.5, 'y' => 0.9, 'w' => 0.07, 'h' => 0.01]]))->toBeTrue()
        ->and(DemoWheels::anchorsWellFormed(['centre' => ['x' => 0.5, 'y' => 0.5], 'valve' => ['x' => 0.5, 'y' => 0.5, 'r' => 0.1]]))->toBeFalse()
        ->and(DemoWheels::anchorsWellFormed(['centre' => ['x' => 0.5, 'y' => 0.5], 'bore' => ['x' => 0.5, 'y' => 0.5, 'r' => 0]]))->toBeFalse()
        ->and(DemoWheels::anchorsWellFormed(['centre' => ['x' => '0.5', 'y' => 0.5]]))->toBeFalse();
});

it('refuses a malformed manifest rather than shipping it', function (): void {
    DemoWheelFixtures::photoMap($this->dir, DemoWheelFixtures::photoPair('bergsteig-gipfel', 'Hellgrau'));

    File::ensureDirectoryExists($this->dir.'/bergsteig-gipfel-front');
    File::put($this->dir.'/bergsteig-gipfel-front/manifest.json', '{"name": "x", "widths": []}');

    $this->seed(CatalogueSeeder::class);

    // Refused: the finish draws its placeholder instead.
    expect(photographedFinishes())->toBe(0);
});

it('is safe to run twice and keeps the first twelve models where the fitment seeds expect them', function (): void {
    $this->seed(CatalogueSeeder::class);
    $before = WheelConfig::query()->orderBy('id')->pluck('sku', 'id')->all();

    $this->seed(CatalogueSeeder::class);
    $after = WheelConfig::query()->orderBy('id')->pluck('sku', 'id')->all();

    expect($after)->toBe($before)
        ->and(WheelModel::query()->count())->toBe(count(array_unique(WheelModel::query()->pluck('slug')->all())));

    // The original twelve, in their original order: their SKUs are the fitment seeds' anchors.
    $first = WheelModel::query()->orderBy('id')->limit(12)->pluck('slug')->all();

    expect($first)->toBe([
        'nordfelge-fjord', 'nordfelge-skagen', 'kraftrad-kr-10', 'nordfelge-aero-7',
        'kraftrad-kr-5', 'stahlwerk-19-kontur-s', 'bergsteig-grat', 'bergsteig-kamm',
        'aventin-mesh-20', 'aventin-mesh-20-r', 'aventin-linea-5', 'stahlwerk-19-profil-7',
    ]);

    // Their SKUs run in sequence from the first, as they always have.
    expect(WheelConfig::query()->orderBy('id')->limit(3)->pluck('sku')->all())->toBe(['RMF-000001', 'RMF-000002', 'RMF-000003']);
});

it('renames a catalogue seeded under any earlier name in place — ids, SKUs and configurations kept', function (): void {
    $this->seed(CatalogueSeeder::class);
    $ids = WheelModel::query()->orderBy('id')->pluck('id', 'slug')->all();
    $skus = WheelConfig::query()->orderBy('id')->pluck('sku', 'id')->all();

    // Back to the names of before: the `Demo …` range and the MOTEC.
    $demo = Brand::query()->create(['name' => 'Demo', 'slug' => 'demo']);
    DB::table('wheel_models')->where('slug', 'nordfelge-fjord')->update(['slug' => 'demo-fuenfspeiche-f-01', 'name' => 'Fünfspeiche F-01', 'brand_id' => $demo->id]);
    DB::table('wheel_models')->where('slug', 'bergsteig-gipfel')->update(['slug' => 'motec-mcr4-ultimate', 'name' => 'MCR4 Ultimate']);
    DB::table('wheel_finishes')->where('name_de', 'Hellgrau')->where('wheel_model_id', $ids['bergsteig-gipfel'])->update(['name_de' => 'Light Grey D5']);

    $this->seed(CatalogueSeeder::class);

    expect(WheelModel::query()->orderBy('id')->pluck('id', 'slug')->all())->toBe($ids)
        ->and(WheelConfig::query()->orderBy('id')->pluck('sku', 'id')->all())->toBe($skus)
        ->and(WheelFinish::query()->where('wheel_model_id', $ids['bergsteig-gipfel'])->pluck('name_de')->all())->toBe(['Hellgrau'])
        // The old brand has nothing left and is retired.
        ->and(Brand::query()->where('name', 'Demo')->exists())->toBeFalse();
});
