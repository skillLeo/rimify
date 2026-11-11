<?php

declare(strict_types=1);

use App\Models\ShippingMethod;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * Einstellungen › Versand, as the customer meets it (D-449): the product page's line under the price, the basket's
 * shipping and its free-shipping threshold, and the delivery time before the order button (§ 312j BGB) — all read from the
 * active shipping methods, and none of it while no method is active.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class, AccessSeeder::class]);
    config([
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping' => ['cost_cents' => null, 'free_from_cents' => null, 'delivery_time' => null],
    ]);
});

/** @param array<string, mixed> $over */
function savedShipping(array $over = []): void
{
    ShippingMethod::factory()->create(['price_cents' => 490, 'free_from_cents' => 100_000, 'delivery_min_days' => 3, 'delivery_max_days' => 5, ...$over]);
}

it('says delivery time and shipping on the product page, charges them in the basket, and names the time before the order', function (): void {
    savedShipping();
    $fx = KomplettradFixture::permitted();
    $config = $fx->config;
    $config->forceFill(['price_cents' => 20_000, 'stock_qty' => 100, 'currency' => 'EUR'])->save();

    $this->withCookies($fx->cookies())->get('/felgen/'.$config->wheelModel?->slug)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('shipping', 'Lieferzeit 3–5 Werktage · Versand '.GermanFormat::money(490).' · versandkostenfrei ab '.GermanFormat::money(100_000)));

    // Two rims, 400,00 €: below the threshold, 4,90 € shipping. Four, 800,00 €: still below. Five: free.
    $basket = static fn (int $quantity): array => [Basket::SESSION_KEY => ['wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => $quantity]]];

    $this->withCookies($fx->cookies())->withSession($basket(2))->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('totals.shipping', GermanFormat::money(490))
            ->where('totals.shippingConfigured', true)
            ->where('totals.total', GermanFormat::money(40_490)));

    $this->withCookies($fx->cookies())->withSession($basket(5))->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('totals.total', GermanFormat::money(100_000)));

    $this->withCookies($fx->cookies())->withSession($basket(2))->get('/kasse')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('deliveryTime', '3–5 Werktage'));
});

it('treats a method switched off as not given: no line on the product page, „noch festgelegt“ in the basket', function (): void {
    savedShipping(['active' => false]);
    $fx = KomplettradFixture::permitted();
    $config = $fx->config;
    $basket = [Basket::SESSION_KEY => ['wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4]]];

    $this->withCookies($fx->cookies())->get('/felgen/'.$config->wheelModel?->slug)
        ->assertInertia(fn (AssertableInertia $page) => $page->where('shipping', null));

    $this->withCookies($fx->cookies())->withSession($basket)->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('totals.shippingConfigured', false));

    $this->withCookies($fx->cookies())->withSession($basket)->get('/kasse')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('deliveryTime', null));
});
