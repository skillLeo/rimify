<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Http\Controllers\Storefront\StartseiteController;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Services\Storefront\BestSellers;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * ACCURACY.md D7 on the homepage: no "Beliebt" without data behind it (#51), and an EU tyre label
 * only for a tyre with a verified EPREL entry (#66).
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

it('labels the coverage order for what it counts while nothing has sold', function (): void {
    claimsNoSales();

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.title', 'Felgen aus dem Sortiment')
        ->where('popular.tabs.0', ['key' => 'beliebt', 'label' => 'Meiste Freigaben'])
        ->where('popular.tabs', fn ($tabs) => collect($tabs)->every(fn (array $tab): bool => ! str_contains(mb_strtolower($tab['label']), 'beliebt')))
    );
});

/**
 * The published models as the first tab orders them while nothing has sold — and the last of them, the one a sale must lift.
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

it('calls the first tab „Meistgekauft“ once a real order is paid, and puts what sold first — the client\'s #5', function (): void {
    claimsNoSales();
    [$before, $last] = claimsShelf($this);
    expect(count($before))->toBeGreaterThan(1);

    $config = WheelConfig::query()->where('wheel_model_id', $last)->firstOrFail();
    OrderLine::factory()->create(['order_id' => Order::factory()->create(), 'wheel_config_id' => $config->id]);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('popular.tabs.0', ['key' => 'beliebt', 'label' => StartseiteController::BESTSELLING_LABEL])
        ->where('popular.cards.0.modelId', $last)
    );
});

it('counts nothing a demonstration order, an unpaid order or a cancelled one holds — the label stays honest', function (): void {
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

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('popular.tabs.0.label', 'Meiste Freigaben'));
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
