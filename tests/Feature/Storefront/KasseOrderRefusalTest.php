<?php

declare(strict_types=1);

use App\Http\Controllers\Storefront\KasseController;
use App\Models\Address;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * ACCURACY.md D4: the checkout can be walked, and nothing binding happens. The server refuses to
 * place an order while any basket line is a demo model, while shipping is unconfigured, and — with
 * no payment integration yet — in any case. Every refusal is a friendly German sentence and writes
 * no row.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    config(['rimify.shipping.cost_cents' => null, 'rimify.shipping.free_from_cents' => null]);
});

/** A complete, valid checkout form. */
function kasseForm(array $overrides = []): array
{
    return [
        'email' => 'kunde@beispiel.de',
        'phone' => '',
        'name' => 'Erika Mustermann',
        'street' => 'Hauptstraße',
        'houseNumber' => '12',
        'zip' => '50667',
        'city' => 'Köln',
        'billingSame' => true,
        'shipping' => 'standard',
        ...$overrides,
    ];
}

/** A basket of four of one in-stock configuration, as the session holds it. */
function kasseBasket(WheelConfig $config): array
{
    return [Basket::SESSION_KEY => [
        'wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4],
    ]];
}

/** @return array<string, int> */
function commerceRowCounts(): array
{
    return [
        'orders' => Order::query()->count(),
        'order_lines' => OrderLine::query()->count(),
        'order_line_fitments' => OrderLineFitment::query()->count(),
        'customers' => Customer::query()->count(),
        'addresses' => Address::query()->count(),
    ];
}

function kasseInStockConfig(): WheelConfig
{
    return WheelConfig::query()->where('stock_qty', '>', 4)->orderBy('id')->firstOrFail();
}

it('refuses an order with a demo line, in German, and creates nothing', function (): void {
    $config = kasseInStockConfig();
    expect(WheelModel::query()->whereKey($config->wheel_model_id)->value('is_demo'))->toBeTrue();

    config(['rimify.shipping.cost_cents' => 990]);
    $before = commerceRowCounts();

    $this->withSession(kasseBasket($config))
        ->from('/kasse')
        ->post('/kasse', kasseForm())
        ->assertRedirect('/kasse')
        ->assertSessionHasErrors(['order' => Basket::DEMO_REFUSAL]);

    expect(commerceRowCounts())->toBe($before);
});

it('refuses an order while no shipping price is configured', function (): void {
    $config = kasseInStockConfig();
    WheelModel::query()->whereKey($config->wheel_model_id)->update(['is_demo' => false]);
    $before = commerceRowCounts();

    $this->withSession(kasseBasket($config))
        ->from('/kasse')
        ->post('/kasse', kasseForm())
        ->assertRedirect('/kasse')
        ->assertSessionHasErrors(['order' => Basket::SHIPPING_REFUSAL]);

    expect(commerceRowCounts())->toBe($before);
});

it('still places nothing when the basket is fine: there is no payment yet', function (): void {
    $config = kasseInStockConfig();
    WheelModel::query()->whereKey($config->wheel_model_id)->update(['is_demo' => false]);
    config(['rimify.shipping.cost_cents' => 990, 'rimify.shipping.free_from_cents' => 50_000]);
    $before = commerceRowCounts();

    $this->withSession(kasseBasket($config))
        ->from('/kasse')
        ->post('/kasse', kasseForm())
        ->assertSessionHasErrors(['order' => KasseController::PREVIEW_REFUSAL]);

    expect(commerceRowCounts())->toBe($before);
});

it('refuses an empty basket', function (): void {
    $this->from('/kasse')
        ->post('/kasse', kasseForm())
        ->assertSessionHasErrors(['order' => Basket::EMPTY_REFUSAL]);
});

it('checks the address on the server, with the page\'s own German sentences', function (): void {
    $this->withSession(kasseBasket(kasseInStockConfig()))
        ->from('/kasse')
        ->post('/kasse', kasseForm(['email' => 'kein-at', 'zip' => '123', 'name' => '']))
        ->assertSessionHasErrors([
            'email' => 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.',
            'zip' => 'Eine deutsche PLZ hat fünf Ziffern.',
            'name' => 'Bitte gib deinen vollständigen Namen an.',
        ]);

    $this->withSession(kasseBasket(kasseInStockConfig()))
        ->from('/kasse')
        ->post('/kasse', kasseForm(['billingSame' => false]))
        ->assertSessionHasErrors(['billingName' => 'Bitte gib den Namen für die Rechnung an.']);
});

it('tells the checkout page the refusal before anyone presses the button', function (): void {
    $config = kasseInStockConfig();

    $this->withSession(kasseBasket($config))
        ->get('/kasse')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Kasse/Index')
            ->where('orderRefusal', Basket::DEMO_REFUSAL)
            ->where('lines.0.demo', true)
        );

    WheelModel::query()->whereKey($config->wheel_model_id)->update(['is_demo' => false]);

    $this->withSession(kasseBasket($config))
        ->get('/kasse')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('orderRefusal', Basket::SHIPPING_REFUSAL));
});

it('keeps a demo wheel addable, so the flow can be reviewed', function (): void {
    $config = kasseInStockConfig();

    $this->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'quantity' => 4])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Zum Warenkorb hinzugefügt.');

    $this->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('lines', 1)
        ->where('lines.0.demo', true)
    );
});

describe('shipping from the configuration', function (): void {
    it('defaults to no shipping price and no threshold', function (): void {
        // The values the application boots with, before this file's beforeEach overrides them.
        $config = require base_path('config/rimify.php');

        expect($config['shipping']['cost_cents'])->toBeNull()
            ->and($config['shipping']['free_from_cents'])->toBeNull();
    });

    it('names shipping, leaves it out of the total and does not guess it while unconfigured', function (): void {
        $config = kasseInStockConfig();

        $this->withSession(kasseBasket($config))
            ->get('/warenkorb')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('totals.shippingConfigured', false)
                ->where('totals.shippingCents', null)
                ->where('totals.shipping', 'wird noch festgelegt')
                ->where('totals.freeShipping', false)
                ->where('totals.totalCents', $config->price_cents * 4)
            );
    });

    it('adds the configured price below the threshold and nothing from it', function (): void {
        $config = kasseInStockConfig();
        $subtotal = $config->price_cents * 4;

        config(['rimify.shipping.cost_cents' => 990, 'rimify.shipping.free_from_cents' => $subtotal + 1]);

        $this->withSession(kasseBasket($config))
            ->get('/warenkorb')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('totals.shippingConfigured', true)
                ->where('totals.shippingCents', 990)
                ->where('totals.totalCents', $subtotal + 990)
            );

        config(['rimify.shipping.free_from_cents' => $subtotal]);

        $this->withSession(kasseBasket($config))
            ->get('/warenkorb')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('totals.shippingCents', 0)
                ->where('totals.freeShipping', true)
                ->where('totals.totalCents', $subtotal)
            );
    });

    it('treats a missing threshold as no free shipping', function (): void {
        $config = kasseInStockConfig();
        config(['rimify.shipping.cost_cents' => 490]);

        $this->withSession(kasseBasket($config))
            ->get('/warenkorb')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('totals.shippingCents', 490)
                ->where('totals.freeShipping', false)
            );
    });
});
