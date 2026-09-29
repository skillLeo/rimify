<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Storefront\VehicleContext;
use App\Enums\OrderStatus;
use App\Http\Controllers\Storefront\KasseController;
use App\Http\Controllers\Storefront\KasseZahlungController;
use App\Mail\OrderConfirmationMail;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Commerce\CheckoutShown;
use App\Services\Commerce\OrderPayments;
use App\Services\Storefront\Basket;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\Support\FakeStripe;

/*
 * Block G: paying at the checkout with Stripe. The page gets the publishable key and a token of what it shows; the
 * server decides everything again at „Zahlungspflichtig bestellen“ — refusals, stock, the verdicts and prices the
 * customer was shown — writes the order and creates the PaymentIntent at the order's total. The browser confirms;
 * arriving back at the return address pays nothing; only the signed webhook does, and only then is the basket
 * emptied, the §14 invoice issued and the confirmation mail sent. Stripe is FakeStripe.
 */

const CHECKOUT_WEBHOOK_SECRET = 'whsec_test_checkout';

beforeEach(function (): void {
    // A shop with wheels in it, as the storefront tests have (tests/Pest.php): published, not demo — under test only.
    CatalogueSeeder::$shopFixture = true;
    $this->seed(CommerceSeeder::class);
    config([
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'stripe',
        'services.stripe.mode' => 'test',
        'services.stripe.key' => 'pk_test_fakeKey',
        'services.stripe.secret' => 'sk_test_fakeKey',
        'services.stripe.webhook_secret' => CHECKOUT_WEBHOOK_SECRET,
        'rimify.shipping.cost_cents' => 0,
        'rimify.shipping.free_from_cents' => null,
        'rimify.shipping.delivery_time' => '3–5 Werktage',
    ]);
    $this->stripe = FakeStripe::install();
    Storage::fake('local');
    Mail::fake();

    $this->vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $resolver = app(FitmentResolver::class);
    // A real model (a demo one is never sold), with stock for two orders of four.
    $this->config = WheelConfig::query()->whereHas('wheelModel', fn ($q) => $q->where('is_demo', false))->orderBy('id')->get()
        ->first(fn (WheelConfig $c): bool => $resolver->resolve((int) $this->vehicle->id, (int) $c->id)->isSellable());

    expect($this->config)->not->toBeNull('the seeded catalogue must offer a sellable real size for the 330i');
    $this->config->forceFill(['stock_qty' => 20])->save();
});

afterEach(function (): void {
    FakeStripe::uninstall();
    CatalogueSeeder::$shopFixture = false;
});

function checkoutCookies(Vehicle $vehicle): array
{
    return [VehicleContext::COOKIE => (new VehicleContext((int) $vehicle->id, true))->encode()];
}

function checkoutBasket(WheelConfig $config, int $quantity = 4): array
{
    return [Basket::SESSION_KEY => ['wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => $quantity]]];
}

/** @return array<string, mixed> */
function checkoutForm(array $over = []): array
{
    return [
        'email' => 'kunde@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', ...$over,
    ];
}

/** What the checkout page shows, as its token. */
function checkoutShown(object $test): string
{
    $shown = null;

    $test->withCookies(checkoutCookies($test->vehicle))->withSession(checkoutBasket($test->config))->get('/kasse')->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$shown) {
            $shown = $page->toArray()['props']['shown'];

            return $page;
        });

    return (string) $shown;
}

function checkoutPay(object $test, array $form = [], ?string $shown = null): TestResponse
{
    return $test->withCookies(checkoutCookies($test->vehicle))->withSession(checkoutBasket($test->config))->withCredentials()
        ->postJson('/kasse/zahlung', checkoutForm($form) + ['shown' => $shown ?? checkoutShown($test)]);
}

it('gives the page the publishable key, the test mode and the token of what it shows', function (): void {
    $this->withCookies(checkoutCookies($this->vehicle))->withSession(checkoutBasket($this->config))->get('/kasse')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Kasse/Index')
            ->where('payment.publishableKey', 'pk_test_fakeKey')
            ->where('payment.testMode', true)
            ->where('deliveryTime', '3–5 Werktage')
            ->where('orderRefusal', null)
            ->where('shown', fn (string $shown): bool => preg_match('/^[a-f0-9]{16}\.[a-f0-9]{16}$/', $shown) === 1)
            ->where('lines.0.verdict.sentence', fn (string $s): bool => str_starts_with($s, 'Für dein Fahrzeug freigegeben'))
            ->where('lines.0.verdict.basis', fn ($basis): bool => count($basis) >= 1));
});

