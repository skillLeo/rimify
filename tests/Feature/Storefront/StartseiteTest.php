<?php

declare(strict_types=1);

use App\Domain\Storefront\Garage;
use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\WheelModel;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * The homepage props: everything on the page is data, and the data has the shape the sections
 * expect. Nothing here is a placeholder.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

it('ships the hero with a real product and its own values', function (): void {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('hero.title', 'Felgen, die an dein Auto dürfen.')
            ->has('hero.product.slug')
            ->has('hero.product.spec', 4)
            ->where('hero.product.spec.0.label', 'Felgengröße')
            ->has('hero.stats.gutachten')
            ->has('selector.makes')
            ->has('promises', 4)
        );
});

it('shows the admin-chosen hero product', function (): void {
    $model = WheelModel::query()->where('status', 'published')->orderByDesc('id')->firstOrFail();
    Setting::set('hero_product_id', $model->id);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.product.slug', $model->slug));
});

it('offers three real orders of the catalogue and never a bestseller claim', function (): void {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', 'Beliebte Felgen')
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

it('lists seven size tiles and only brands with stock', function (): void {
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('sizes', 7)
        ->where('sizes.0.inch', 16)
        ->where('sizes.6.inch', 22)
        ->has('brands')
        ->where('brands', fn ($brands) => collect($brands)->every(fn (array $b): bool => $b['href'] === '/felgen?marke='.$b['slug']))
    );
});

it('shows the EU label of a real tyre and at most five answers', function (): void {
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
        );
});
