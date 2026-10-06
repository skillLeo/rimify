<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Exceptions\IllegalOrderTransition;
use App\Models\AuditLog;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\PaymentEvent;
use App\Models\WheelConfig;
use App\Services\Commerce\OrderPayments;
use Database\Seeders\CommerceSeeder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\Support\FakeStripe;

/*
 * Block G: the order becomes paid only on `payment_intent.succeeded` with a verified signature — never on the
 * browser reaching the return address. Every event is stored raw under a UNIQUE Stripe event id, so a repeat is a
 * no-op; the work runs in a job after the 200. Fixtures in the shape of Stripe's objects (tests/Fixtures/stripe).
 */

const WEBHOOK_SECRET = 'whsec_test_secret';

beforeEach(function (): void {
    config([
        'rimify.payments.driver' => 'stripe',
        'services.stripe.mode' => 'test',
        'services.stripe.key' => 'pk_test_fakeKey',
        'services.stripe.secret' => 'sk_test_fakeKey',
        'services.stripe.webhook_secret' => WEBHOOK_SECRET,
    ]);
    $this->stripe = FakeStripe::install();
    $this->seed(CommerceSeeder::class);
});

afterEach(fn () => FakeStripe::uninstall());

/** A pending Stripe order of 1.596,00 € with its intent, and 4 wheels reserved from a size with stock. */
function stripeOrder(array $state = []): Order
{
    $order = Order::factory()->pendingPayment()->create(['total_cents' => 159_600, 'subtotal_cents' => 159_600, 'shipping_cents' => 0, 'tax_cents' => 25_483, 'payment_method' => 'stripe', 'stripe_payment_intent_id' => 'pi_fake000001', 'expires_at' => now()->addDay()] + $state);
    $config = WheelConfig::query()->where('stock_qty', '>=', 4)->firstOrFail();
    $order->lines()->create(['kind' => 'WHEEL', 'wheel_config_id' => $config->id, 'label' => 'Testfelge', 'quantity' => 4, 'unit_price_cents' => 39_900, 'line_total_cents' => 159_600, 'tax_rate_bp' => 1900, 'currency' => 'EUR']);
    app(OrderPayments::class)->reserve($order);

    return $order->fresh();
}

/** @param  array<string, mixed>  $object */
function deliver(string $type, array $object, ?string $id = null, ?string $secret = null): TestResponse
{
    [$payload, $signature] = FakeStripe::event($type, $object, $secret ?? WEBHOOK_SECRET, $id);

    return test()->call('POST', '/webhooks/stripe', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $signature, 'CONTENT_TYPE' => 'application/json'], $payload);
}

/** @return array<string, mixed> */
function intent(Order $order, array $changes = []): array
{
    return array_replace(FakeStripe::fixture('payment_intent'), ['id' => $order->stripe_payment_intent_id, 'amount' => $order->total_cents, 'amount_received' => $order->total_cents, 'metadata' => ['order_id' => (string) $order->id, 'order_number' => $order->order_number]], $changes);
}

it('pays the order on a signed payment_intent.succeeded, stores the event raw and audits the move with its id', function (): void {
    $order = stripeOrder();

    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']), 'evt_paid_1')
        ->assertOk()->assertJson(['received' => true, 'duplicate' => false]);

    $event = PaymentEvent::query()->sole();

    expect($order->fresh()->status)->toBe(OrderStatus::Paid)
        ->and($order->fresh()->paid_at)->not->toBeNull()
        ->and($order->fresh()->payment_flag)->toBeNull()
        ->and($event->event_id)->toBe('evt_paid_1')
        ->and($event->order_id)->toBe($order->id)
        ->and(json_decode($event->payload, true)['type'])->toBe('payment_intent.succeeded')
        ->and($event->processed_at)->not->toBeNull()
        ->and($event->outcome)->toBe('succeeded');

    $entry = AuditLog::query()->where('description', 'order.status_changed')->sole();

    expect($entry->properties['event_id'])->toBe('evt_paid_1')
        ->and($entry->properties['from'])->toBe('PENDING_PAYMENT')
        ->and($entry->properties['to'])->toBe('PAID')
        ->and($entry->actor_email)->toBe('Stripe');
});

