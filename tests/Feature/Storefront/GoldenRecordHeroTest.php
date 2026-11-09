<?php

declare(strict_types=1);

use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\GoldenRecordSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\DemoWheelFixtures;

/**
 * The hero's wheel is the golden record's Borbet DB8GT2 (the operator's brief of 28.09.2026): the client's photographs
 * are the brand's (App\Support\HeroPhotos) and stand in every state; the wheel's values go on them only once it is
 * published (the operator's brief of 05.10.2026, §2) — never a price, never a link, never a demo row.
 */
beforeEach(function (): void {
    $this->dir = DemoWheelFixtures::emptyDir();
    // The shop the storefront tests share (tests/Pest.php): catalogue, reference data, approvals.
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

it('seeds the DB8GT2 as a real draft with the documents\' values, and names it the hero', function (): void {
    Setting::query()->whereKey('hero_product_id')->delete();

    $this->seed(GoldenRecordSeeder::class);

    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();

    expect($model->is_demo)->toBeFalse()
        ->and($model->status->value)->toBe('draft')
        ->and($model->spoke_count)->toBe(6)
        ->and(Setting::get('hero_product_id'))->toBe($model->id)
        ->and($model->finishes()->pluck('name_de')->sort()->values()->all())->toBe(['Bronze matt', 'Schwarz matt']);

    $sizes = WheelConfig::query()->where('wheel_model_id', $model->id)->get();

    expect($sizes)->toHaveCount(4);

    foreach ($sizes as $size) {
        $eighteen = (float) $size->diameter_in === 18.0;

        // Gutachten 366-0350-21-WIRD/N1 p. 1 (18″) and ABE 55255 Anlage 19 p. 1 (19″).
        expect((float) $size->width_in)->toBe(8.5)
            ->and($size->et_mm)->toBe(35)
            ->and($size->bolt_holes)->toBe(5)
            ->and((float) $size->bolt_circle_mm)->toBe(120.0)
            ->and((float) $size->centre_bore_mm)->toBe($eighteen ? 72.5 : 72.6)
            ->and($size->max_load_kg)->toBe($eighteen ? 650 : 700)
            ->and($size->kba_number)->toBe($eighteen ? '53841' : '55255')
            // No price came with it, and none is made up.
            ->and($size->price_cents)->toBe(0);
    }
});

it('is idempotent and never undoes what a person set', function (): void {
    $this->seed(GoldenRecordSeeder::class);
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();
    $size = WheelConfig::query()->where('wheel_model_id', $model->id)->orderBy('id')->firstOrFail();

    // A person prices one size, publishes the wheel and chooses another real wheel as the hero.
    $size->update(['price_cents' => 24_900, 'stock_qty' => 8]);
    $model->update(['status' => 'published']);
    $other = WheelModel::factory()->create(['is_demo' => false]);
    Setting::set('hero_product_id', $other->id);

    $this->seed(GoldenRecordSeeder::class);

    expect(WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->count())->toBe(1)
        ->and(WheelConfig::query()->where('wheel_model_id', $model->id)->count())->toBe(4)
        ->and($size->refresh()->price_cents)->toBe(24_900)
        ->and($size->stock_qty)->toBe(8)
        ->and($model->refresh()->status->value)->toBe('published')
        ->and(Setting::get('hero_product_id'))->toBe($other->id);
});

it('takes the hero back from a choice that is no real wheel — a demo model, one that is gone (D-089)', function (): void {
    $this->seed(GoldenRecordSeeder::class);
    $golden = (int) WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->value('id');

    foreach ([WheelModel::factory()->draft()->create(['is_demo' => true])->id, 999_999] as $noChoice) {
        Setting::set('hero_product_id', $noChoice);
        $this->seed(GoldenRecordSeeder::class);

        expect((int) Setting::get('hero_product_id'))->toBe($golden);
    }
});

// The operator's decision of 09.11.2026 (D-444): the numbers section (PROTECTED.md P4) explains the photograph's own wheel with the
// photograph's own values — fixed assets, like the hero — and never disappears because a product changed. On the preview it waited
// after the client archived the DB8GT2 in the photograph (08.11.2026, 12:05 UTC).
it('stands the numbers section on the photograph in every state of the catalogue: draft, published, demo, archived, an empty shop', function (string $state): void {
    if ($state !== 'empty') {
        $this->seed(GoldenRecordSeeder::class);
        $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();
        // The seeder leaves it a draft.
        $change = match ($state) {
            'published' => ['status' => 'published'],
            'demo' => ['is_demo' => true],
            'archived' => ['status' => 'archived'],
            default => [],
        };

        if ($change !== []) {
            DB::table('wheel_models')->where('id', $model->id)->update($change);
        }
    }

    DemoWheelFixtures::heroPhotos($this->dir, GoldenRecordSeeder::SLUG, ['Schwarz matt' => 'db8gt2-schwarz', 'Bronze matt' => 'db8gt2-bronze']);

    $this->get('/')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('photoWheel.brand', 'Borbet')
        ->where('photoWheel.name', 'DB8GT2')
        ->where('photoWheel.finish', 'Schwarz matt')
        ->where('photoWheel.imageManifest.bare.name', 'db8gt2-schwarz-bare')
        ->where('photoWheel.facts.kba', '53841')
        ->where('photoWheel.facts.centreBore', "72,5\u{00A0}mm")
        // The hero's own values, the same in both: one photograph, one wheel.
        ->where('photoWheel.facts', fn ($facts): bool => collect($facts)->all() === collect($page->toArray()['props']['hero']['photo']['facts'])->all())
        // Never a product: no price, no link, nothing the catalogue holds.
        ->missing('photoWheel.slug')
        ->missing('photoWheel.fromPrice')
        ->missing('photoWheel.published'));
})->with(['draft', 'published', 'demo', 'archived', 'empty']);

it('stands the photograph with its values where the catalogue does not hold the wheel in it (the client\'s #4)', function (): void {
    // An empty shop: the photograph is the brand's and stays, with the values its document states.
    DemoWheelFixtures::heroPhotos($this->dir, GoldenRecordSeeder::SLUG, ['Schwarz matt' => 'db8gt2-schwarz', 'Bronze matt' => 'db8gt2-bronze']);

    $this->get('/')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('hero.photo.finish', 'Schwarz matt')
        ->where('hero.photo.companion.finish', 'Bronze matt')
        ->has('hero.photo.facts.specLine')
        // The numbers section stands with it (D-444); the turning band shows its illustration (D-346).
        ->where('photoWheel.facts.kba', '53841')
        ->where('komplettrad.wheel', null));
});