it('admits Stripe.js on the checkout alone, and lets its frames ask for Apple Pay and Google Pay', function (): void {
    $kasse = $this->withCookies(checkoutCookies($this->vehicle))->withSession(checkoutBasket($this->config))->get('/kasse');
    $csp = (string) $kasse->headers->get('Content-Security-Policy');

    expect($csp)->toContain('script-src')->toContain('https://js.stripe.com')
        ->and($csp)->toContain('frame-src \'self\' https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com')
        ->and($csp)->toContain('connect-src \'self\' https://api.stripe.com')
        ->and((string) $kasse->headers->get('Permissions-Policy'))->toContain('payment=(self "https://js.stripe.com")')
        ->and((string) $kasse->headers->get('Cross-Origin-Opener-Policy'))->toBe('same-origin-allow-popups');

    // Every other page: no third-party origin at all (TTDSG).
    $home = $this->get('/warenkorb');

    expect((string) $home->headers->get('Content-Security-Policy'))->not->toContain('stripe')
        ->and((string) $home->headers->get('Permissions-Policy'))->toContain('payment=(self)');
});

it('writes the order, reserves its stock and answers with the client secret of an intent at the order total', function (): void {
    $stock = (int) $this->config->stock_qty;

    $response = checkoutPay($this)->assertOk()->assertJsonStructure(['order', 'clientSecret', 'returnUrl']);
    $order = Order::query()->where('order_number', $response->json('order'))->sole();
    $created = $this->stripe->to('POST', '/v1/payment_intents');

    expect($order->status)->toBe(OrderStatus::PendingPayment)
        ->and($order->payment_method)->toBe('stripe')
        ->and($order->total_cents)->toBe((int) $this->config->price_cents * 4)
        ->and((int) $this->config->fresh()->stock_qty)->toBe($stock - 4)
        ->and($created)->toHaveCount(1)
        ->and((int) $created[0]['params']['amount'])->toBe($order->total_cents)
        ->and($created[0]['params']['currency'])->toBe('eur')
        ->and($created[0]['headers']['idempotency-key'])->toBe('rmf-pi-'.$order->order_number.'-'.$order->total_cents)
        ->and($response->json('clientSecret'))->toBe($order->stripe_payment_intent_id.'_secret_fake')
        ->and($response->json('returnUrl'))->toBe(route('bestellung.show', ['order' => $order->order_number]))
        // Not paid yet, and the basket is still the customer's.
        ->and(session(Basket::SESSION_KEY))->not->toBe([]);
});

it('answers a second press with the same order and the same payment, never a second one', function (): void {
    $shown = checkoutShown($this);
    $first = checkoutPay($this, [], $shown)->assertOk();
    $second = $this->withCookies(checkoutCookies($this->vehicle))->withCredentials()->postJson('/kasse/zahlung', checkoutForm() + ['shown' => $shown])->assertOk();

    expect($second->json('order'))->toBe($first->json('order'))
        ->and($second->json('clientSecret'))->toBe($first->json('clientSecret'))
        ->and(Order::query()->where('payment_method', 'stripe')->count())->toBe(1)
        ->and($this->stripe->to('POST', '/v1/payment_intents'))->toHaveCount(1);
});

it('cancels the unpaid order and writes a new one when the address changed between two presses', function (): void {
    $stock = (int) $this->config->stock_qty;
    $shown = checkoutShown($this);
    $first = checkoutPay($this, [], $shown)->assertOk();
    $second = $this->withCookies(checkoutCookies($this->vehicle))->withCredentials()->postJson('/kasse/zahlung', checkoutForm(['street' => 'Nebenstraße']) + ['shown' => $shown])->assertOk();

    $old = Order::query()->where('order_number', $first->json('order'))->sole();

    expect($second->json('order'))->not->toBe($first->json('order'))
        ->and($old->status)->toBe(OrderStatus::Cancelled)
        ->and($this->stripe->intents[$old->stripe_payment_intent_id]['status'])->toBe('canceled')
        ->and((int) $this->config->fresh()->stock_qty)->toBe($stock - 4);
});

