<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\WheelConfig;
use App\Payments\PaymentConfig;
use App\Payments\PaymentFailure;
use App\Payments\Payments;
use App\Payments\Stripe\StripeGateway;
use App\Services\Commerce\OrderPayments;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Artisan;
use Tests\Support\FakeStripe;

/*
 * Block G: StripeGateway behind PaymentGateway, against Stripe's API in memory (FakeStripe) — the driver's real
 * requests, the SDK's real parsing and exceptions, no network.
 */

beforeEach(function (): void {
    config([
        'rimify.payments.driver' => 'stripe',
        'services.stripe.mode' => 'test',
        'services.stripe.key' => 'pk_test_fakeKey',
        'services.stripe.secret' => 'sk_test_fakeKey',
        'services.stripe.webhook_secret' => 'whsec_test_secret',
    ]);
    $this->stripe = FakeStripe::install();
    $this->gateway = Payments::gateway();
});

afterEach(fn () => FakeStripe::uninstall());

it('is the driver in force once all three test keys are, and none without one of them', function (): void {
    expect($this->gateway)->toBeInstanceOf(StripeGateway::class)
        ->and(PaymentConfig::current()->summary())->toBe(['source' => '.env', 'mode' => 'test', 'publishable' => 'eKey', 'secret' => 'eKey', 'webhook' => 'cret', 'complete' => true]);

    config(['services.stripe.webhook_secret' => null]);
    expect(Payments::gateway())->toBeNull();

    // A live key is never used outside production, whatever the mode says (R-16).
    config(['services.stripe.webhook_secret' => 'whsec_test_secret', 'services.stripe.secret' => 'sk_live_fakeKey']);
    expect(Payments::gateway())->toBeNull();
});

it('creates one PaymentIntent per order, at the order total from the server, in euro, with automatic payment methods', function (): void {
    $order = Order::factory()->pendingPayment()->create(['total_cents' => 159_600, 'payment_method' => 'stripe']);

    $first = $this->gateway->authorize($order);
    $again = $this->gateway->authorize($order->fresh());

    $created = $this->stripe->to('POST', '/v1/payment_intents');

    expect($created)->toHaveCount(1)
        ->and($created[0]['params']['amount'])->toBe(159_600)
        ->and($created[0]['params']['currency'])->toBe('eur')
        // As it goes over the wire: the SDK form-encodes a boolean as `true`.
        ->and($created[0]['params']['automatic_payment_methods'])->toBe(['enabled' => 'true'])
        ->and($created[0]['params']['metadata'])->toBe(['order_id' => (string) $order->id, 'order_number' => $order->order_number])
        ->and($created[0]['headers']['idempotency-key'])->toBe('rmf-pi-'.$order->order_number.'-159600')
        ->and($first->id)->toBe($again->id)
        ->and($first->amountCents)->toBe(159_600)
        ->and($first->clientSecret)->toBe($first->id.'_secret_fake')
        ->and($order->fresh()->stripe_payment_intent_id)->toBe($first->id);
});

it('creates no second intent on a double click: the same idempotency key answers the same intent', function (): void {
    $order = Order::factory()->pendingPayment()->create(['total_cents' => 49_900, 'payment_method' => 'stripe']);

    // Two requests racing before either stored the intent's id on the order.
    $a = $this->gateway->authorize($order);
    $b = (new StripeGateway(PaymentConfig::current()))->authorize(Order::query()->whereKey($order->id)->firstOrFail()->forceFill(['stripe_payment_intent_id' => null]));

    expect($a->id)->toBe($b->id)
        ->and($this->stripe->intents)->toHaveCount(1);
});

it('says the provider refused in its own words, and the customer in German', function (): void {
    $order = Order::factory()->pendingPayment()->create(['payment_method' => 'stripe']);
    $this->stripe->refuse('POST /v1/payment_intents', 400, 'Amount must be at least €0.50 eur', code: 'amount_too_small');

    try {
        $this->gateway->authorize($order);
        $this->fail('No PaymentFailure');
    } catch (PaymentFailure $e) {
        expect($e->providerMessage)->toBe('Amount must be at least €0.50 eur')
            ->and($e->customerMessage)->toStartWith('Die Zahlung konnte gerade nicht vorbereitet werden.');
    }
});