it('gives the hero its second wheel — the other photographed finish — and none while only one is photographed', function (): void {
    $this->seed(GoldenRecordSeeder::class);
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();

    // One finish photographed: one wheel.
    DemoWheelFixtures::heroPhotos($this->dir, $model->slug, ['Schwarz matt' => 'db8gt2-schwarz']);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.photo.companion', null));

    // Both: the second stands behind the first, catalogue or not.
    DemoWheelFixtures::heroPhotos($this->dir, $model->slug, ['Schwarz matt' => 'db8gt2-schwarz', 'Bronze matt' => 'db8gt2-bronze']);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('hero.photo.finish', 'Schwarz matt')
        ->where('hero.photo.companion.finish', 'Bronze matt')
        ->where('hero.photo.companion.imageManifest.bare.name', 'db8gt2-bronze-bare'));

    // A bronze cut-out without its shadowless frame cannot stand on the floor beside the black one: one wheel again.
    $bronze = $this->dir.DIRECTORY_SEPARATOR.'db8gt2-bronze'.DIRECTORY_SEPARATOR.'manifest.json';
    $plain = json_decode((string) file_get_contents($bronze), true);
    unset($plain['bare']);
    file_put_contents($bronze, (string) json_encode($plain));

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.photo.companion', null));
});

it('leads with the photograph chosen in Inhalte, and with the default where the choice names none', function (): void {
    $this->seed(GoldenRecordSeeder::class);
    DemoWheelFixtures::heroPhotos($this->dir, GoldenRecordSeeder::SLUG, ['Schwarz matt' => 'db8gt2-schwarz', 'Bronze matt' => 'db8gt2-bronze']);
    $hero = DB::table('page_blocks')->join('pages', 'pages.id', '=', 'page_blocks.page_id')->where('pages.slug', 'startseite')->where('page_blocks.type', 'hero');
    $choose = static function (?string $slug) use ($hero): void {
        $block = (clone $hero)->select('page_blocks.id', 'page_blocks.data')->first();
        $data = json_decode((string) $block->data, true);
        $data['foto'] = $slug;
        DB::table('page_blocks')->where('id', $block->id)->update(['data' => json_encode($data)]);
    };

    $choose('db8gt2-bronze');
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.photo.finish', 'Bronze matt')->where('hero.photo.companion.finish', 'Schwarz matt'));

    // A choice the release no longer ships: the first photograph, never none.
    $choose('no-such-photo');
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.photo.finish', 'Schwarz matt'));
});

it('turns the illustration in the dark band again, as before #9 — even where the hero wheel has an opened cut-out (the client, 29.10.)', function (): void {
    $this->seed(GoldenRecordSeeder::class);
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();
    $model->update(['status' => 'published']);

    // The client's reply to #9: „Just return the old picture. We currently don't have any good pictures.“ The opened
    // cut-out that #9 turned is there — and the band still shows the illustration it showed before (D-346).
    DemoWheelFixtures::heroPhotos($this->dir, $model->slug, ['Schwarz matt' => 'db8gt2-schwarz', 'Bronze matt' => 'db8gt2-bronze'], open: true);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        // The precondition: the photographs the band used to take are on record.
        ->where('hero.photo.companion.finish', 'Bronze matt')
        ->where('komplettrad.wheel', null));
});

it('never puts a demo or archived model\'s values on the photograph, which stays', function (string $case): void {
    $this->seed(GoldenRecordSeeder::class);
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();
    DemoWheelFixtures::heroPhotos($this->dir, $model->slug, ['Schwarz matt' => 'db8gt2-schwarz']);

    // A demo row can only be a draft (the table refuses a published one).
    DB::table('wheel_models')->where('id', $model->id)->update($case === 'demo' ? ['is_demo' => true] : ['status' => 'archived']);

    // The photograph's own values, never the model's (D-444): no catalogue row is read.
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->missing('photoWheel.slug')->where('photoWheel.facts.kba', '53841')->where('hero.photo.finish', 'Schwarz matt'));
})->with(['demo', 'archived']);

it('stores a six-spoke wheel', function (): void {
    $this->seed(GoldenRecordSeeder::class);

    expect(DB::table('wheel_models')->where('slug', GoldenRecordSeeder::SLUG)->value('spoke_count'))->toBe(6);
});
