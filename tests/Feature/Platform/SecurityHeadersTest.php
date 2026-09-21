<?php

declare(strict_types=1);

use App\Http\Middleware\DetectDevice;
use Illuminate\Support\Facades\Route;

/*
 * Spec §12: security headers are verified automatically, and the device split is decided
 * on the server. A probe route keeps this test independent of the storefront pages.
 */

beforeEach(function (): void {
    Route::middleware('web')->get('/_probe', fn () => response()->json([
        'isMobile' => request()->attributes->get(DetectDevice::ATTRIBUTE),
    ]));
});

it('sends the hardening headers on every web response', function (): void {
    $response = $this->get('/_probe')->assertOk();

    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('X-Frame-Options', 'DENY');

    $csp = (string) $response->headers->get('Content-Security-Policy');

    expect($csp)
        ->toContain("default-src 'self'")
        ->toContain("object-src 'none'")
        ->toContain("frame-ancestors 'none'")
        ->toContain("base-uri 'self'")
        ->toContain('https://checkout.stripe.com')
        ->toMatch("/script-src 'self' 'nonce-[A-Za-z0-9+\/=_-]{16,}'/")
        ->not->toContain("script-src 'self' 'unsafe-inline'")
        ->not->toContain("'unsafe-eval'")
        ->not->toContain('*');
});

it('widens img-src to named photography hosts only while the review flag is on', function (): void {
    config()->set('rimify.photography.enabled', true);
    config()->set('rimify.photography.hosts', ['https://images.unsplash.com']);

    $csp = (string) $this->get('/_probe')->headers->get('Content-Security-Policy');

    expect($csp)
        ->toContain("img-src 'self' data: blob: https://images.unsplash.com")
        // Named hosts, never a wildcard. A `*` here would let any origin place pixels on a page
        // that talks about legal approvals, and it is what stops the flag becoming permanent.
        ->not->toContain('*');
});

it('narrows img-src back to the origin when photography is off', function (): void {
    config()->set('rimify.photography.enabled', false);

    $csp = (string) $this->get('/_probe')->headers->get('Content-Security-Policy');

    expect($csp)
        ->toContain("img-src 'self' data: blob:")
        ->not->toContain('unsplash');
});

it('uses a fresh CSP nonce per response', function (): void {
    preg_match("/'nonce-([^']+)'/", (string) $this->get('/_probe')->headers->get('Content-Security-Policy'), $first);
    preg_match("/'nonce-([^']+)'/", (string) $this->get('/_probe')->headers->get('Content-Security-Policy'), $second);

    expect($first[1])->not->toBe($second[1]);
});

it('sends HSTS only over TLS', function (): void {
    $this->get('/_probe')->assertHeaderMissing('Strict-Transport-Security');

    $this->get('https://localhost/_probe')
        ->assertHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
});

it('never answers with a wildcard CORS header', function (): void {
    $this->get('/_probe', ['Origin' => 'https://evil.example'])
        ->assertHeaderMissing('Access-Control-Allow-Origin');
});

it('decides the device split on the server and tells caches it varies', function (): void {
    $phone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
    $desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

    $this->get('/_probe', ['User-Agent' => $phone])->assertJson(['isMobile' => true]);
    $response = $this->get('/_probe', ['User-Agent' => $desktop])->assertJson(['isMobile' => false]);

    expect($response->headers->get('Vary'))->toContain('User-Agent')->toContain('Sec-CH-UA-Mobile');
    $response->assertHeader('Accept-CH', 'Sec-CH-UA-Mobile');

    $this->get('/_probe', ['User-Agent' => $desktop, 'Sec-CH-UA-Mobile' => '?1'])->assertJson(['isMobile' => true]);
});

it('pins the layout with ?view= for client demos and stores the preference', function (): void {
    $desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

    $this->get('/_probe?view=mobile', ['User-Agent' => $desktop])
        ->assertJson(['isMobile' => true])
        ->assertCookie(DetectDevice::OVERRIDE_COOKIE, 'mobile', false);

    $this->withUnencryptedCookie(DetectDevice::OVERRIDE_COOKIE, 'mobile')
        ->get('/_probe', ['User-Agent' => $desktop])
        ->assertJson(['isMobile' => true]);
});

it('releases a pinned layout with ?view=auto and clears the cookie', function (): void {
    $desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

    $this->withUnencryptedCookie(DetectDevice::OVERRIDE_COOKIE, 'mobile')
        ->get('/_probe?view=auto', ['User-Agent' => $desktop])
        ->assertJson(['isMobile' => false])
        ->assertCookieExpired(DetectDevice::OVERRIDE_COOKIE);
});

it('keeps the stored preference when ?view= carries an unknown value', function (): void {
    $desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

    // An unknown value must not silently flip the layout; the stored choice still governs.
    $this->withUnencryptedCookie(DetectDevice::OVERRIDE_COOKIE, 'mobile')
        ->get('/_probe?view=tablet', ['User-Agent' => $desktop])
        ->assertJson(['isMobile' => true]);
});

it('falls back to the User-Agent when ?view= is unknown and nothing is stored', function (): void {
    $desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';

    $this->get('/_probe?view=tablet', ['User-Agent' => $desktop])->assertJson(['isMobile' => false]);
});