it('stops the payment with its own sentence when a verdict or a price changed since the page was shown', function (string $which, string $sentence): void {
    [$fitment, $prices] = explode('.', checkoutShown($this));
    $stale = $which === 'fitment' ? str_repeat('0', 16).'.'.$prices : $fitment.'.'.str_repeat('0', 16);

    checkoutPay($this, [], $stale)->assertStatus(409)->assertJson(['refusal' => $sentence, 'reload' => true]);

    expect(Order::query()->where('payment_method', 'stripe')->count())->toBe(0)
        ->and($this->stripe->to('POST', '/v1/payment_intents'))->toBe([]);
})->with([
    'a Gutachten or verdict changed' => ['fitment', CheckoutShown::FITMENT_CHANGED],
    'a price changed' => ['prices', CheckoutShown::PRICE_CHANGED],
]);

it('notices a changed price in the basket by itself, not only in the token', function (): void {
    $shown = checkoutShown($this);
    $this->config->forceFill(['price_cents' => (int) $this->config->price_cents + 100])->save();

    checkoutPay($this, [], $shown)->assertStatus(409)->assertJson(['refusal' => CheckoutShown::PRICE_CHANGED]);
});

it('answers the form’s own mistakes as 422, field by field, and writes nothing', function (): void {
    checkoutPay($this, ['zip' => '5066', 'email' => 'kein-at'])->assertStatus(422)->assertJsonValidationErrors(['zip', 'email']);

    expect(Order::query()->where('payment_method', 'stripe')->count())->toBe(0);
});

it('refuses a real order without a delivery time, and lets a test order go with a note saying so', function (): void {
    config(['rimify.shipping.delivery_time' => null]);

    // Stripe in Testmodus: no money moves, and the order records what it went without.
    $number = checkoutPay($this)->assertOk()->json('order');

    expect((string) Order::query()->where('order_number', $number)->value('note'))->toContain('Die Lieferzeit ist noch nicht festgelegt.');

    // The live shop, with live keys: the delivery time must be named before anyone pays (Art. 246a § 1 Nr. 7 EGBGB).
    app()['env'] = 'production';

    try {
        config(['rimify.review.enabled' => false, 'services.stripe.mode' => 'live', 'services.stripe.key' => 'pk_live_fakeKey', 'services.stripe.secret' => 'sk_live_fakeKey']);

        $this->withCookies(checkoutCookies($this->vehicle))->withSession(checkoutBasket($this->config))->get('/kasse')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('payment.testMode', false)->where('orderRefusal', KasseController::DELIVERY_REFUSAL));
    } finally {
        app()['env'] = 'testing';
    }
});

it('pays nothing at the return address: the order waits for the webhook, and so does the basket', function (): void {
    $number = checkoutPay($this)->assertOk()->json('order');
    $order = Order::query()->where('order_number', $number)->sole();

    $this->get('/bestellung/'.$number.'?payment_intent='.$order->stripe_payment_intent_id.'&payment_intent_client_secret=x&redirect_status=succeeded')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('payment.state', 'confirming')->where('payment.poll', true));

    $this->getJson('/bestellung/'.$number.'/status')->assertOk()->assertJson(['state' => 'confirming']);

    expect($order->fresh()->status)->toBe(OrderStatus::PendingPayment)
        ->and(session(Basket::SESSION_KEY))->not->toBe([])
        ->and(Invoice::query()->count())->toBe(0);
    Mail::assertNothingSent();
});

it('is paid by the signed webhook: basket emptied, invoice = order = intent to the cent, the mail with AGB and Widerruf', function (): void {
    $number = checkoutPay($this)->assertOk()->json('order');
    $order = Order::query()->where('order_number', $number)->sole();
    $intent = $this->stripe->intents[$order->stripe_payment_intent_id];

    [$payload, $signature] = FakeStripe::event('payment_intent.succeeded', ['status' => 'succeeded', 'amount_received' => $intent['amount']] + $intent, CHECKOUT_WEBHOOK_SECRET);
    $this->call('POST', '/webhooks/stripe', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $signature, 'CONTENT_TYPE' => 'application/json'], $payload)->assertOk();

    $this->getJson('/bestellung/'.$number.'/status')->assertOk()->assertJson(['state' => 'paid']);
    $invoice = Invoice::query()->where('order_id', $order->id)->sole();

    expect($order->fresh()->status)->toBe(OrderStatus::Paid)
        ->and(session(Basket::SESSION_KEY, []))->toBe([])
        ->and(session(KasseZahlungController::SESSION_PENDING))->toBeNull()
        // One figure, three places: the invoice, the order, the PaymentIntent.
        ->and($invoice->gross_cents)->toBe($order->total_cents)
        ->and($invoice->gross_cents)->toBe((int) $intent['amount'])
        ->and($invoice->net_cents + $invoice->tax_cents)->toBe($invoice->gross_cents)
        // Stripe in Testmodus: the TEST series, so the real one stays unbroken.
        ->and($invoice->number)->toBe('TEST-RE-000001')
        ->and(Storage::disk('local')->exists($invoice->pdf_key))->toBeTrue()
        ->and(str_starts_with($invoice->pdf_key, 'invoices/'))->toBeTrue();

    Mail::assertSent(OrderConfirmationMail::class, function (OrderConfirmationMail $mail) use ($invoice): bool {
        $html = $mail->render();

        return $mail->hasTo('kunde@beispiel.de')
            && $mail->invoice->is($invoice)
            && str_contains($html, 'Allgemeine Geschäftsbedingungen')
            && str_contains($html, 'Widerrufsbelehrung')
            && str_contains($html, 'Muster-Widerrufsformular')
            && str_contains($html, 'Hiermit widerrufe(n) ich/wir')
            && count($mail->attachments()) === 1;
    });
});

