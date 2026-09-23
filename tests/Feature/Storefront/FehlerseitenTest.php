<?php

declare(strict_types=1);

use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;

/**
 * The failure states.
 *
 * Six statuses, one design, and three ways forward on every one of them (R-09). The German
 * headings and the three routes themselves are asserted in the component's own test
 * (resources/js/Pages/Fehler/Index.test.ts) — they live in the Vue file and never reach the HTML
 * without SSR. What this suite holds is everything the server decides: WHICH page answers, what it
 * is given, and that the page which has to survive a release window really does survive one.
 */
function wf3Route(string $path, int $status): string
{
    Route::middleware('web')->get($path, static fn () => abort($status));

    return $path;
}

it('answers every designed status with the designed page', function (int $status): void {
    $this->get(wf3Route('/__fehler/'.$status, $status))
        ->assertStatus($status)
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Fehler/Index')
                ->where('status', $status)
                ->has('isMobile')
        );
})->with([403, 404, 419, 429, 500]);

it('answers an unknown path with the designed 404, not a framework page', function (): void {
    $this->get('/gibt-es-nicht')
        ->assertNotFound()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Fehler/Index')->where('status', 404));
});

/*
 * The 419 is the one the shop kept getting wrong: it was told "diese Seite gibt es nicht mehr" to
 * someone whose session had merely expired, and it arrived with no chrome at all, because the CSRF
 * check runs BEFORE the middleware that shares the header, the basket and the contact details.
 */
it('keeps the header, the basket and the contact details on a 419', function (): void {
    $this->seed(ContentSeeder::class);

    $this->get(wf3Route('/__fehler/chrome', 419))
        ->assertStatus(419)
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Fehler/Index')
                ->where('status', 419)
                // R-08: the header mode is decided on the server and shipped in the first response.
                ->where('headerMode', 'PLAIN')
                ->has('menus.header')
                ->where('cartCount', 0)
                ->where('contact.email', config('rimify.contact.email'))
                ->where('contact.hours', config('rimify.contact.hours'))
        );
});

it('writes a fresh XSRF-TOKEN beside the 419, so the second attempt can succeed', function (): void {
    // The page tells the customer to send the form again. The CSRF middleware never reaches its
    // own response phase when it is the middleware that threw, so without this the browser would
    // still hold the token that was just refused and the retry would fail exactly like the first.
    $this->get(wf3Route('/__fehler/token', 419))
        ->assertStatus(419)
        ->assertCookie('XSRF-TOKEN');
});

it('carries the security headers on a failure that is thrown before the route runs', function (): void {
    $this->get(wf3Route('/__fehler/headers', 419))
        ->assertStatus(419)
        ->assertHeader('Content-Security-Policy')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
});

it('passes the wait the throttler named, and never a figure of its own', function (): void {
    Route::middleware(['web', 'throttle:1,1'])->get('/__fehler/limit', static fn () => response('ok'));

    $this->get('/__fehler/limit')->assertOk();

    $this->get('/__fehler/limit')
        ->assertStatus(429)
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Fehler/Index')
                ->where('status', 429)
                ->where('retryAfter', 60)
        );
});

it('leaves retryAfter null wherever the server named no wait', function (): void {
    $this->get(wf3Route('/__fehler/nowait', 500))
        ->assertStatus(500)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('retryAfter', null));
});

/*
 * A release window may not depend on anything the release is replacing, so a 503 is answered by
 * the standalone Blade page rather than by the Inertia one: no built bundle, no database, no
 * session — and a page that still names three ways on.
 */
it('answers a 503 with the standalone maintenance page, not the Inertia one', function (): void {
    $html = (string) $this->get(wf3Route('/__fehler/wartung', 503))->assertStatus(503)->getContent();

    expect($html)
        ->toContain('RIMIFY ist gerade in Wartung.')
        ->not->toContain('data-page')
        ->not->toContain('Fehler/Index');
});

