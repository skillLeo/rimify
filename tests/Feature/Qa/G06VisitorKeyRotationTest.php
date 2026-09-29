<?php

declare(strict_types=1);

use App\Domain\Storefront\VisitorKey;
use App\Http\RateLimits\ShopRateLimits;
use Database\Seeders\CommerceSeeder;

/*
 * QA „Letzte Runde (G)“, G-06 (S2) — docs/qa/BUGS.md.
 *
 * Every shop limit now counts per `rmf_geraet` key, and the shop hands a fresh key to every request that comes
 * without one — the homepage included, which no limit guards. A client that simply does not send the cookie back
 * collects a new key, and a new full allowance, with every page load: one address is no longer bounded at all.
 * The worst place is „Sag mir Bescheid“ (POST /api/v1/fitment/notify), which writes a row and mails a
 * confirmation to any address it is given — the ten a minute per visitor become ten per page load.
 *
 * What this asserts: one address, however many keys it collects, gets no more than ten times one visitor's
 * notify allowance in a minute — the operator's own figure for an address (ShopRateLimits::ADDRESS_FACTOR).
 */

it('G-06: one address cannot buy a fresh notify allowance with every key the shop hands out', function (): void {
    $this->seed(CommerceSeeder::class);
    // The feature off: every request answers 403 after the limiter has counted it — no row, no mail.
    config()->set('rimify.features.notify_by_mail', false);

    // Eleven page loads from one address, each without the cookie the last one set.
    $keys = [];

    foreach (range(1, 11) as $ignored) {
        $keys[] = $this->get('/')->getCookie(VisitorKey::COOKIE)?->getValue();
    }

    $statuses = [];

    foreach ($keys as $key) {
        foreach (range(1, 10) as $ignored) {
            $statuses[] = $this->withCredentials()
                ->withCookies([VisitorKey::COOKIE => is_string($key) ? $key : ''])
                ->postJson('/api/v1/fitment/notify', [])
                ->getStatusCode();
        }
    }

    // 110 sign-ups in a minute from one address: more than ten times one visitor's ten.
    expect(count($statuses))->toBeGreaterThan(10 * ShopRateLimits::ADDRESS_FACTOR)
        ->and($statuses)->toContain(429);
});