it('refunds through the API with the amount and an idempotency key', function (): void {
    $order = Order::factory()->create(['total_cents' => 159_600, 'payment_method' => 'stripe', 'stripe_payment_intent_id' => 'pi_fake000009']);

    $result = $this->gateway->refund($order, 39_900, 'Eine Felge beschädigt angekommen', 'rmf-refund-'.$order->order_number.'-1');

    $sent = $this->stripe->to('POST', '/v1/refunds')[0];

    expect($result->status)->toBe('succeeded')
        ->and($result->amountCents)->toBe(39_900)
        ->and($sent['params']['payment_intent'])->toBe('pi_fake000009')
        ->and($sent['params']['amount'])->toBe(39_900)
        ->and($sent['headers']['idempotency-key'])->toBe('rmf-refund-'.$order->order_number.'-1');
});

it('tests the connection: the account name, country, currency and the methods it may take — or Stripe’s error', function (): void {
    $account = $this->gateway->account();

    expect($account->ok)->toBeTrue()
        ->and($account->name)->toBe('RIMIFY')
        ->and($account->country)->toBe('DE')
        ->and($account->currency)->toBe('EUR')
        ->and($account->methods)->toBe(['Karte (mit Apple Pay und Google Pay)', 'SEPA-Lastschrift', 'Klarna', 'Link'])
        ->and($account->live)->toBeFalse();

    $this->stripe->refuse('GET /v1/account', 401, 'Invalid API Key provided: sk_test_****eKey', 'invalid_request_error');

    expect($this->gateway->account()->toArray())->toMatchArray(['ok' => false, 'error' => 'Invalid API Key provided: sk_test_****eKey']);
});

it('expires an order unpaid for 24 hours: the intent cancelled at Stripe, the stock back on the shelf', function (): void {
    $this->seed(CommerceSeeder::class);
    $order = Order::factory()->pendingPayment()->create(['total_cents' => 159_600, 'payment_method' => 'stripe', 'placed_at' => now()->subHours(25)]);
    $config = WheelConfig::query()->where('stock_qty', '>=', 4)->firstOrFail();
    $order->lines()->create(['kind' => 'WHEEL', 'wheel_config_id' => $config->id, 'label' => 'Testfelge', 'quantity' => 4, 'unit_price_cents' => 39_900, 'line_total_cents' => 159_600, 'tax_rate_bp' => 1900, 'currency' => 'EUR']);
    $stock = $config->stock_qty;
    app(OrderPayments::class)->reserve($order);
    $this->gateway->authorize($order->fresh());

    // An hour short of the day, and one still being paid (SEPA), are left alone.
    $young = Order::factory()->pendingPayment()->create(['payment_method' => 'stripe', 'expires_at' => now()->addHour()]);
    $settling = Order::factory()->status(OrderStatus::Processing)->create(['payment_method' => 'stripe', 'expires_at' => now()->subHour()]);

    Artisan::call('orders:expire');

    expect($order->fresh()->status)->toBe(OrderStatus::Expired)
        ->and($config->fresh()->stock_qty)->toBe($stock)
        ->and($this->stripe->intents[$order->fresh()->stripe_payment_intent_id]['status'])->toBe('canceled')
        ->and($young->fresh()->status)->toBe(OrderStatus::PendingPayment)
        ->and($settling->fresh()->status)->toBe(OrderStatus::Processing);
});

it('does not expire an order whose payment Stripe will no longer stop: its webhook decides', function (): void {
    $order = Order::factory()->pendingPayment()->create(['payment_method' => 'stripe', 'expires_at' => now()->subMinute()]);
    $this->gateway->authorize($order);
    $this->stripe->setIntent($order->fresh()->stripe_payment_intent_id, ['status' => 'succeeded']);

    Artisan::call('orders:expire');

    expect($order->fresh()->status)->toBe(OrderStatus::PendingPayment);
});