it('refuses a webhook whose signature does not verify, and stores nothing', function (): void {
    $order = stripeOrder();

    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']), secret: 'whsec_another_secret')->assertStatus(400);

    [$payload] = FakeStripe::event('payment_intent.succeeded', intent($order), WEBHOOK_SECRET);
    $this->call('POST', '/webhooks/stripe', [], [], [], ['CONTENT_TYPE' => 'application/json'], $payload)->assertStatus(400);

    expect(PaymentEvent::query()->count())->toBe(0)
        ->and($order->fresh()->status)->toBe(OrderStatus::PendingPayment);
});

it('treats a replayed event as a no-op', function (): void {
    $order = stripeOrder();

    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']), 'evt_once')->assertOk();
    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']), 'evt_once')
        ->assertOk()->assertJson(['duplicate' => true]);

    expect(PaymentEvent::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('description', 'order.status_changed')->count())->toBe(1);
});

// The brief „AFTER CI“, §5: the replay is refused by the unique index itself, not only by the lookup before it — two
// deliveries at once both find nothing, and the database lets one of them store the event.
it('stores a racing second delivery of one event never: the unique index refuses it, and it is answered as a repeat', function (): void {
    $order = stripeOrder();
    $raced = false;

    // The other delivery stores the event between this one's lookup and its insert, as two requests at once do.
    PaymentEvent::creating(static function (PaymentEvent $event) use (&$raced): void {
        if (! $raced) {
            $raced = true;
            DB::table('payment_events')->insert(['provider' => $event->provider, 'event_id' => $event->event_id, 'type' => $event->type, 'payload' => $event->payload, 'received_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        }
    });

    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']), 'evt_race')
        ->assertOk()->assertJson(['received' => true, 'duplicate' => true]);

    expect($raced)->toBeTrue()
        ->and(PaymentEvent::query()->where('event_id', 'evt_race')->count())->toBe(1)
        // This delivery did nothing with it: the one that stored it does the work.
        ->and(AuditLog::query()->where('description', 'order.status_changed')->count())->toBe(0)
        // And the index alone, without the app in front of it.
        ->and(fn () => DB::table('payment_events')->insert(['provider' => 'stripe', 'event_id' => 'evt_race', 'type' => 'payment_intent.succeeded', 'payload' => '{}', 'received_at' => now()]))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('keeps an order paid when processing arrives after succeeded', function (): void {
    $order = stripeOrder();

    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']), 'evt_b')->assertOk();
    deliver('payment_intent.processing', intent($order, ['status' => 'processing']), 'evt_a')->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Paid)
        ->and(PaymentEvent::query()->where('event_id', 'evt_a')->value('outcome'))->toBe('ignored: PAID');
});

it('stores an event for an order that does not exist, answers 200 and changes nothing', function (): void {
    deliver('payment_intent.succeeded', array_replace(FakeStripe::fixture('payment_intent'), ['id' => 'pi_nobody', 'status' => 'succeeded', 'metadata' => ['order_id' => '999999']]), 'evt_orphan')->assertOk();

    expect(PaymentEvent::query()->where('event_id', 'evt_orphan')->value('outcome'))->toBe('no order')
        ->and(PaymentEvent::query()->where('event_id', 'evt_orphan')->value('order_id'))->toBeNull();
});

it('holds an order in „Zahlung läuft“ while SEPA or Klarna settle, and pays it when they do', function (): void {
    $order = stripeOrder();

    deliver('payment_intent.processing', intent($order, ['status' => 'processing']))->assertOk();
    expect($order->fresh()->status)->toBe(OrderStatus::Processing)
        ->and($order->fresh()->status->labelDe())->toBe('Zahlung läuft');

    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']))->assertOk();
    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

it('records a declined payment and keeps the stock for the retry; a cancelled one gives it back', function (): void {
    $order = stripeOrder();
    $config = WheelConfig::query()->findOrFail($order->lines()->value('wheel_config_id'));
    $stock = $config->stock_qty;

    deliver('payment_intent.payment_failed', intent($order, ['status' => 'requires_payment_method', 'last_payment_error' => ['message' => 'Your card was declined.', 'code' => 'card_declined']]))->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Failed)
        ->and($order->fresh()->payment_error)->toBe('Your card was declined.')
        ->and($config->fresh()->stock_qty)->toBe($stock);

    deliver('payment_intent.canceled', intent($order, ['status' => 'canceled']))->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and($config->fresh()->stock_qty)->toBe($stock + 4)
        ->and($order->fresh()->stock_reserved)->toBeFalse();
});

it('marks a partial refund and then a full one from charge.refunded', function (): void {
    $order = stripeOrder();
    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']))->assertOk();
    $charge = array_replace(FakeStripe::fixture('charge'), ['payment_intent' => $order->stripe_payment_intent_id, 'amount' => $order->total_cents]);

    deliver('charge.refunded', array_replace($charge, ['amount_refunded' => 39_900]))->assertOk();
    expect($order->fresh()->status)->toBe(OrderStatus::PartiallyRefunded)
        ->and($order->fresh()->refunded_cents)->toBe(39_900);

    deliver('charge.refunded', array_replace($charge, ['amount_refunded' => 159_600, 'refunded' => true]))->assertOk();
    expect($order->fresh()->status)->toBe(OrderStatus::Refunded)
        ->and($order->fresh()->refunded_cents)->toBe(159_600);
});

it('files a dispute with its reason, amount and evidence deadline, and closes it with the outcome', function (): void {
    $order = stripeOrder();
    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded']))->assertOk();
    $dispute = array_replace(FakeStripe::fixture('dispute'), ['payment_intent' => $order->stripe_payment_intent_id, 'amount' => $order->total_cents]);

    deliver('charge.dispute.created', $dispute)->assertOk();

    $filed = Dispute::query()->sole();

    expect($filed->order_id)->toBe($order->id)
        ->and($filed->reason)->toBe('product_not_received')
        ->and($filed->amount_cents)->toBe(159_600)
        ->and($filed->evidence_due_by?->getTimestamp())->toBe(1760300000)
        ->and($filed->isOpen())->toBeTrue()
        ->and(AuditLog::query()->where('description', 'dispute.opened')->count())->toBe(1);

    deliver('charge.dispute.closed', array_replace($dispute, ['status' => 'won']))->assertOk();

    expect($filed->fresh()->outcome)->toBe('won')
        ->and($filed->fresh()->isOpen())->toBeFalse();
});

it('flags a payment whose amount is not the order total, and refuses to fulfil it', function (): void {
    $order = stripeOrder();

    deliver('payment_intent.succeeded', intent($order, ['status' => 'succeeded', 'amount' => 100, 'amount_received' => 100]))->assertOk();

    $paid = $order->fresh();

    expect($paid->status)->toBe(OrderStatus::Paid)
        ->and($paid->payment_flag)->toBe("Betrag stimmt nicht: bezahlt wurden 1,00\u{202F}€, die Bestellung lautet auf 1.596,00\u{202F}€. Erst prüfen, dann versenden.")
        ->and(fn () => $paid->forceFill(['status' => OrderStatus::Shipped->value])->save())->toThrow(IllegalOrderTransition::class);
});

it('answers 503 while no Stripe driver is in force, so Stripe delivers again later', function (): void {
    config(['services.stripe.secret' => null]);

    deliver('payment_intent.succeeded', ['id' => 'pi_x'])->assertStatus(503);
    expect(PaymentEvent::query()->count())->toBe(0);
});
