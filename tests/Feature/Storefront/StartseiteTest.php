<?php

declare(strict_types=1);

use App\Domain\Storefront\Garage;
use App\Domain\Storefront\VehicleContext;
use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\WheelModel;
use App\Support\HeroPreload;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\DemoWheelFixtures;

/**
 * The homepage props: everything on the page is data, and the data has the shape the sections
 * expect. Nothing here is a placeholder.
 */
beforeEach(function (): void {
    // Fitting partners off, as shipped: switched on, the homepage gains their section (the look-back, D-232).
    config(['rimify.features.partners' => false]);
    $this->dir = DemoWheelFixtures::emptyDir();
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

it('ships the hero: the brand\'s photograph with its own values, and the published wheel in it for the numbers section', function (): void {
    $hero = WheelModel::query()->where('status', 'published')->orderBy('id')->firstOrFail();
    DemoWheelFixtures::heroPhotos($this->dir, $hero->slug, ['Schwarz matt' => 'hero-schwarz'], stamp: null);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('hero.title', 'Felgen, die an dein Auto dürfen.')
            ->where('hero.photo.imageManifest.bare.name', 'hero-schwarz-bare')
            // The hero asks the catalogue nothing (the client's #4): its values are the photograph's own, formatted on
            // the server (R-10, ACCURACY §4), and no KBA number — this photograph carries no stamp.
            ->missing('hero.product')
            ->where('hero.photo.facts.specLine', "8,5J\u{00A0}×\u{00A0}18 · ET\u{00A0}35 · LK\u{00A0}5\u{00A0}×\u{00A0}120 · MLB\u{00A0}72,5\u{00A0}mm · Traglast\u{00A0}650\u{00A0}kg")
            ->where('hero.photo.facts.kba', null)
            // The published wheel in the photograph, for the numbers section (H8).
            ->where('photoWheel.slug', $hero->slug)
            ->has('photoWheel.facts.width')
            ->has('photoWheel.config.widthIn')
            ->where('photoWheel.imageManifest.bare.name', 'hero-schwarz-bare')
            ->where('photoWheel.symbolic', false)
            ->has('stats.gutachten')
            ->has('selector.makes')
            ->has('promises', 4)
            // This shop is the test's own (tests/Pest.php): nothing on show is demonstration data.
            ->where('demo', false)
        );
});

it('@kunde-04 renders the whole hero with no wheel published: the photograph, its values, no price, no link', function (): void {
    // The brand's photograph shows a wheel the catalogue does not hold — as after a reset to Shopdaten.
    DemoWheelFixtures::heroPhotos($this->dir, 'borbet-db8gt2', ['Schwarz matt' => 'hero-schwarz', 'Bronze matt' => 'hero-bronze']);

    // Nothing published at all.
    DB::table('wheel_models')->update(['status' => 'draft']);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('hero.title', 'Felgen, die an dein Auto dürfen.')
            // The brand's photograph and its second wheel stand — no hole, no outline (the brief of 05.10.2026, §2).
            ->where('hero.photo.imageManifest.bare.name', 'hero-schwarz-bare')
            ->where('hero.photo.companion.finish', 'Bronze matt')
            ->where('hero.photo.brand', 'Borbet')
            // Its leaders, caption and spec line stand too: the photograph's own values (the client's #4) — only the
            // numbers section, which explains a wheel the shop sells, waits.
            ->has('hero.photo.facts.specLine')
            ->where('hero.photo.facts.kba', '53841')
            ->missing('hero.photo.facts.fromPrice')
            ->where('photoWheel', null)
            ->has('selector.makes')
            ->where('popular', null)
            ->where('shopEmpty', true)
        );
});

