<?php

declare(strict_types=1);

use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\DemoWheels;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\GoldenRecordSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\DemoWheelFixtures;

/**
 * The hero's wheel is the golden record's Borbet DB8GT2 (the operator's brief of 28.09.2026): a real
 * product with the client's photographs, shown while it is still a draft — its picture and its values,
 * never a price or a link — and never a demo row.
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

    // A person prices one size, publishes the wheel and chooses another hero.
    $size->update(['price_cents' => 24_900, 'stock_qty' => 8]);
    $model->update(['status' => 'published']);
    Setting::set('hero_product_id', 999_999);

    $this->seed(GoldenRecordSeeder::class);

    expect(WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->count())->toBe(1)
        ->and(WheelConfig::query()->where('wheel_model_id', $model->id)->count())->toBe(4)
        ->and($size->refresh()->price_cents)->toBe(24_900)
        ->and($size->stock_qty)->toBe(8)
        ->and($model->refresh()->status->value)->toBe('published')
        ->and(Setting::get('hero_product_id'))->toBe(999_999);
});

it('shows the chosen draft in the hero with its photograph and values, but no price and no link', function (): void {
    $this->seed(GoldenRecordSeeder::class);
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();
    Setting::set('hero_product_id', $model->id);

    // The black front view, with the stamp the photograph shows (KBA 53841, the 18-inch approval).
    $finish = WheelFinish::query()->where('wheel_model_id', $model->id)->where('name_de', 'Schwarz matt')->firstOrFail();
    DemoWheelFixtures::photoMap($this->dir, ['fixture-front.jpg' => [
        'slug' => 'db8gt2-schwarz', 'model' => $model->slug, 'finish' => 'Schwarz matt', 'circle' => [540, 540, 500], 'hub' => null,
        'credit' => ['source' => 'Kunde', 'photographer' => 'Borbet', 'licence' => 'Vom Kunden bereitgestellt', 'url' => ''],
    ]]);
    DemoWheelFixtures::write($this->dir, ['db8gt2-schwarz']);
    $finish->update(['image_manifest' => [...(array) DemoWheels::manifest('db8gt2-schwarz'), 'stamp' => '53841']]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('hero.product.slug', GoldenRecordSeeder::SLUG)
        ->where('hero.product.finish', 'Schwarz matt')
        ->where('hero.product.symbolic', false)
        ->where('hero.product.published', false)
        // The configuration the stamp proves, stated from its record, never typed in the page.
        ->where('hero.product.facts.kba', '53841')
        ->where('hero.product.config.diameterIn', 18)
        ->where('hero.product.facts.centreBore', "72,5\u{00A0}mm")
    );
});

it('says published only when the wheel is in the shop at a price', function (): void {
    $this->seed(GoldenRecordSeeder::class);
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();
    Setting::set('hero_product_id', $model->id);
    $model->update(['status' => 'published']);

    // Published at zero is still not for sale.
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.product.published', false));

    WheelConfig::query()->where('wheel_model_id', $model->id)->update(['price_cents' => 24_900]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.product.published', true));
});

it('never shows a chosen demo or archived model in the hero', function (string $case): void {
    $this->seed(GoldenRecordSeeder::class);
    $model = WheelModel::query()->where('slug', GoldenRecordSeeder::SLUG)->firstOrFail();
    Setting::set('hero_product_id', $model->id);

    // A demo row can only be a draft (the table refuses a published one).
    DB::table('wheel_models')->where('id', $model->id)->update($case === 'demo' ? ['is_demo' => true] : ['status' => 'archived']);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.product', null));
})->with(['demo', 'archived']);

it('stores a six-spoke wheel', function (): void {
    $this->seed(GoldenRecordSeeder::class);

    expect(DB::table('wheel_models')->where('slug', GoldenRecordSeeder::SLUG)->value('spoke_count'))->toBe(6);
});
