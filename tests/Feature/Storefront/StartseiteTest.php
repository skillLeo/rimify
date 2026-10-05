<?php

declare(strict_types=1);

use App\Domain\Storefront\Garage;
use App\Domain\Storefront\VehicleContext;
use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\WheelModel;
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
    $this->dir = DemoWheelFixtures::emptyDir();
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

it('ships the hero: the brand\'s photograph, and the values of the wheel in it while that one is published', function (): void {
    $hero = WheelModel::query()->where('status', 'published')->orderBy('id')->firstOrFail();
    DemoWheelFixtures::heroPhotos($this->dir, $hero->slug, ['Schwarz matt' => 'hero-schwarz'], stamp: null);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('hero.title', 'Felgen, die an dein Auto dürfen.')
            ->where('hero.photo.imageManifest.bare.name', 'hero-schwarz-bare')
            ->where('hero.product.slug', $hero->slug)
            // The configuration's own values, formatted on the server (R-10, ACCURACY §4).
            ->has('hero.product.facts.width')
            ->has('hero.product.facts.diameter')
            ->has('hero.product.facts.et')
            ->has('hero.product.facts.boltPattern')
            ->has('hero.product.facts.centreBore')
            ->has('hero.product.facts.specLine')
            ->has('hero.product.config.widthIn')
            // The photograph's own cut-out, and no KBA number: this photograph carries no stamp.
            ->where('hero.product.imageManifest.bare.name', 'hero-schwarz-bare')
            ->where('hero.product.symbolic', false)
            ->where('hero.product.facts.kba', null)
            ->has('hero.stats.gutachten')
            ->has('selector.makes')
            ->has('promises', 4)
            // This shop is the test's own (tests/Pest.php): nothing on show is demonstration data.
            ->where('demo', false)
        );
});

it('renders the homepage with its hero photograph when no wheel is published, and only the values go', function (): void {
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
            // No leaders, no caption, no spec line: nothing is published to state.
            ->where('hero.product', null)
            ->has('selector.makes')
            ->where('popular.empty', true)
        );
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

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.product.slug', $photographed->slug));
});

it('offers three real orders of the catalogue and never a bestseller claim', function (): void {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', 'Felgen aus dem Sortiment')
        ->has('popular.tabs', 3)
        ->where('popular.active', 'beliebt')
        ->where('popular.total', null)
    );

    $this->get('/?beliebt=bis200')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.active', 'bis200')
        ->where('popular.cards', fn ($cards) => collect($cards)->every(fn (array $card): bool => $card['fromPriceCents'] <= 20_000))
    );

    $this->get('/?beliebt=unsinn')->assertInertia(fn (AssertableInertia $page) => $page->where('popular.active', 'beliebt'));
});

it('says the shop has no wheel at all only when it has none — not when one tab is empty', function (): void {
    // A tab with nothing in it is not an empty shop: the other tabs still hold wheels.
    $this->get('/?beliebt=bis200')->assertInertia(fn (AssertableInertia $page) => $page->where('popular.empty', false));

    // A test environment reset to an empty shop: nothing published, so every tab is empty and the page says so once.
    WheelModel::query()->update(['status' => 'draft']);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.cards', [])
        ->where('popular.empty', true)
    );
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
            ->where('popular.title', null)
            ->where('popular.total', fn ($n) => is_int($n) && $n > 0)
            ->has('calculator.prefill.widthIn')
        );
});

it('shows the EU label of a real tyre and at most five answers', function (): void {
    // The seeded tyres are invented and carry no label; one gets its registration and values here.
    DB::table('tyre_variants')->where('stock_qty', '>', 0)->orderByDesc('id')->limit(1)->update([
        'eprel_id' => '123456', 'eu_fuel_class' => 'C', 'eu_wet_grip_class' => 'A', 'eu_noise_db' => 72, 'eu_noise_class' => 'B',
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
