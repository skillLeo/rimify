<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Storefront\VehicleContext;
use App\Enums\OrderStatus;
use App\Http\Controllers\Storefront\KasseController;
use App\Models\Address;
use App\Models\AdminUser;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Payments\Payments;
use App\Services\Admin\Orders\OrderList;
use App\Services\Storefront\Basket;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;

/**
 * The review's test payment (the review release §1): with the review on, a checkout writes the order
 * with its verdicts frozen, the test page chooses how the payment ends, and the order shows the result.
 * With the review off the sandbox does not exist, whatever the driver says, and nothing is written.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    config([
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping.cost_cents' => null,
        'rimify.shipping.free_from_cents' => null,
    ]);

    // The BMW 330i G20 (5 × 112), and a size the seeded documents permit for it.
    $this->vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $resolver = app(FitmentResolver::class);
    $this->config = WheelConfig::query()->where('stock_qty', '>', 4)->orderBy('id')->get()
        ->first(fn (WheelConfig $c): bool => $resolver->resolve((int) $this->vehicle->id, (int) $c->id)->isSellable());

    expect($this->config)->not->toBeNull('the seeded catalogue must offer a sellable size for the 330i');
});

function testzahlungCookies(Vehicle $vehicle): array
{
    return [VehicleContext::COOKIE => (new VehicleContext((int) $vehicle->id, true))->encode()];
}

function testzahlungBasket(WheelConfig $config): array
{
    return [Basket::SESSION_KEY => [
        'wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4],
    ]];
}

function testzahlungForm(): array
{
    return [
        'email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard',
    ];
}

/** Places the test order and returns it with the signed payment address it was sent to. */
function testzahlungPlace(object $test): array
{
    $response = $test->withCookies(testzahlungCookies($test->vehicle))
        ->withSession(testzahlungBasket($test->config))
        ->from('/kasse')
        ->post('/kasse', testzahlungForm());

    $response->assertSessionHasNoErrors();
    $order = Order::query()->latest('id')->firstOrFail();
    $location = (string) $response->headers->get('Location');

    expect($location)->toContain('/kasse/testzahlung/'.$order->order_number)->toContain('signature=');

    return [$order, $location];
}

it('tells the checkout it is a test order, and waives only the shipping price', function (): void {
    $this->withCookies(testzahlungCookies($this->vehicle))
        ->withSession(testzahlungBasket($this->config))
        ->get('/kasse')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('sandbox', true)->where('orderRefusal', null));
});

it('writes the order with its verdict frozen and sends the customer to the test payment', function (): void {
    [$order] = testzahlungPlace($this);

    expect($order->status)->toBe(OrderStatus::PendingPayment)
        ->and($order->payment_method)->toBe('sandbox')
        ->and($order->vehicle_id)->toBe($this->vehicle->id)
        ->and($order->vehicle_hsn)->toBe('0005')
        ->and($order->total_cents)->toBe($this->config->price_cents * 4)
        ->and((string) $order->note)->toContain('Testbestellung')
        ->and(Customer::query()->where('email', 'test@beispiel.de')->exists())->toBeTrue()
        ->and(Address::query()->where('zip_code', '50667')->where('city', 'Köln')->exists())->toBeTrue();

    $line = OrderLine::query()->where('order_id', $order->id)->sole();
    $snapshot = OrderLineFitment::query()->where('order_line_id', $line->id)->sole();
    $verdict = app(FitmentResolver::class)->resolve((int) $this->vehicle->id, (int) $this->config->id);

    expect($line->quantity)->toBe(4)
        ->and($snapshot->verdict_status)->toBe($verdict->status->value)
        ->and($snapshot->fitment_id)->toBe($verdict->snapshot->fitmentId)
        ->and($snapshot->approval_document_id)->toBe($verdict->document?->id)
        ->and($snapshot->verdict)->toBeArray()->toHaveKey('status')
        ->and(OrderList::paymentLabel('sandbox'))->toBe('Testzahlung');
});