// The operator's brief of 05.10.2026, §5: the desktop document preloads the pictures the stage shows — the brand's
// photograph and its second wheel, with the catalogue empty too (before, the preload read the product alone, and an
// empty shop preloaded nothing). The phone's frame stands below the first screen and fetches lazily: no preload.
it('preloads the photograph and its second wheel on the desktop, with or without a catalogue, and nothing on a phone', function (): void {
    DemoWheelFixtures::heroPhotos($this->dir, 'borbet-db8gt2', ['Schwarz matt' => 'hero-schwarz', 'Bronze matt' => 'hero-bronze']);
    DB::table('wheel_models')->update(['status' => 'draft']);

    $html = $this->get('/')->assertOk()->getContent();
    preg_match_all('/<link rel="preload" as="image" fetchpriority="high" type="image\/avif"\s+imagesrcset="([^"]+)"\s+imagesizes="([^"]+)">/', (string) $html, $links);

    expect($links[1])->toHaveCount(2)
        ->and($links[1][0])->toContain('hero-schwarz-bare-')->toEndWith('w')
        ->and($links[1][1])->toContain('hero-bronze-bare-')
        ->and(array_unique($links[2]))->toBe([e(HeroPreload::SIZES)])
        // The scripts follow what paints, and the font comes after the first paint (the fallback faces hold the room).
        ->and((string) $html)->toMatch('/<script type="module" src="[^"]+"[^>]* fetchpriority="low"/')
        ->and((string) $html)->toMatch('/<link rel="modulepreload"[^>]* fetchpriority="low"/')
        ->and((string) $html)->not->toMatch('/<link rel="preload" as="style"[^>]* fetchpriority="low"/')
        ->and((string) $html)->not->toContain('as="font"');

    $phone = $this->withHeaders(['User-Agent' => 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'])
        ->get('/')->assertOk();

    $phone->assertInertia(fn (AssertableInertia $page) => $page->component('Startseite/Mobile'));
    expect((string) $phone->getContent())->not->toContain('rel="preload" as="image"');
});

it('never tells the listing it shows demonstration data: none can be on show', function (): void {
    // A demo row exists — as a draft, the only way it can.
    WheelModel::query()->orderBy('id')->limit(1)->update(['is_demo' => true, 'status' => 'draft']);

    $this->get('/felgen')->assertInertia(fn (AssertableInertia $page) => $page->where('demo', false));
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('demo', false));
});

it('states the values of the wheel in the photograph, never another product\'s', function (): void {
    $photographed = WheelModel::query()->where('status', 'published')->orderBy('id')->firstOrFail();
    $other = WheelModel::query()->where('status', 'published')->orderByDesc('id')->firstOrFail();
    DemoWheelFixtures::heroPhotos($this->dir, $photographed->slug, ['Schwarz matt' => 'hero-schwarz']);
    // An older choice of hero product no longer decides anything: the photograph does.
    Setting::set('hero_product_id', $other->id);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('photoWheel.slug', $photographed->slug));
});

it('@kunde-05 offers one shelf under one heading, at most eight wheels, and no tabs', function (): void {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', fn (string $title): bool => in_array($title, ['Meistgekaufte Felgen', 'Neu im Shop'], true))
        ->missing('popular.tabs')
        ->where('popular.cards', fn ($cards): bool => count($cards) > 0 && count($cards) <= 8)
        ->where('popular.total', null)
    );
});

it('@kunde-05 shows no shelf below four wheels on sale — absent, not empty — and says the shop is empty only when it is', function (): void {
    $published = WheelModel::query()->where('status', 'published')->orderBy('id')->pluck('id');
    expect($published->count())->toBeGreaterThanOrEqual(4);

    // Three left on sale: no shelf.
    WheelModel::query()->whereIn('id', $published->slice(3)->all())->update(['status' => 'draft']);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('popular', null)->where('shopEmpty', false));

    // A test environment reset to an empty shop.
    WheelModel::query()->update(['status' => 'draft']);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('popular', null)->where('shopEmpty', true));
});

it('lists seven size tiles, and links a brand exactly when it has wheels on stock', function (): void {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('sizes', 7)
        ->where('sizes.0.inch', 16)
        ->where('sizes.6.inch', 22)
        // Without a vehicle nothing is claimed to fit.
        ->where('sizes.0.fitting', null)
        ->where('fitmentCount', null)
        ->has('brands')
        // A brand without stock is on the wall greyed and goes nowhere: never a link into an empty listing.
        ->where('brands', fn ($brands) => collect($brands)->every(fn (array $b): bool => $b['count'] > 0
            ? $b['href'] === '/felgen?marke='.$b['slug']
            : $b['count'] === 0 && $b['href'] === null))
    );
});

