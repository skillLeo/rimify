<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Http\Controllers\Storefront\StartseiteController;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\PaymentEvent;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Services\Storefront\BestSellers;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * ACCURACY.md D7 on the homepage: no "Beliebt" without data behind it (#51), and an EU tyre label only for a tyre with
 * a verified EPREL entry (#66). The shelf (the client's #5, the operator's brief „THE 34“): „Meistgekaufte Felgen“ by
 * the paid order lines of the last 90 days, „Neu im Shop“ — newest first — until the first sale.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

/** The seeded demonstration orders are not sales (they exist only locally and in tests): none counts here. */
function claimsNoSales(): void
{
    DB::table('orders')->update(['status' => OrderStatus::Cancelled->value]);
}

/**
 * The published models as the shelf orders them while nothing has sold — and the last of them, the one a sale must lift.
 *
 * @return array{0: list<int>, 1: int}
 */
function claimsShelf(object $test): array
{
    $ids = [];

    $test->get('/')->assertInertia(function (AssertableInertia $page) use (&$ids): AssertableInertia {
        $ids = collect($page->toArray()['props']['popular']['cards'])->pluck('modelId')->unique()->values()->all();

        return $page;
    });

    return [$ids, (int) end($ids)];
}

it('@kunde-05 heads the shelf „Neu im Shop“ while nothing has sold — newest first — and never says „beliebt“', function (): void {
    claimsNoSales();
    // The newest model by a clear margin: it must lead.
    $newest = (int) DB::table('wheel_models')->where('status', 'published')->orderBy('id')->value('id');
    DB::table('wheel_models')->where('id', $newest)->update(['created_at' => now()->addMinute()]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', StartseiteController::NEWEST_LABEL)
        ->where('popular.ranking', 'neu')
        ->where('popular.cards.0.modelId', $newest)
        ->where('popular.title', fn (string $title): bool => ! str_contains(mb_strtolower($title), 'beliebt'))
    );
});

it('@kunde-05 heads the shelf „Meistgekaufte Felgen“ once a real order is paid, and puts what sold first', function (): void {
    claimsNoSales();
    [$before, $last] = claimsShelf($this);
    expect(count($before))->toBeGreaterThan(1);

    $config = WheelConfig::query()->where('wheel_model_id', $last)->firstOrFail();
    OrderLine::factory()->create(['order_id' => Order::factory()->create(['paid_at' => now()->subDays(3)]), 'wheel_config_id' => $config->id]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', StartseiteController::BESTSELLING_LABEL)
        ->where('popular.ranking', 'meistgekauft')
        ->where('popular.cards.0.modelId', $last)
    );
});

it('@kunde-05 counts the paid order lines of the last 90 days and none older', function (): void {
    claimsNoSales();
    [, $last] = claimsShelf($this);
    $config = WheelConfig::query()->where('wheel_model_id', $last)->firstOrFail();

    // Paid 91 days ago: past the window.
    OrderLine::factory()->create(['order_id' => Order::factory()->create(['paid_at' => now()->subDays(BestSellers::WINDOW_DAYS + 1)]), 'wheel_config_id' => $config->id]);

    expect(app(BestSellers::class)->any())->toBeFalse();
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('popular.title', StartseiteController::NEWEST_LABEL));

    // Two lines paid within it: counted as two.
    $recent = Order::factory()->create(['paid_at' => now()->subDays(BestSellers::WINDOW_DAYS - 1)]);
    OrderLine::factory()->count(2)->create(['order_id' => $recent->id, 'wheel_config_id' => $config->id]);

    expect(app(BestSellers::class)->counts())->toBe([$last => 2]);
});

it('counts nothing a demonstration order, an unpaid order or a cancelled one holds — the heading stays honest', function (): void {
    claimsNoSales();
    [, $last] = claimsShelf($this);
    $config = WheelConfig::query()->where('wheel_model_id', $last)->firstOrFail();

    OrderLine::factory()->create(['order_id' => Order::factory()->pendingPayment()->create(), 'wheel_config_id' => $config->id]);
    OrderLine::factory()->create(['order_id' => Order::factory()->status(OrderStatus::Cancelled)->create(), 'wheel_config_id' => $config->id]);
    OrderLine::factory()->create([
        'order_id' => Order::factory()->create(['is_demo' => true, 'demo_ref' => 'ord-claims-1']),
        'wheel_config_id' => $config->id,
    ]);

    expect(app(BestSellers::class)->any())->toBeFalse();

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('popular.title', StartseiteController::NEWEST_LABEL));
});

/*
 * A test payment sells nothing (D-147): on the review preview every order was paid with the sandbox, and the shelf
 * said „Meistgekauft“ without a single sale (03.10.2026); Stripe in test mode is the same before the live keys.
 */
it('counts no order paid with a test payment — the review\'s sandbox or Stripe in test mode', function (): void {
    claimsNoSales();
    [$before, $last] = claimsShelf($this);
    $config = WheelConfig::query()->where('wheel_model_id', $last)->firstOrFail();
    $event = static fn (Order $order, bool $live): PaymentEvent => PaymentEvent::query()->create([
        'provider' => 'stripe', 'event_id' => 'evt_'.$order->id, 'type' => 'payment_intent.succeeded', 'livemode' => $live,
        'payload' => '{}', 'order_id' => $order->id, 'received_at' => now(),
    ]);

    $sandbox = Order::factory()->create(['payment_method' => 'sandbox']);
    OrderLine::factory()->create(['order_id' => $sandbox->id, 'wheel_config_id' => $config->id]);
    $stripeTest = Order::factory()->create(['payment_method' => 'card']);
    OrderLine::factory()->create(['order_id' => $stripeTest->id, 'wheel_config_id' => $config->id]);
    $event($stripeTest, false);

    expect(app(BestSellers::class)->any())->toBeFalse()
        // Nor does the shelf's own order lift the model the test orders hold.
        ->and(claimsShelf($this)[0])->toBe($before);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('popular.title', StartseiteController::NEWEST_LABEL));

    // The same sale in live mode is one.
    $live = Order::factory()->create(['payment_method' => 'card', 'paid_at' => now()]);
    OrderLine::factory()->create(['order_id' => $live->id, 'wheel_config_id' => $config->id]);
    $event($live, true);

    expect(app(BestSellers::class)->counts())->toBe([$last => 1]);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', StartseiteController::BESTSELLING_LABEL)
        ->where('popular.cards.0.modelId', $last)
    );
});

it('shows no tyre label without a verified EPREL entry', function (): void {
    DB::table('tyre_variants')->update(['eprel_id' => null]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('komplettrad.tyre', null));
});

it('shows the label of a tyre whose EPREL entry is on record', function (): void {
    DB::table('tyre_variants')->update(['eprel_id' => null]);

    // The seeded tyres are invented and carry no label: this one gets a registration and its values.
    $tyre = TyreVariant::query()->where('stock_qty', '>', 0)->orderByDesc('id')->firstOrFail();
    DB::table('tyre_variants')->where('id', $tyre->id)->update([
        'eprel_id' => '123456', 'eu_fuel_class' => 'C', 'eu_wet_grip_class' => 'A', 'eu_noise_db' => 72, 'eu_noise_class' => 'B',
    ]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('komplettrad.tyre.eprelId', '123456')
        ->where('komplettrad.tyre.fuel', 'C')
    );
});
