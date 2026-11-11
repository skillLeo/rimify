<?php

declare(strict_types=1);

use App\Http\Requests\Storefront\ShippingChoiceRequest;
use App\Mail\OrderConfirmationMail;
use App\Models\AdminUser;
use App\Models\Order;
use App\Models\Setting;
use App\Models\ShippingMethod;
use App\Payments\Stripe\InvoiceRows;
use App\Services\Commerce\CheckoutShown;
use App\Services\Commerce\ShippingSettingCarry;
use App\Services\Demo\AcceptanceShipping;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use App\Support\Shipping;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Http\Request;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * Shipping methods (his round of 08.11, §7B; D-449), as the customer meets them: the basket goes by the cheapest method that
 * ships what it holds, the checkout offers every active one with its price and delivery time before „Zahlungspflichtig
 * bestellen“, the choice is the server's to price, and the order freezes the method's name, price and delivery time — on the
 * Stripe row, the mail and both order pages. The product page names the cheapest active method for rims.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class, KomplettradOptionsSeeder::class]);
    config([
        // The test payment, off production (TestzahlungTest): the purchase goes through.
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping' => ['cost_cents' => null, 'free_from_cents' => null, 'delivery_time' => null],
    ]);
    $this->fx = KomplettradFixture::permitted();
    $this->fx->config->forceFill(['stock_qty' => 20])->save();
    $this->standard = ShippingMethod::factory()->create(['name' => 'Standard', 'price_cents' => 3_000, 'delivery_min_days' => 3, 'delivery_max_days' => 10, 'position' => 1]);
    $this->express = ShippingMethod::factory()->create(['name' => 'Express', 'price_cents' => 5_990, 'delivery_min_days' => 1, 'delivery_max_days' => 2, 'position' => 2, 'description_de' => 'Schneller zugestellt.']);
    $this->off = ShippingMethod::factory()->inactive()->create(['name' => 'Ausgeschaltet', 'price_cents' => 100, 'position' => 3]);
    $this->sets = ShippingMethod::factory()->only(['komplettrad'])->create(['name' => 'Nur Kompletträder', 'price_cents' => 500, 'position' => 4]);
});

/** The fixture's rim, four of it, as the session holds a basket. */
function shipBasket(object $test): array
{
    return [Basket::SESSION_KEY => ['wheel:'.$test->fx->config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $test->fx->config->id, 'tyreVariantId' => null, 'quantity' => 4]]];
}

/** @return array<string, mixed> the totals the Kasse is shown */
function shipTotals(object $test, array $session = []): array
{
    return $test->withCookies($test->fx->cookies())->withSession([...shipBasket($test), ...$session])->get('/kasse')->assertOk()->viewData('page')['props']['totals'];
}

