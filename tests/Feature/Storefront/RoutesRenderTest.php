<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\Order;
use App\Models\WheelModel;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;

/**
 * Every route opens, renders its Inertia page, and carries real data.
 *
 * This is the gate the project kept failing: six sessions produced an excellent engine and not one
 * page a human could look at. A suite that asserts routes RENDER — not merely that a controller
 * returns 200 — is what stops that happening again, because a page whose component name is wrong
 * or whose props are empty passes an HTTP-status check and fails this one.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

it('renders the homepage with real catalogue cards', function (): void {
    $this->get('/')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Startseite/Desktop')
                ->has('popular.cards', 8)
                ->has('selector.makes')
                ->has('brands')
                // Without these two the card draws the same grey five-spoke wheel twelve times.
                ->has('popular.cards.0.art.finish')
                ->has('popular.cards.0.art.spokes')
                // No vehicle, no claim: the catalogue row carries no fitment line at all.
                ->where('popular.cards.0.fitment', null)
        );
});

it('renders the phone homepage for a phone and the desktop one for everything else', function (): void {
    $mobile = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

    // The desktop request first: `withHeaders()` keeps its headers for the rest of the test.
    $this->get('/')
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Startseite/Desktop')->where('isMobile', false));

    $this->withHeaders(['User-Agent' => $mobile])
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Startseite/Mobile')->where('isMobile', true));
});

it('ships no route table to the browser: no Ziggy, no admin or tooling paths in a storefront page', function (): void {
    $response = $this->get('/')->assertOk();

    $response->assertInertia(fn (AssertableInertia $page) => $page->missing('ziggy'));

    expect($response->getContent())
        ->not->toContain('const Ziggy')
        ->not->toContain('/admin/benachrichtigungen')
        ->not->toContain('telescope');
});

it('puts the page component\'s own stylesheet in the head, so the server-rendered page never paints unstyled', function (): void {
    $html = (string) $this->get('/')->assertOk()->getContent();
    $head = substr($html, 0, (int) strpos($html, '</head>'));

    // app.css plus at least the page's and its layout's own stylesheets — written into the document, with the nonce
    // (InlineStyles; the operator's brief of 05.10.2026, §5: the first paint waits for the HTML alone).
    expect(substr_count($head, '<style nonce="'))->toBeGreaterThanOrEqual(3)
        // Each one's link stays for the bundle to find, disabled: fetched by nobody, applied by nobody …
        ->and(preg_match_all('/<link rel="stylesheet" href="[^"]+"[^>]*>/', $head, $links))->toBeGreaterThanOrEqual(3)
        ->and(array_filter($links[0], static fn (string $link): bool => ! str_contains($link, ' disabled')))->toBe([])
        // … and nothing preloads a stylesheet the document already holds.
        ->and($head)->not->toContain('as="style"');
})->skip(fn (): bool => ! is_file(public_path('build/manifest.json')), 'needs the production build');

// D-178: the phone homepage opened part-way down renders every section from its first frame; nothing else asks.
it('decides on the phone homepage alone, before it paints, whether the sections below may skip their layout', function (): void {
    $desktop = (string) $this->get('/')->assertOk()->getContent();
    $phone = (string) $this->withHeaders(['User-Agent' => 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'])
        ->get('/')->assertOk()->getContent();
    $phoneHead = substr($phone, 0, (int) strpos($phone, '</head>'));

    expect($phoneHead)->toContain("classList.add('cv-off')")
        ->toMatch('/<script nonce="[^"]+">\s*\(function \(\) \{\s*try \{\s*var nav = performance/')
        ->and($desktop)->not->toContain('cv-off');
});

// D-177: a desktop page painted half-built grew its footer upwards at the foot of a short page (CLS 0,024 at 1440).
it('lets a desktop storefront page paint once its footer is parsed, and the phone at once', function (): void {
    $desktop = (string) $this->get('/rechtliches/impressum')->assertOk()->getContent();
    $phone = (string) $this->withHeaders(['User-Agent' => 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'])
        ->get('/rechtliches/impressum')->assertOk()->getContent();

    expect($desktop)->toContain('<link rel="expect" href="#seitenende" blocking="render">')
        ->and($phone)->not->toContain('rel="expect"');
});

it('ships the header mode and the menus on every page', function (): void {
    $this->get('/faq')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                // R-08: decided on the server, shipped in the first response.
                ->where('headerMode', 'PLAIN')
                ->where('vehicle', null)
                ->has('menus.header')
                ->has('menus.mobile_bottom', 5)
        );
});

it('renders the storefront routes', function (string $path, string $component): void {
    $this->get($path)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component($component));
})->with([
    'selector' => ['/felgen-suchen', 'FelgenSuchen/Index'],
    'listing' => ['/felgen', 'Felgen/Index'],
    'check' => ['/rimify-check', 'Check/Index'],
    'check result' => ['/rimify-check/ergebnis/abc123', 'CheckErgebnis/Index'],
    'basket' => ['/warenkorb', 'Warenkorb/Index'],
    'checkout' => ['/kasse', 'Kasse/Index'],
    'faq' => ['/faq', 'Faq/Index'],
    'contact' => ['/kontakt', 'Kontakt/Index'],
    'legal' => ['/rechtliches', 'Rechtliches/Index'],
    'legal tab' => ['/rechtliches/datenschutz', 'Rechtliches/Index'],
    'admin login' => ['/admin/anmelden', 'Admin/Anmelden/Index'],
]);

it('drills the selector make by make', function (): void {
    $this->get('/felgen-suchen?marke=BMW')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('selectedMake', 'BMW')
                ->has('models')
                ->where('variants', [])
        );

    $this->get('/felgen-suchen?marke=BMW&modell=3er')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('selectedModel', '3er')
                ->has('variants')
                // The build window is on the label because it is often the only thing telling two
                // otherwise identical rows apart — and it is what the legal answer turns on.
                ->has('variants.0.buildWindow')
                ->has('variants.0.keyNumbers')
        );
});

it('renders a product page with its finishes and configurations', function (): void {
    $model = WheelModel::query()->firstOrFail();

    $this->get('/felgen/'.$model->slug)
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Produkt/Index')
                ->where('product.slug', $model->slug)
                ->has('finishes')
                ->has('configs')
                ->has('configs.0.sizeLabel')
                ->where('hasVehicle', false)
        );
});

it('renders an order with its frozen verdict per line', function (): void {
    $order = Order::query()->firstOrFail();

    // Written by a seeder, nobody behind it: it opens by number (D-238).
    expect($order->seeded())->toBeTrue();
    $this->get('/bestellung/'.$order->order_number)->assertOk();

    // One that came through the checkout never does: its signed link, the browser that placed it or its account.
    $this->get('/bestellung/'.Order::factory()->create()->order_number)->assertNotFound();

    $this->get(URL::signedRoute('bestellung.show', ['order' => $order->order_number]))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Bestellung/Index')
                ->where('order.number', $order->order_number)
                ->has('lines')
                // The snapshot, not a fresh computation: this page is the customer's receipt for
                // what they were told on the day.
                ->has('lines.0.verdict.status')
                ->has('lines.0.verdict.documentRevision')
        );
});

it('renders the admin panel for a signed-in staff account', function (string $path, string $component): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')
        ->get($path)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component($component));
})->with([
    'uebersicht' => ['/admin', 'Admin/Uebersicht/Index'],
    'gutachten' => ['/admin/gutachten', 'Admin/Gutachten/Index'],
    'rollen' => ['/admin/rollen', 'Admin/Rollen/Index'],
]);

it('sends the admin panel to the login screen when nobody is signed in', function (): void {
    $this->get('/admin')->assertRedirect('/admin/anmelden');
});

it('renders a designed 404 rather than a framework page', function (): void {
    $this->get('/gibt-es-nicht')
        ->assertNotFound()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Fehler/Index')
                ->where('status', 404)
        );
});

it('fills the Übersicht from real queries', function (): void {
    $owner = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $gutachten = AdminUser::query()->where('email', 'compliance-editor@rimify.test')->firstOrFail();

    // The owner's figures are the shop's sales, every one computed, none of them a placeholder.
    $this->actingAs($owner, 'admin')
        ->get('/admin')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Admin/Uebersicht/Index')
                ->where('variant', 'verkauf')
                ->has('kpis', 4)
                ->where('kpis.0.key', 'umsatz')
                ->where('kpis.3.key', 'offen')
        );

    // The Gutachten role's figures are its documents: the seed plants one deliberate
    // entry-requirement disagreement, and the Übersicht counts it.
    $this->actingAs($gutachten, 'admin')
        ->get('/admin')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('variant', 'gutachten')
                ->where('kpis.1.key', 'conflicts')
                // A figure goes out as a number; the page writes it (num.ts).
                ->where('kpis.1.value', 1)
        );
});
