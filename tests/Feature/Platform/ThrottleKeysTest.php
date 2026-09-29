<?php

declare(strict_types=1);

use App\Domain\Storefront\VisitorKey;
use App\Http\RateLimits\ShopRateLimits;
use App\Models\AdminUser;
use App\Services\Admin\AdminErrorPage;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

/*
 * Every rate limit counts its own route. Laravel's `throttle:N,M` keys by the user, or by the IP for a guest,
 * and nothing else: without a key of its own, every throttled route shared one counter and held it against its
 * own limit — a customer's search keystrokes (60 a minute) used up the checkout's 10, and an admin typing in
 * the Gutachten vehicle search (120) was refused the password confirmation (6). Found by the final gates
 * (Block E), where the e2e suite's sudo step answered 429.
 *
 * And the shop counts visitors, not addresses (the operator's last prompt §2): thousands of customers share one
 * mobile carrier's address. A visitor's key (`rmf_geraet`) comes first; the address, at ten times the ceiling,
 * bounds every request — a key is free to collect (G-06) — with a warning logged when it fires; the checkout never
 * by address.
 */

/** @return array<string, string> the cookie of one shop visitor */
function visitor(string $key): array
{
    return [VisitorKey::COOKIE => str_pad($key, 40, 'x')];
}

it('gives every throttled route its own counter', function (): void {
    $unkeyed = collect(Route::getRoutes()->getRoutes())
        ->flatMap(static fn ($route): array => array_map(static fn (string $m): string => $route->uri().' '.$m, $route->gatherMiddleware()))
        ->filter(static fn (string $m): bool => preg_match('/ throttle:\d+,\d+$/', $m) === 1)
        ->values()->all();

    expect($unkeyed)->toBe([]);
});

it('counts every limit on the shop by visitor, never by a route-keyed address counter', function (): void {
    $shop = collect(Route::getRoutes()->getRoutes())
        ->reject(static fn ($route): bool => str_starts_with($route->uri(), 'admin') || $route->getName() === 'vorschau.seite')
        ->flatMap(static fn ($route): array => array_values(array_filter($route->gatherMiddleware(), static fn (string $m): bool => str_starts_with($m, 'throttle:'))))
        ->unique()->values();

    expect($shop->all())->not->toBeEmpty()
        ->and($shop->reject(static fn (string $m): bool => array_key_exists(substr($m, 9), ShopRateLimits::LIMITS))->all())->toBe([]);
});

it('does not charge the checkout for the searches before it', function (): void {
    $this->seed(CommerceSeeder::class);

    foreach (range(1, 12) as $ignored) {
        $this->withCredentials()->withCookies(visitor('a'))->getJson('/api/v1/vehicles/models?marke=BMW')->assertOk();
    }

    // Twelve reads are more than the checkout's ten a minute: they must not count against it.
    expect($this->withCredentials()->withCookies(visitor('a'))->post('/kasse', [])->getStatusCode())->not->toBe(429);
});

it('never limits the checkout by address', function (): void {
    $this->seed(CommerceSeeder::class);

    // Fifteen orders from one address without a visitor key — a carrier's shared address on a Saturday.
    foreach (range(1, 15) as $ignored) {
        expect($this->post('/kasse', [])->getStatusCode())->not->toBe(429);
    }
});

it('does not charge the vehicle picker for the search typed before it', function (): void {
    $this->seed(CommerceSeeder::class);

    // Sixty-one keystrokes' worth of search: more than the picker's sixty a minute (EF-04).
    foreach (range(1, 61) as $ignored) {
        $this->withCredentials()->withCookies(visitor('a'))->getJson('/api/v1/search?q=bmw')->assertOk();
    }

    $this->withCredentials()->withCookies(visitor('a'))->getJson('/api/v1/vehicles/models?marke=BMW')->assertOk();
});

it('counts two visitors behind one address apart', function (): void {
    config()->set('rimify.features.notify_by_mail', false);

    // Visitor a uses up the ten notify requests a minute; visitor b, on the same address, still has all ten.
    foreach (range(1, 10) as $ignored) {
        $this->withCredentials()->withCookies(visitor('a'))->postJson('/api/v1/fitment/notify', [])->assertForbidden();
    }

    $this->withCredentials()->withCookies(visitor('a'))->postJson('/api/v1/fitment/notify', [])->assertStatus(429);
    $this->withCredentials()->withCookies(visitor('b'))->postJson('/api/v1/fitment/notify', [])->assertForbidden();
});

it('falls back to the address at ten times the ceiling, and logs when that fires', function (): void {
    config()->set('rimify.features.notify_by_mail', false);
    Log::spy();

    foreach (range(1, 10 * ShopRateLimits::ADDRESS_FACTOR) as $ignored) {
        $this->postJson('/api/v1/fitment/notify', [])->assertForbidden();
    }

    Log::shouldNotHaveReceived('warning');

    $this->postJson('/api/v1/fitment/notify', [])->assertStatus(429);
    // A flood is logged once a minute per address and limiter, not at the flood's rate (G-09).
    $this->postJson('/api/v1/fitment/notify', [])->assertStatus(429);

    Log::shouldHaveReceived('warning')->once()->withArgs(static fn (string $message, array $context): bool => $context['limiter'] === 'shop-benachrichtigung'
        && $context['path'] === '/api/v1/fitment/notify'
        && $context['address'] === '127.0.0.0');
});

it('gives a new visitor a key, and the admin none', function (): void {
    $this->seed(CommerceSeeder::class);

    $this->get('/')->assertCookie(VisitorKey::COOKIE);
    $this->get('/admin/anmelden')->assertCookieMissing(VisitorKey::COOKIE);
    $this->withCredentials()->withCookies(visitor('a'))->get('/')->assertCookieMissing(VisitorKey::COOKIE);
});

it('does not charge the password confirmation for the searches before it, and still limits it', function (): void {
    $this->seed(AccessSeeder::class);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    foreach (range(1, 7) as $ignored) {
        $this->actingAs($admin, 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q=BMW')->assertOk();
    }

    $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'falsch'])->assertSessionHasErrors('password');

    // Its own six a minute still hold.
    foreach (range(2, 6) as $ignored) {
        $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'falsch'])->assertSessionHasErrors('password');
    }

    // The seventh is refused the admin's way: back to the form with the one sentence (AdminErrorPage), not a check.
    $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'falsch'])
        ->assertRedirect()
        ->assertSessionHas('toast', AdminErrorPage::TOO_MANY)
        ->assertSessionDoesntHaveErrors('password');
});