function shipOrder(object $test, array $session = []): Order
{
    $test->withCookies($test->fx->cookies())->withSession([...shipBasket($test), ...$session])
        ->from('/kasse')
        ->post('/kasse', ['email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true])
        ->assertSessionHasNoErrors();

    return Order::query()->latest('id')->firstOrFail();
}

it('offers the active methods that ship the basket, in the admin\'s order, and goes by the cheapest until one is chosen', function (): void {
    $totals = shipTotals($this);

    // Rims alone: neither the method switched off nor the one for Kompletträder only.
    expect(array_column($totals['shippingMethods'], 'name'))->toBe(['Standard', 'Express'])
        ->and($totals['shippingMethod']['name'])->toBe('Standard')
        ->and($totals['shippingCents'])->toBe(3_000)
        ->and($totals['shippingMethods'][1])->toMatchArray(['priceCents' => 5_990, 'deliveryTime' => '1–2 Werktage', 'description' => 'Schneller zugestellt.']);

    // Cheaper but placed second: the cheapest still goes first, and the order of the list stays the admin's.
    $this->express->forceFill(['price_cents' => 1_000])->save();
    $totals = shipTotals($this);

    expect($totals['shippingMethod']['name'])->toBe('Express')
        ->and(array_column($totals['shippingMethods'], 'name'))->toBe(['Standard', 'Express']);
});

it('takes the customer\'s choice, prices it on the server and shows its delivery time before the order button', function (): void {
    $this->withCookies($this->fx->cookies())->withSession(shipBasket($this))->from('/kasse')
        ->patch('/kasse/versand', ['versandart' => $this->express->id])
        ->assertRedirect('/kasse')
        ->assertSessionHasNoErrors()
        ->assertSessionHas(Basket::SESSION_SHIPPING, $this->express->id);

    $page = $this->withCookies($this->fx->cookies())->withSession([...shipBasket($this), Basket::SESSION_SHIPPING => $this->express->id])->get('/kasse')->assertOk()->viewData('page')['props'];

    expect($page['totals']['shippingMethod']['name'])->toBe('Express')
        ->and($page['totals']['shippingCents'])->toBe(5_990)
        ->and($page['totals']['totalCents'])->toBe($page['totals']['subtotalCents'] + 5_990)
        ->and($page['deliveryTime'])->toBe('1–2 Werktage');
});

it('refuses a method that is off or does not ship the basket, and keeps the one in force', function (): void {
    foreach ([$this->off->id, $this->sets->id, 999_999] as $id) {
        $this->withCookies($this->fx->cookies())->withSession(shipBasket($this))->from('/kasse')
            ->patch('/kasse/versand', ['versandart' => $id])
            ->assertSessionHasErrors(['versandart' => ShippingChoiceRequest::UNKNOWN])
            ->assertSessionMissing(Basket::SESSION_SHIPPING);
    }

    // A choice that stopped shipping the basket meanwhile is not kept: the basket goes by the cheapest again.
    $this->express->forceFill(['active' => false])->save();

    expect(shipTotals($this, [Basket::SESSION_SHIPPING => $this->express->id])['shippingMethod']['name'])->toBe('Standard');
});

it('ships free from the method\'s own threshold, and only that method', function (): void {
    $subtotal = shipTotals($this)['subtotalCents'];
    $this->standard->forceFill(['free_from_cents' => $subtotal])->save();
    $totals = shipTotals($this);

    expect($totals['shippingCents'])->toBe(0)
        ->and($totals['freeShipping'])->toBeTrue()
        ->and($totals['shippingMethods'][0]['free'])->toBeTrue()
        ->and($totals['shippingMethods'][1]['priceCents'])->toBe(5_990);
});

it('holds the order while no method ships the basket, as without a shipping price', function (): void {
    ShippingMethod::query()->update(['active' => false]);
    $totals = shipTotals($this);

    expect($totals['shippingConfigured'])->toBeFalse()
        ->and($totals['shippingMethods'])->toBe([])
        ->and(app(Basket::class)->refusalOf(['lines' => [['demo' => false, 'inStock' => true, 'verdict' => ['sellable' => true]]], 'totals' => $totals]))->toBe(Basket::SHIPPING_REFUSAL);
});

it('freezes name, price and delivery time onto the order, and names them on the Stripe row, the mail and both order pages', function (): void {
    $order = shipOrder($this, [Basket::SESSION_SHIPPING => $this->express->id]);

    // The method changes afterwards: what the order was sold with does not.
    $this->express->forceFill(['name' => 'Express neu', 'price_cents' => 9_900, 'delivery_min_days' => 4, 'delivery_max_days' => 6])->save();
    $order->refresh();
    $rows = InvoiceRows::of($order);
    $mail = (new OrderConfirmationMail($order, null))->content()->with;

    expect($order->only(['shipping_method_id', 'shipping_method_name', 'shipping_cents', 'shipping_delivery_time']))->toBe([
        'shipping_method_id' => $this->express->id, 'shipping_method_name' => 'Express', 'shipping_cents' => 5_990, 'shipping_delivery_time' => '1–2 Werktage',
    ])
        ->and(end($rows))->toMatchArray(['label' => 'Versand (Express)', 'quantity' => 1, 'unitCents' => 5_990, 'shipping' => true])
        ->and($mail['shippingLabel'])->toBe('Versand (Express)')
        ->and($mail['deliveryTime'])->toBe('1–2 Werktage');

    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $this->actingAs($admin, 'admin')->get('/admin/bestellungen/'.$order->id)->assertOk()
        ->assertInertia(fn ($page) => $page->where('order.shippingMethod', 'Express')->where('order.deliveryTime', '1–2 Werktage')->where('order.shipping', 5_990));
});

it('stops the payment where the method or its delivery time changed since the page was shown', function (): void {
    $request = Request::create('/kasse');
    $request->setLaravelSession(app('session')->driver());
    $request->session()->put(shipBasket($this));
    $request->cookies->add($this->fx->cookies());
    $basket = app(Basket::class);
    $shown = CheckoutShown::token($basket->summary($request));

    expect(CheckoutShown::refusal($shown, $basket->summary($request)))->toBeNull();

    $this->standard->forceFill(['delivery_min_days' => 5, 'delivery_max_days' => 12])->save();

    expect(CheckoutShown::refusal($shown, $basket->summary($request)))->toBe(CheckoutShown::PRICE_CHANGED);
});

it('names the cheapest active method that ships rims on the product page, and the .env while no method was ever saved', function (): void {
    $line = fn (): ?string => $this->withCookies($this->fx->cookies())->get('/felgen/'.$this->fx->config->wheelModel->slug)->assertOk()->viewData('page')['props']['shipping'];

    // The method for Kompletträder only costs less, but ships no rim alone.
    expect($line())->toBe('Lieferzeit 3–10 Werktage · Versand '.GermanFormat::money(3_000));

    ShippingMethod::query()->delete();
    config(['rimify.shipping' => ['cost_cents' => 490, 'free_from_cents' => null, 'delivery_time' => '2–4 Werktage']]);

    expect($line())->toBe('Lieferzeit 2–4 Werktage · Versand '.GermanFormat::money(490))
        ->and(Shipping::current()->name)->toBe('Standardversand')
        ->and(Shipping::current()->source)->toBe('.env');
});

it('carries the one setting into the first method: complete and active, a placeholder or incomplete one switched off, nothing twice', function (): void {
    ShippingMethod::query()->delete();
    Setting::set(Shipping::KEY, ['zones' => ['DE' => ['cost_cents' => 3_000, 'free_from_cents' => null]], 'delivery_min_days' => 3, 'delivery_max_days' => 10, 'placeholder' => false]);

    expect(ShippingSettingCarry::carry())->toBe('active')
        ->and(ShippingMethod::query()->sole()->only(['name', 'price_cents', 'free_from_cents', 'delivery_min_days', 'delivery_max_days', 'countries', 'product_types', 'active']))->toBe([
            'name' => 'Standardversand', 'price_cents' => 3_000, 'free_from_cents' => null, 'delivery_min_days' => 3, 'delivery_max_days' => 10, 'countries' => ['DE'], 'product_types' => null, 'active' => true,
        ])
        ->and(ShippingSettingCarry::carry())->toBe('none');

    ShippingMethod::query()->delete();
    Setting::set(Shipping::KEY, ['zones' => ['DE' => ['cost_cents' => 490, 'free_from_cents' => null]], 'delivery_min_days' => 3, 'delivery_max_days' => 5, 'placeholder' => true]);

    expect(ShippingSettingCarry::carry())->toBe('inactive');

    ShippingMethod::query()->delete();
    Setting::set(Shipping::KEY, ['zones' => ['DE' => ['cost_cents' => null, 'free_from_cents' => null]], 'delivery_min_days' => null, 'delivery_max_days' => null, 'placeholder' => false]);

    expect(ShippingSettingCarry::carry())->toBe('inactive')
        // Switched off, the shop holds every real order as before: no `.env` steps in for a setting that was saved.
        ->and(Shipping::current()->configured())->toBeFalse();
});

it('writes the preview\'s two demo methods once, behind the real ones and dearer than his own, marked demo', function (): void {
    config(['demo.enabled' => true]);

    expect((new AcceptanceShipping)->seed())->toBe(['shipping_methods' => 2])
        ->and((new AcceptanceShipping)->seed())->toBe([]);

    $demo = ShippingMethod::query()->where('is_demo', true)->orderBy('position')->get();

    expect($demo->pluck('name')->all())->toBe(['Express', 'Versichert'])
        ->and($demo->pluck('demo_ref')->all())->toBe([AcceptanceShipping::PREFIX.'express', AcceptanceShipping::PREFIX.'versichert'])
        ->and($demo->min('position'))->toBeGreaterThan(ShippingMethod::query()->where('is_demo', false)->max('position'))
        ->and($demo->min('price_cents'))->toBeGreaterThan(3_000);
});