it('keeps the order and the typed data after a declined card, and takes the same order on the retry', function (): void {
    $shown = checkoutShown($this);
    $number = checkoutPay($this, [], $shown)->assertOk()->json('order');
    $order = Order::query()->where('order_number', $number)->sole();
    $intent = $this->stripe->intents[$order->stripe_payment_intent_id];

    [$payload, $signature] = FakeStripe::event('payment_intent.payment_failed', ['status' => 'requires_payment_method', 'last_payment_error' => ['message' => 'Your card was declined.']] + $intent, CHECKOUT_WEBHOOK_SECRET);
    $this->call('POST', '/webhooks/stripe', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $signature, 'CONTENT_TYPE' => 'application/json'], $payload)->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Failed);

    $this->get('/bestellung/'.$number)->assertInertia(fn (AssertableInertia $page) => $page->where('payment.state', 'failed'));

    // The retry: same order, same intent — its amount unchanged.
    $retry = $this->withCookies(checkoutCookies($this->vehicle))->withCredentials()->postJson('/kasse/zahlung', checkoutForm() + ['shown' => $shown])->assertOk();

    expect($retry->json('order'))->toBe($number)
        ->and(session(Basket::SESSION_KEY))->not->toBe([]);
});

it('lets a declined payment be paid again when the stock was enough for one order only (PAY-01)', function (): void {
    $this->config->forceFill(['stock_qty' => 4])->save();
    $shown = checkoutShown($this);
    $number = checkoutPay($this, [], $shown)->assertOk()->json('order');
    $order = Order::query()->where('order_number', $number)->sole();
    $intent = $this->stripe->intents[$order->stripe_payment_intent_id];

    expect((int) $this->config->fresh()->stock_qty)->toBe(0);

    [$payload, $signature] = FakeStripe::event('payment_intent.payment_failed', ['status' => 'requires_payment_method'] + $intent, CHECKOUT_WEBHOOK_SECRET);
    $this->call('POST', '/webhooks/stripe', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $signature, 'CONTENT_TYPE' => 'application/json'], $payload)->assertOk();

    // The goods the declined order holds are the customer's own: the Kasse is still open to them …
    $this->withCookies(checkoutCookies($this->vehicle))->get('/kasse')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('lines.0.inStock', true)->where('orderRefusal', null));

    // … and the retry takes the same order, no second reservation.
    $this->withCookies(checkoutCookies($this->vehicle))->withCredentials()->postJson('/kasse/zahlung', checkoutForm() + ['shown' => $shown])
        ->assertOk()->assertJson(['order' => $number]);

    expect((int) $this->config->fresh()->stock_qty)->toBe(0)
        ->and(Order::query()->where('payment_method', 'stripe')->count())->toBe(1);
});

it('answers the status only to the browser that placed the order', function (): void {
    $number = checkoutPay($this)->assertOk()->json('order');

    $this->flushSession();
    $this->getJson('/bestellung/'.$number.'/status')->assertNotFound();
});

it('refuses to start a payment while the payment for this order is already on its way', function (): void {
    $shown = checkoutShown($this);
    $number = checkoutPay($this, [], $shown)->assertOk()->json('order');
    app(OrderPayments::class)->move(Order::query()->where('order_number', $number)->sole(), OrderStatus::Processing, 'Stripe');

    $this->withCookies(checkoutCookies($this->vehicle))->withCredentials()->postJson('/kasse/zahlung', checkoutForm() + ['shown' => $shown])
        ->assertStatus(409)
        ->assertJson(['refusal' => sprintf(KasseZahlungController::ALREADY_PROCESSING, $number)]);
});