it('renders the maintenance page on its own, with no asset the build produces', function (): void {
    // This is what `php artisan down --render="errors::503"` freezes into a static file. Anything
    // it references that the build writes would be a broken link exactly when it matters most.
    $html = view('errors.503')->render();

    expect($html)
        ->toContain('RIMIFY ist gerade in Wartung.')
        ->not->toContain('/build/')
        ->not->toContain('<script')
        ->not->toContain('rel="stylesheet"')
        ->not->toContain('rel="preload"');

    // The three ways on: reload this page, go to the shop, write to us.
    expect(substr_count($html, 'class="btn'))->toBe(3)
        ->and($html)->toContain('href=""')
        ->and($html)->toContain('href="/"')
        ->and($html)->toContain('mailto:');
});

it('renders the boot-failure page on its own too', function (): void {
    $html = view('errors.500')->render();

    expect($html)
        ->toContain('Da ist etwas schiefgelaufen.')
        ->not->toContain('/build/')
        ->not->toContain('<script')
        ->not->toContain('rel="stylesheet"');

    expect(substr_count($html, 'class="btn'))->toBe(3);
});

it('promises nothing the shop cannot keep', function (): void {
    $maintenance = view('errors.503')->render();
    $failure = view('errors.500')->render();

    // Nothing notifies a human of an error in this application — no Sentry, no Flare, no error
    // mail, no Slack channel — so no page may say the error is being looked at.
    expect($maintenance.$failure)
        ->not->toContain('wird angesehen')
        ->not->toContain('wird untersucht')
        ->not->toContain('wurde uns gemeldet');

    // And a release takes as long as it takes.
    expect($maintenance)->not->toContain('wenige Minuten')->not->toContain('dauert nur');
});

it('reads the contact address from configuration and never from a literal', function (): void {
    config()->set('rimify.contact.email', 'wf3@example.test');

    expect(view('errors.503')->render())->toContain('wf3@example.test');
});

/*
 * A status the shop wrote no sentences for used to fall through to Symfony's own page: "Oops! An
 * Error Occurred … We will fix it as soon as possible", in English, on a German-only shop, with no
 * way forward on it at all and a promise nobody here can keep. The designed page answers instead —
 * it names the code, says it will not guess at what is behind it, and still offers three routes.
 */
it('answers a status it was never designed for, rather than handing over an English dead end', function (int $status): void {
    $this->get(wf3Route('/__fehler/'.$status, $status), ['Accept' => 'text/html'])
        ->assertStatus($status)
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('Fehler/Index')
                ->where('status', $status)
        );
})->with([405, 410, 418, 502]);

it('never shows the framework page, in English, to a customer', function (): void {
    $html = (string) $this->get(wf3Route('/__fehler/englisch', 410))->assertStatus(410)->getContent();

    expect($html)
        ->not->toContain('Oops! An Error Occurred')
        ->not->toContain('We will fix it as soon as possible');
});

/*
 * The one page that has to hold its nerve was arriving without its stylesheet.
 *
 * `style-src` is `'self' 'nonce-…'` with no `'unsafe-inline'`, so the browser refused the <style>
 * this page carries and drew it in Times New Roman with a black cartwheel across the screen. The
 * nonce is what makes the designed page reach the customer.
 */
it('lets the browser apply the stylesheet the standalone page ships with', function (): void {
    $response = $this->get(wf3Route('/__fehler/nonce', 503))->assertStatus(503);

    $policy = (string) $response->headers->get('Content-Security-Policy');

    expect($policy)->toContain("style-src 'self' 'nonce-");

    preg_match("/style-src 'self' 'nonce-([^']+)'/", $policy, $found);

    expect((string) $response->getContent())->toContain('<style nonce="'.($found[1] ?? 'keine').'"');
});

it('sets the standalone pages in the shop\'s own typeface', function (): void {
    // /fonts is a plain directory under the document root: the build never writes it and never
    // renames it, so naming the file breaks no rule this page lives by. Without it the maintenance
    // page is Arial while every other page of the shop is Archivo.
    foreach (['errors.503', 'errors.500'] as $view) {
        expect(view($view)->render())
            ->toContain("src: url('/fonts/archivo-latin-wdth.woff2') format('woff2-variations')")
            ->toContain('Archivo Variable');
    }
});

it('answers an API request with JSON, never with a page', function (): void {
    $this->getJson('/api/v1/gibt-es-nicht')
        ->assertNotFound()
        ->assertHeader('content-type', 'application/json');
});