it('pays the test order: paid, the stock taken, the basket empty, the confirmation open', function (): void {
    [$order, $location] = testzahlungPlace($this);
    $stock = (int) $this->config->stock_qty;

    $this->get($location)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Kasse/Testzahlung')
        ->where('order.number', $order->order_number)
        ->has('order.lines', 1)
    );

    $this->post($location, ['outcome' => 'bezahlt'])
        ->assertRedirect(route('bestellung.show', ['order' => $order->order_number]))
        ->assertSessionHas('toast', 'Testzahlung erfolgreich – die Bestellung ist bezahlt.');

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Paid)
        ->and($order->paid_at)->not->toBeNull()
        ->and((int) $this->config->fresh()->stock_qty)->toBe($stock - 4)
        ->and(session(Basket::SESSION_KEY, []))->toBe([]);

    // The browser that placed it sees its confirmation; paid once, the payment page is gone.
    $this->get('/bestellung/'.$order->order_number)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('order.status', OrderStatus::Paid->value));
    $this->post($location, ['outcome' => 'bezahlt'])->assertForbidden();
});

// Block G: the stock is reserved when the order is written. A declined payment keeps it for the retry until the
// order expires; a cancelled one puts it back at once.
it('keeps the stock for a declined test payment and gives it back for a cancelled one', function (string $outcome, OrderStatus $status, int $taken): void {
    $stock = (int) $this->config->stock_qty;
    [$order, $location] = testzahlungPlace($this);

    expect((int) $this->config->fresh()->stock_qty)->toBe($stock - 4);

    $this->post($location, ['outcome' => $outcome])->assertRedirect();

    expect($order->fresh()->status)->toBe($status)
        ->and((int) $this->config->fresh()->stock_qty)->toBe($stock - $taken);
})->with([
    'abgelehnt' => ['abgelehnt', OrderStatus::Failed, 4],
    'abgebrochen' => ['abgebrochen', OrderStatus::Cancelled, 0],
]);

it('refuses an unsigned or tampered payment address and an unknown outcome', function (): void {
    [$order, $location] = testzahlungPlace($this);

    $this->get('/kasse/testzahlung/'.$order->order_number)->assertForbidden();
    $this->post('/kasse/testzahlung/'.$order->order_number, ['outcome' => 'bezahlt'])->assertForbidden();
    $this->post($location, ['outcome' => 'geschenkt'])->assertSessionHasErrors('outcome');

    expect($order->fresh()->status)->toBe(OrderStatus::PendingPayment);
});

it('does not exist where the review is off, whatever the driver says', function (): void {
    config(['rimify.review.enabled' => false, 'rimify.shipping.cost_cents' => 990]);
    $before = Order::query()->count();

    expect(Payments::gateway())->toBeNull();

    $this->withCookies(testzahlungCookies($this->vehicle))
        ->withSession(testzahlungBasket($this->config))
        ->from('/kasse')
        ->post('/kasse', testzahlungForm())
        ->assertSessionHasErrors(['order' => KasseController::PREVIEW_REFUSAL]);

    expect(Order::query()->count())->toBe($before);

    // A pending order, set up directly in the table: the model would refuse moving a paid one back (Block G).
    $order = Order::query()->firstOrFail();
    Order::query()->whereKey($order->id)->update(['status' => OrderStatus::PendingPayment->value]);
    $this->get(URL::temporarySignedRoute('kasse.testzahlung', now()->addMinutes(5), ['order' => $order->order_number]))->assertForbidden();
});

it('shows a real order only to the browser that placed it or through a signed link', function (): void {
    [$order] = testzahlungPlace($this);

    $this->flushSession();
    $this->get('/bestellung/'.$order->order_number)->assertNotFound();
    $this->get(URL::signedRoute('bestellung.show', ['order' => $order->order_number]))->assertOk();
});

it('counts order numbers as numbers, so a longer or zero-padded number is never issued twice', function (): void {
    $year = now()->year;
    $template = Order::query()->firstOrFail();

    // As text, `8999` sorts above `09000`; as numbers the next is 9001.
    foreach (["RMF-{$year}-8999", "RMF-{$year}-09000"] as $number) {
        $copy = $template->replicate();
        $copy->forceFill(['order_number' => $number, 'is_demo' => false])->save();
    }

    [$order] = testzahlungPlace($this);

    expect($order->order_number)->toBe("RMF-{$year}-9001");
});

it('labels a test order as one in the admin: no money moved, whatever the status', function (): void {
    $this->seed(AccessSeeder::class);
    [$order] = testzahlungPlace($this);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')->get('/admin/bestellungen/'.$order->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('order.test', true)->where('order.paymentMethod', 'Testzahlung'));

    $this->actingAs($admin, 'admin')->get('/admin/bestellungen?q='.$order->order_number)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('orders.0.number', $order->order_number)->where('orders.0.test', true));
});
