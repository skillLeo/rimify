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
        'brock-b40', 'mam-a5', 'mam-rs4', 'dezent-tz', 'dezent-tn', 'aez-leipzig', 'motec-mcr4-ultimate',
    ] as $slug) {
        expect($slugs)->toContain($slug);
    }

    $brands = Brand::query()->pluck('name')->all();

    expect($brands)->toContain('BBS', 'OZ Racing', 'BORBET', 'ALUTEC', 'Rotiform', 'Brock', 'MAM', 'Dezent', 'AEZ', 'MOTEC');

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
        expect($file)->toMatch('/^(unsplash|pexels|commons|client)-[A-Za-z0-9_-]+\.jpg$/')
            ->and($photo['slug'])->toMatch('/^[a-z0-9][a-z0-9-]*$/')
            ->and($photo['credit'])->toHaveKeys(['source', 'photographer', 'licence', 'url']);

        // A client studio shot lives in the repository with its mask; a free-licence photograph
        // is cut along its measured circle.
        if (DemoWheels::isClientPhoto($file)) {
            expect(DemoWheels::clientPhotosDir().'/'.$file)->toBeFile()
                ->and(DemoWheels::clientPhotosDir().'/'.($photo['mask'] ?? ''))->toBeFile()
                ->and($photo['hub'])->toBeNull()
                ->and($photo['credit']['source'])->toBe('Kunde');
        } else {
            expect($photo['circle'] ?? null)->toHaveCount(3)
                ->and($photo['circle'][2] ?? 0)->toBeGreaterThan(0);
        }

        // A further angle belongs to a finish whose front view is in the map too.
        if (isset($photo['view'])) {
            $fronts = array_filter($photos, static fn (array $p): bool => ! isset($p['view']) && $p['model'] === $photo['model'] && $p['finish'] === $photo['finish']);

            expect($fronts)->toHaveCount(1, "{$file} is a view of a finish with no front view");
        }

        // The hub, where there is a mark to paint over, lies inside the rim and is smaller than it.
        if ($photo['hub'] !== null && isset($photo['circle'])) {
            [$cx, $cy, $r] = $photo['circle'];
            [$hx, $hy, $hr] = $photo['hub'];

            expect($hr)->toBeGreaterThan(0)
                ->and($hr)->toBeLessThan($r * 0.3)
                ->and(hypot($hx - $cx, $hy - $cy) + $hr)->toBeLessThan($r * 0.6);
        }

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

    $fronts = array_filter($photos, static fn (array $p): bool => ! isset($p['view']));

    foreach ($fronts as $photo) {
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

        // Further angles ride along as labelled thumbnails, in map order, each one a picture.
        $expected = array_values(array_filter($photos, static fn (array $p): bool => isset($p['view']) && $p['model'] === $photo['model'] && $p['finish'] === $photo['finish']));
        $views = $finish->image_manifest['views'] ?? [];

        expect($views)->toHaveCount(count($expected));

        foreach ($expected as $i => $view) {
            expect(DemoWheels::wellFormed($views[$i]))->toBeTrue()
                ->and($views[$i]['name'])->toBe($view['slug'])
                ->and($views[$i]['label'])->toBe($view['view'])
                ->and($views[$i])->not->toHaveKey('wide');
        }
    }

    expect(WheelFinish::query()->whereNotNull('image_manifest')->count())->toBe(count($fronts));
});

it('shows a further angle only beside its front view, never alone', function (): void {
    $photos = DemoWheels::photos();
    // Every cut-out rendered except the MCR4's front view.
    DemoWheelFixtures::write($this->dir, array_values(array_filter(array_column($photos, 'slug'), static fn (string $s): bool => $s !== 'motec-mcr4-ultimate-light-grey')));

    $this->seed(CatalogueSeeder::class);

    $finish = WheelFinish::query()
        ->whereHas('wheelModel', fn ($q) => $q->where('slug', 'motec-mcr4-ultimate'))
        ->where('name_de', 'Light Grey')
        ->firstOrFail();

    expect($finish->image_manifest)->toBeNull();
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