it('answers for the chosen vehicle in the first paint', function (): void {
    // The BMW 330i G20 (5 × 112), a car the demo documents cover well.
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();

    $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($vehicle->id, true))->encode()])
        ->get('/')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('fitmentCount.count', fn ($n) => is_int($n) && $n > 0)
            ->where('sizes', fn ($sizes) => collect($sizes)->every(fn (array $s): bool => is_int($s['fitting'])))
            ->where('sizes', fn ($sizes) => collect($sizes)->sum('fitting') > 0)
            ->where('popular.title', fn (string $title): bool => in_array($title, ['Meistgekaufte Felgen', 'Neu im Shop'], true))
            ->where('popular.total', fn ($n) => is_int($n) && $n > 0)
            ->has('calculator.prefill.widthIn')
        );
});

it('shows the EU label of a real tyre and at most five answers', function (): void {
    // The seeded tyres are invented and carry no label; one gets its registration and values here.
    DB::table('tyre_variants')->where('available', true)->orderByDesc('id')->limit(1)->update([
        'eprel_id' => '123456', 'eu_fuel_class' => 'C', 'eu_wet_grip_class' => 'A', 'eu_noise_db' => 72, 'eu_noise_class' => 'B',
        'eu_snow_grip' => false, 'eu_ice_grip' => false,
    ]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('komplettrad.tyre.title')
        ->has('komplettrad.tyre.noiseClass')
        ->has('faq')
        ->where('faq', fn ($faq) => count($faq) <= 5)
        ->where('calculator.prefill', null)
        ->where('partners.enabled', false)
    );
});

it('remembers the last wheels opened, most recent first', function (): void {
    $slugs = WheelModel::query()->where('status', 'published')->orderBy('id')->limit(2)->pluck('slug')->all();

    $this->get('/felgen/'.$slugs[0])->assertOk();
    $this->get('/felgen/'.$slugs[1])->assertOk();

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('recentlyViewed.0.slug', $slugs[1])
    );
});

it('keeps the last vehicles chosen in the garage', function (): void {
    // The test client carries no cookie jar between requests; the garage cookie the redirect sets
    // is handed back explicitly, the way a browser would.
    $this->post('/fahrzeug/schluesselnummern', ['hsn' => '0005', 'tsn' => '582'])
        ->assertRedirect('/felgen')
        ->assertCookie(Garage::COOKIE);

    $vehicleId = (int) Vehicle::query()->where('hsn', '0005')->where('tsn', '582')->value('id');

    $this->withCookies([Garage::COOKIE => (new Garage([$vehicleId]))->encode()])
        ->get('/')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('garage', 1)
            ->where('garage.0.short', 'BMW 3er')
            // A car with key numbers is told apart by them: no Feld K range on its chip.
            ->where('garage.0.range', null)
        );
});

// The halves of a car a Gutachten splits read alike by name: each chip carries Feld K's range.
it('gives a car without key numbers its Feld K range in the garage', function (): void {
    $half = static fn (string $eg): int => (int) Vehicle::factory()->create([
        'hsn' => null, 'tsn' => null, 'vsn' => null, 'make' => 'BMW', 'model' => '1er-Reihe', 'variant' => '1K4',
        'type_designation' => '1K4', 'build_from' => null, 'build_to' => null, 'eg_nummer_raw' => $eg,
    ])->id;
    $early = $half('e1*2007/46*0283*00-03');
    $late = $half('e1*2007/46*0283*04-..');
    $nb = "\u{00A0}";

    $this->withCookies([Garage::COOKIE => (new Garage([$late, $early]))->encode()])
        ->get('/')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('garage.0.range', "Feld{$nb}K ab{$nb}*04")
            ->where('garage.1.range', "Feld{$nb}K *00 bis{$nb}*03")
            // With its type: a 1K2 „ab *04“ beside a 1K4 „ab *04“ would read alike (G-07).
            ->where('garage.0.short', 'BMW 1er-Reihe 1K4')
        );
});
