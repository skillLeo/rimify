<?php

declare(strict_types=1);

use App\Models\Brand;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\DemoWheels;
use Database\Seeders\CatalogueSeeder;
use Tests\Support\DemoWheelFixtures;

/*
 * The demo catalogue: neutral demonstration wheels with plausible specifications, the one real
 * product (the MOTEC MCR4 Ultimate) only with the values its own documents verify, every row
 * flagged as a demonstration, and a photograph per finish only where one has actually been
 * rendered. Missing imagery fails closed to NULL — a finish never borrows another finish's picture.
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

it('names only the photographed product for real and every other wheel neutrally, under Demo', function (): void {
    $this->seed(CatalogueSeeder::class);

    $models = WheelModel::query()->with('brand')->orderBy('id')->get();

    expect($models->pluck('slug')->all())->toContain('motec-mcr4-ultimate', 'demo-fuenfspeiche-f-01', 'demo-zehnspeiche-z-02');

    foreach ($models as $position => $model) {
        if ($model->slug === 'motec-mcr4-ultimate') {
            expect($model->brand->name)->toBe('MOTEC')
                ->and($model->name)->toBe('MCR4 Ultimate');

            continue;
        }

        // Named for its spoke pattern and numbered in model order: "Fünfspeiche F-01".
        $number = sprintf('%02d', $position + 1);
        $pattern = match ($model->spoke_count) {
            5 => 'Fünfspeiche F-',
            7 => 'Siebenspeiche S-',
            10 => 'Zehnspeiche Z-',
            20 => 'Vielspeiche V-',
        };

        expect($model->brand->name)->toBe('Demo')
            ->and($model->name)->toBe($pattern.$number)
            ->and($model->slug)->toBe(CatalogueSeeder::slugFor('Demo', $pattern.$number))
            ->and($model->slug)->toMatch('/^demo-(fuenf|sieben|zehn|viel)speiche-[fszv]-\d{2}$/');
    }

    // The live brands: the two the wheels carry and the three whose tyres have a verified label.
    $brands = Brand::query()->orderBy('sort_order')->pluck('name')->all();

    expect($brands)->toBe(['MOTEC', 'Demo', 'Bridgestone', 'Continental', 'Michelin']);

    // Never the same brand twice under two spellings.
    $lower = array_map(static fn (string $n): string => mb_strtolower($n), $brands);
    expect(count($lower))->toBe(count(array_unique($lower)));
});

it('claims no type designation, no rating, no KBA number and no hump for a demo wheel', function (): void {
    $this->seed(CatalogueSeeder::class);

    foreach (WheelModel::query()->with('configs')->get() as $model) {
        expect($model->type_designation)->toBeNull()
            ->and($model->rating)->toBeNull()
            ->and($model->rating_count)->toBe(0);

        if ($model->slug !== 'motec-mcr4-ultimate') {
            foreach ($model->configs as $config) {
                // A designation only a Gutachten can state. These wheels have none, and the
                // product details show a Hump row only for a record that really holds one.
                expect($config->kba_number)->toBeNull()
                    ->and($config->max_load_kg)->toBeNull()
                    ->and($config->hump)->toBeNull()
                    ->and($config->bead_profile)->toBeNull();
            }
        }
    }
});

it('seeds the MCR4 Ultimate only in the Light Grey D5 sizes its ABEs cover, with their own numbers', function (): void {
    $this->seed(CatalogueSeeder::class);

    $model = WheelModel::query()->where('slug', 'motec-mcr4-ultimate')->with(['finishes', 'configs'])->firstOrFail();

    expect($model->finishes->pluck('name_de')->all())->toBe(['Light Grey D5']);

    // Every MCR4 ABE names the hump in its own title — "Sonderräder für Pkw 8½ J x 19 H2" and its
    // siblings (§2.1) — so this is the one model in the range that holds a designation.
    foreach ($model->configs as $config) {
        expect($config->hump)->toBe('H2')
            ->and($config->bead_profile)->toBe('J');
    }

    // docs/reviews/accuracy-research-motec.md §2.3: size, ET, Lochkreis, bore, KBA, Radlast, weight.
    //
    // The 5 × 112 executions carry the 66,5 mm of Motec's catalogue, every dealer and the TÜV
    // Teilegutachten (§2.5.1), which the client settled on for the shop on 2026-09-23. The ABE's
    // own 66,6 mm belongs to the cars it covers without a centring ring and is seeded there — on
    // the fitment row, not on the rim (DemoAccuracyTest, "states a bore on a fitment row only …").
    $expected = [
        '8.0x18.0 ET45 5x112.0' => [66.5, '53811', 620, 7_800],
        '8.5x19.0 ET45 5x112.0' => [66.5, '53810', 620, 8_600],
        '8.0x18.0 ET45 5x108.0' => [72.6, '53811', 620, 7_800],
        '8.0x18.0 ET50 5x114.3' => [72.6, '53811', 620, 7_700],
        '8.0x19.0 ET48 5x112.0' => [66.5, '53809', 620, 8_300],
        '8.5x19.0 ET30 5x112.0' => [66.5, '53810', 620, 8_800],
        '8.5x19.0 ET45 5x114.3' => [72.6, '53810', 620, 8_700],
        '8.5x19.0 ET35 5x120.0' => [72.6, '53810', 640, 9_100],
        '9.5x19.0 ET20 5x112.0' => [66.5, '55070', 690, 10_400],
        '8.5x20.0 ET35 5x120.0' => [72.6, '54949', 730, null],
        '9.5x20.0 ET37 5x114.3' => [72.6, '54950', 760, 10_600],
    ];

    $actual = [];

    foreach ($model->configs as $config) {
        $key = sprintf('%.1fx%.1f ET%d %dx%.1f', $config->width_in, $config->diameter_in, $config->et_mm, $config->bolt_holes, $config->bolt_circle_mm);
        $actual[$key] = [(float) $config->centre_bore_mm, $config->kba_number, $config->max_load_kg, $config->weight_g];
    }

    ksort($expected);
    ksort($actual);

    expect($actual)->toBe($expected);
});

it('labels each tyre only with the values its verified EPREL entry gives', function (): void {
    $this->seed(CatalogueSeeder::class);

    // docs/reviews/accuracy-research-guides-tyres.md, "Corrected seed rows".
    $expected = [
        'Potenza Sport' => [245, 45, 18.0, 100, 'Y', 'C', 'A', 72, 'B', '2402971'],
        'PremiumContact 7' => [245, 45, 18.0, 96, 'Y', 'C', 'A', 71, 'B', '834095'],
        'Pilot Sport 5' => [245, 45, 18.0, 100, 'Y', 'C', 'A', 72, 'B', '909785'],
        'Blizzak LM005' => [245, 45, 18.0, 100, 'V', 'C', 'A', 72, 'B', '381960'],
        'AllSeasonContact 2' => [255, 40, 19.0, 100, 'Y', 'B', 'B', 72, 'B', '1226698'],
        'Pilot Sport 4 S' => [255, 40, 19.0, 100, 'Y', 'D', 'B', 71, 'B', '409928'],
    ];

    $actual = TyreVariant::query()->get()->mapWithKeys(fn (TyreVariant $t): array => [$t->name => [
        (int) $t->width_mm, (int) $t->aspect, (float) $t->diameter_in, (int) $t->load_index, $t->speed_symbol,
        $t->eu_fuel_class, $t->eu_wet_grip_class, $t->eu_noise_db === null ? null : (int) $t->eu_noise_db, $t->eu_noise_class, $t->eprel_id,
    ]])->all();

    expect($actual)->toEqual($expected);

    // A label never travels without its register entry.
    expect(TyreVariant::query()->whereNull('eprel_id')->whereNotNull('eu_fuel_class')->exists())->toBeFalse();
});

it('maps every photograph to one existing finish and never one photograph to two models', function (): void {
    $this->seed(CatalogueSeeder::class);

    $photos = DemoWheels::photos();

    // Only the client's own studio shots of the MCR4 remain; every free-licence photograph showed
    // another maker's wheel on a car and is retired (docs/phase0/ACCURACY.md D1).
    expect($photos)->toHaveCount(3)
        ->and(array_unique(array_column($photos, 'model')))->toBe(['motec-mcr4-ultimate']);

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
        ->where('name_de', 'Light Grey D5')
        ->firstOrFail();

    expect($finish->image_manifest)->toBeNull();
});

it('measures the front shot for the hero and keeps its anchors and stamp through the seed', function (): void {
    $front = DemoWheels::photos()['client-motec-mcr4-ultimate-front.jpg'];

    // docs/phase0/ACCURACY.md §3, in source pixels on the 1080 × 1080 front shot.
    expect($front['anchors'])->toBe([
        'centre' => [539, 534],
        'pcd' => [539, 534, 108],
        'bore' => [540, 537, 70],
        'valve' => [537, 972],
        'kba' => [540, 1013, 88, 18],
    ])->and($front['stamp'])->toBe('53810')
        ->and($front['anchors'])->not->toHaveKey('wheel');

    $anchors = ['centre' => ['x' => 0.4992, 'y' => 0.4681], 'wheel' => ['x' => 0.5, 'y' => 0.4708, 'r' => 0.4086]];
    $manifest = DemoWheelFixtures::manifest($front['slug']) + ['anchors' => $anchors, 'stamp' => '53810'];
    $manifest['bare'] = DemoWheelFixtures::manifest($front['slug'].'-bare');
    unset($manifest['bare']['wide']);
    $manifest['wide']['anchors'] = $anchors;

    File::ensureDirectoryExists($this->dir.'/'.$front['slug']);
    File::put($this->dir.'/'.$front['slug'].'/manifest.json', (string) json_encode($manifest));

    $this->seed(CatalogueSeeder::class);

    $stored = WheelFinish::query()->whereHas('wheelModel', fn ($q) => $q->where('slug', 'motec-mcr4-ultimate'))->firstOrFail()->image_manifest;

    // A JSON column keeps the values, not the key order.
    expect($stored['anchors'])->toEqual($anchors)
        ->and($stored['stamp'])->toBe('53810')
        ->and($stored['bare']['name'])->toBe($front['slug'].'-bare')
        ->and($stored['wide']['anchors'])->toEqual($anchors);
});

it('drops malformed anchors, a malformed bare frame and a malformed stamp, and keeps the picture', function (): void {
    $slug = DemoWheels::photos()['client-motec-mcr4-ultimate-front.jpg']['slug'];

    $manifest = DemoWheelFixtures::manifest($slug) + [
        // A point outside the frame, and no centre.
        'anchors' => ['pcd' => ['x' => 1.4, 'y' => 0.5, 'r' => 0.1]],
        'bare' => ['name' => 'x'],
        'stamp' => 'KBA 53810',
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
        'demo-fuenfspeiche-f-01', 'demo-zehnspeiche-z-02', 'demo-zehnspeiche-z-03', 'demo-siebenspeiche-s-04',
        'demo-fuenfspeiche-f-05', 'demo-fuenfspeiche-f-06', 'demo-zehnspeiche-z-07', 'demo-zehnspeiche-z-08',
        'demo-vielspeiche-v-09', 'demo-vielspeiche-v-10', 'demo-fuenfspeiche-f-11', 'demo-siebenspeiche-s-12',
    ]);

    // Their SKUs run in sequence from the first, as they always have.
    expect(WheelConfig::query()->orderBy('id')->limit(3)->pluck('sku')->all())->toBe(['RMF-000001', 'RMF-000002', 'RMF-000003']);
});
