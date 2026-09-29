<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Storefront\VehicleContext;
use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\Order;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Demo\DemoDashboard;
use App\Services\Storefront\Basket;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * The drop-in (the admin review release §5): the example data goes with `demo:purge`, the client's
 * files come in by the importer — and everything real stays. The golden record (a released Gutachten,
 * its rows, a paid order with its frozen verdict) survives the purge untouched, and the Übersicht holds
 * with an empty database (DashboardEmptyStateTest), one row, and the whole demo set.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function dropInAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** @return array<string, int> the real rows the golden record lives in */
function realRows(): array
{
    return [
        'orders' => DB::table('orders')->where('is_demo', false)->count(),
        'order_lines' => DB::table('order_lines')->where('is_demo', false)->count(),
        'order_line_fitments' => DB::table('order_line_fitments')->where('is_demo', false)->count(),
        'customers' => DB::table('customers')->where('is_demo', false)->count(),
        'approval_documents' => DB::table('approval_documents')->count(),
        'fitments' => DB::table('fitments')->count(),
        'wheel_configs' => DB::table('wheel_configs')->count(),
    ];
}

it('keeps the golden record standing through demo:purge', function (): void {
    // The real shop the golden record lives in: its catalogue published, not demo (tests/Pest.php).
    CatalogueSeeder::$shopFixture = true;
    $this->seed(CommerceSeeder::class);
    CatalogueSeeder::$shopFixture = false;
    config(['demo.enabled' => true, 'rimify.review.enabled' => true, 'rimify.payments.driver' => 'sandbox']);

    // The golden record's last link: a paid order with its verdict frozen, placed through the shop.
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $resolver = app(FitmentResolver::class);
    $config = WheelConfig::query()->where('stock_qty', '>', 4)->orderBy('id')->get()
        ->first(fn (WheelConfig $c): bool => $resolver->resolve((int) $vehicle->id, (int) $c->id)->isSellable());

    $this->withCookies([VehicleContext::COOKIE => (new VehicleContext((int) $vehicle->id, true))->encode()])
        ->withSession([Basket::SESSION_KEY => ['wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4]]])
        ->post('/kasse', [
            'email' => 'probelauf@example.com', 'phone' => '', 'name' => 'Probelauf Platzhalter', 'street' => 'Beispielstraße',
            'houseNumber' => '1', 'zip' => '10115', 'city' => 'Berlin', 'billingSame' => true, 'shipping' => 'standard',
        ])->assertSessionHasNoErrors();

    $golden = Order::query()->latest('id')->firstOrFail();
    $golden->forceFill(['status' => OrderStatus::Paid->value, 'paid_at' => now()])->save();
    $snapshot = DB::table('order_line_fitments as f')->join('order_lines as l', 'l.id', '=', 'f.order_line_id')->where('l.order_id', $golden->id)->value('f.verdict');

    // The example data around it, then the purge.
    app(DemoDashboard::class)->seed(CarbonImmutable::parse('2026-09-27', 'Europe/Berlin'), 0.25);
    $before = realRows();
    expect(DB::table('orders')->where('is_demo', true)->count())->toBeGreaterThan(0);

    $this->artisan('demo:purge', ['--force' => true])->assertSuccessful();

    expect(DB::table('orders')->where('is_demo', true)->count())->toBe(0)
        ->and(realRows())->toBe($before)
        ->and($golden->fresh()?->status)->toBe(OrderStatus::Paid)
        // The frozen verdict is the same bytes it was (R-12) …
        ->and(DB::table('order_line_fitments as f')->join('order_lines as l', 'l.id', '=', 'f.order_line_id')->where('l.order_id', $golden->id)->value('f.verdict'))->toBe($snapshot)
        // … and the shop still answers for the car as it did.
        ->and($resolver->resolve((int) $vehicle->id, (int) $config->id)->isSellable())->toBeTrue();
});

it('shows one paid order as the one figure it is', function (): void {
    $order = Order::factory()->create(['placed_at' => now()->subHour(), 'paid_at' => now()->subHour(), 'is_demo' => false]);

    $this->actingAs(dropInAdmin(), 'admin')->get('/admin?zeitraum=30')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Uebersicht/Index')
            ->where('demo', false)
            ->where('kpis.0.value', (int) $order->total_cents)
            ->where('kpis.1.value', 1)
            ->where('kpis.2.value', (int) $order->total_cents)
            ->has('recentOrders', 1)
            ->where('recentOrders.0.number', $order->order_number));
});

it('shows the demo set as demo, with figures in every tile', function (): void {
    config(['demo.enabled' => true]);
    $this->seed(CommerceSeeder::class);
    app(DemoDashboard::class)->seed(CarbonImmutable::today('Europe/Berlin'), 0.25);

    $this->actingAs(dropInAdmin(), 'admin')->get('/admin?zeitraum=30')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('demo', true)
            ->where('kpis.0.value', fn (mixed $value): bool => is_int($value) && $value > 0)
            ->where('kpis.1.value', fn (mixed $value): bool => is_int($value) && $value > 0)
            ->where('recentOrders', fn ($rows): bool => count($rows) > 0));
});
