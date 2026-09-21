<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\DemoWheels;
use Database\Seeders\CatalogueSeeder;
use Tests\Support\DemoWheelFixtures;

/*
 * The demo catalogue: real ranges with plausible specifications, every row flagged as a
 * demonstration, and a photograph per finish only where one has actually been rendered. Missing
 * imagery fails closed to NULL — a finish never borrows another finish's picture.
 */

beforeEach(function (): void {
    $this->dir = DemoWheelFixtures::emptyDir();
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

it('seeds sixteen to twenty-four published demo models with plausible specifications', function (): void {
    $this->seed(CatalogueSeeder::class);

    $models = WheelModel::query()->with(['finishes', 'configs'])->get();

    expect($models->count())->toBeGreaterThanOrEqual(16)
        ->and($models->count())->toBeLessThanOrEqual(24);

    foreach ($models as $model) {
        expect($model->is_demo)->toBeTrue()
            ->and($model->status->value)->toBe('published')
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

it('names the ranges the brief asks for, in one spelling per brand', function (): void {
    $this->seed(CatalogueSeeder::class);

    $slugs = WheelModel::query()->pluck('slug')->all();

    foreach ([
        'bbs-ci-r', 'bbs-sr', 'oz-racing-ultraleggera', 'oz-racing-superturismo-gt', 'borbet-havanna',
        'borbet-lv5', 'alutec-monstr', 'alutec-grip', 'rotiform-kps', 'rotiform-blq', 'brock-b32',
        'brock-b40', 'mam-a5', 'mam-rs4', 'dezent-tz', 'dezent-tn', 'aez-leipzig',
    ] as $slug) {
        expect($slugs)->toContain($slug);
    }

    $brands = Brand::query()->pluck('name')->all();

    expect($brands)->toContain('BBS', 'OZ Racing', 'BORBET', 'ALUTEC', 'Rotiform', 'Brock', 'MAM', 'Dezent', 'AEZ');

    // Never the same brand twice under two spellings.
    $lower = array_map(static fn (string $n): string => mb_strtolower($n), $brands);
    expect(count($lower))->toBe(count(array_unique($lower)));
});

it('maps every photograph to one existing finish and never one photograph to two models', function (): void {
    $this->seed(CatalogueSeeder::class);

    $photos = DemoWheels::photos();

    expect(count($photos))->toBeGreaterThanOrEqual(16)
        ->and(count($photos))->toBeLessThanOrEqual(24);

    $slugs = [];

    foreach ($photos as $file => $photo) {
        expect($file)->toMatch('/^(unsplash|pexels|commons)-[A-Za-z0-9_-]+\.jpg$/')
            ->and($photo['slug'])->toMatch('/^[a-z0-9][a-z0-9-]*$/')
            ->and($photo['circle'])->toHaveCount(3)
            ->and($photo['circle'][2])->toBeGreaterThan(0)
            ->and($photo['cap'])->toBeGreaterThanOrEqual(0)
            ->and($photo['credit'])->toHaveKeys(['source', 'photographer', 'licence', 'url']);

        $model = WheelModel::query()->where('slug', $photo['model'])->first();

        expect($model)->not->toBeNull("photograph {$file} names a model that is not seeded");
        expect(WheelFinish::query()->where('wheel_model_id', $model?->id)->where('name_de', $photo['finish'])->exists())
            ->toBeTrue("photograph {$file} names a finish {$photo['model']} does not have");

        $slugs[] = $photo['slug'];
    }

    expect(count($slugs))->toBe(count(array_unique($slugs)));

    // One photograph, at most one model — a model may have two finishes pictured, but two models
    // must never share a picture.
    $byFile = array_map(static fn (array $p): string => $p['model'], $photos);
    $models = array_count_values($byFile);

    foreach ($photos as $file => $photo) {
        expect($models[$photo['model']])->toBeLessThanOrEqual(count(array_filter($byFile, static fn (string $m): bool => $m === $photo['model'])));
    }
});

it('attaches a well-formed manifest to every pictured finish and none to the rest', function (): void {
    $photos = DemoWheels::photos();
    DemoWheelFixtures::write($this->dir, array_column($photos, 'slug'));

    $this->seed(CatalogueSeeder::class);

    foreach ($photos as $photo) {
        $finish = WheelFinish::query()
            ->whereHas('wheelModel', fn ($q) => $q->where('slug', $photo['model']))
            ->where('name_de', $photo['finish'])
            ->firstOrFail();

        expect(DemoWheels::wellFormed($finish->image_manifest))->toBeTrue()
            ->and($finish->image_manifest['name'])->toBe($photo['slug'])
            ->and($finish->image_manifest['base'])->toStartWith('/storage/demo/wheels/'.$photo['slug'].'/')
            ->and($finish->image_manifest['fallback'])->toBe('png')
            ->and($finish->image_manifest['widths'])->toBe([480, 768, 1080])
            ->and($finish->image_manifest['wide']['height'])->toBe(810);
    }

    expect(WheelFinish::query()->whereNotNull('image_manifest')->count())->toBe(count($photos));
});

it('leaves a finish whose cut-out has not been rendered at null', function (): void {
    $this->seed(CatalogueSeeder::class);

    expect(WheelFinish::query()->whereNotNull('image_manifest')->exists())->toBeFalse();
});

it('refuses a malformed manifest rather than shipping it', function (): void {
    $photos = DemoWheels::photos();
    $first = array_values($photos)[0];

    File::ensureDirectoryExists($this->dir.'/'.$first['slug']);
    File::put($this->dir.'/'.$first['slug'].'/manifest.json', '{"name": "x", "widths": []}');

    $this->seed(CatalogueSeeder::class);

    expect(WheelFinish::query()->whereNotNull('image_manifest')->exists())->toBeFalse();
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
        'borbet-havanna', 'borbet-lv5', 'oz-racing-superturismo-gt', 'oz-racing-ultraleggera',
        'alutec-monstr', 'alutec-grip', 'bbs-ci-r', 'bbs-sr', 'yido-performance-1',
        'yido-performance-2', 'rotiform-kps', 'rotiform-blq',
    ]);
});
