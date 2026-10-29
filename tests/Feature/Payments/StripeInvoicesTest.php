<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Http\Controllers\Storefront\BestellungController;
use App\Jobs\IssueStripeInvoice;
use App\Mail\OrderConfirmationMail;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\WheelConfig;
use App\Payments\Payments;
use App\Payments\Stripe\StripeInvoices;
use App\Services\Commerce\OrderPaid;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\Support\FakeStripe;

/*
 * His admin item 17, part 2 (the operator's brief of 29.10.2026, D-361): Stripe issues the invoice for every order paid
 * through it, the way Stripe documents it for a Payment Intents integration — every row of the order its own line item
 * with 19 % VAT, inclusive, the customer's billing address, finalized, the payment that succeeded attached so the invoice
 * is paid; linked on the order page and in the mail only once Stripe has issued it. Against Stripe's API in memory.
 */

beforeEach(function (): void {
    config([
        'rimify.payments.driver' => 'stripe',
        'rimify.own_invoices' => false,
        'services.stripe.mode' => 'test',
        'services.stripe.key' => 'pk_test_fakeKey',
        'services.stripe.secret' => 'sk_test_fakeKey',
        'services.stripe.webhook_secret' => 'whsec_test_secret',
    ]);
    $this->stripe = FakeStripe::install();
    // The order page reads its lines' answers with the engine's tables.
    $this->seed(ReferenceDataSeeder::class);
});

afterEach(fn () => FakeStripe::uninstall());

/**
 * A Komplettrad set — rim, tyre, mounting, weights, each its own row — and RDKS sensors and shipping: 2.170,90 € in all,
 * paid through Stripe (the PaymentIntent made by the gateway for the order's customer, then succeeded).
 */
function invoicedOrder(int $rateBp = 1900, int $totalCents = 217_090): Order
{
    $config = WheelConfig::factory()->create();
    $order = Order::factory()->pendingPayment()->create(['subtotal_cents' => 211_100, 'shipping_cents' => 5_990, 'total_cents' => $totalCents, 'payment_method' => 'stripe']);
    $order->lines()->create([
        'kind' => 'WHEEL', 'wheel_config_id' => $config->id, 'label' => 'BORBET DB8GT2 · 8,5J × 19 ET 35 · Komplettrad', 'quantity' => 4,
        'unit_price_cents' => 50_375, 'line_total_cents' => 201_500, 'tax_rate_bp' => $rateBp, 'currency' => 'EUR',
        'components' => [
            ['key' => 'rim', 'label' => 'Felge BORBET DB8GT2', 'quantity' => 4, 'unitPriceCents' => 26_900, 'lineTotalCents' => 107_600],
            ['key' => 'tyre', 'label' => 'Reifen 245/40 R19 98Y', 'quantity' => 4, 'unitPriceCents' => 18_900, 'lineTotalCents' => 75_600],
            ['key' => 'mounting', 'label' => 'Montage und Auswuchten', 'quantity' => 4, 'unitPriceCents' => 2_500, 'lineTotalCents' => 10_000],
            ['key' => 'weights', 'label' => 'Wuchtgewichte Schwarz', 'quantity' => 4, 'unitPriceCents' => 2_075, 'lineTotalCents' => 8_300],
        ],
    ]);
    $order->lines()->create(['kind' => 'ACCESSORY', 'wheel_config_id' => null, 'label' => 'RDKS-Sensor', 'quantity' => 4, 'unit_price_cents' => 2_400, 'line_total_cents' => 9_600, 'tax_rate_bp' => $rateBp, 'currency' => 'EUR']);

    $intent = Payments::gateway()?->authorize($order->fresh());
    test()->stripe->intents[$intent->id] = ['status' => 'succeeded', 'amount_received' => $totalCents] + test()->stripe->intents[$intent->id];
    $order->forceFill(['status' => OrderStatus::Paid, 'paid_at' => now()])->save();

    return $order->fresh();
}

it('has Stripe issue the paid invoice: every row its own line with 19 % VAT inclusive, the billing address, the total to the cent @admin-217', function (): void {
    $order = invoicedOrder();
    $address = $order->billingAddress;

    app(StripeInvoices::class)->issue($order);
    $order->refresh();

    // The payment was made for the order's own customer, whose name and address Stripe prints (§ 14 UStG).
    $customer = $this->stripe->customers[$order->stripe_customer_id];
    $intent = collect($this->stripe->intents)->firstWhere('id', $order->stripe_payment_intent_id);

    expect($intent['customer'])->toBe($order->stripe_customer_id)
        ->and($customer['address'])->toMatchArray(['line1' => trim($address->street.' '.$address->house_number), 'postal_code' => $address->zip_code, 'city' => $address->city, 'country' => 'DE'])
        ->and($customer['email'])->toBe($order->customer->email);

    $invoice = $this->stripe->invoices[$order->stripe_invoice_id];
    $rate = array_values($this->stripe->taxRates)[0];

    // Six rows, as the order holds them — the set's four, the sensors, the shipping —, each with the inclusive 19 %.
    expect(collect($invoice['lines']['data'])->map(static fn (array $l): array => [$l['description'], $l['quantity'], $l['amount']])->all())->toBe([
        ['Felge BORBET DB8GT2', 4, 107_600],
        ['Reifen 245/40 R19 98Y', 4, 75_600],
        ['Montage und Auswuchten', 4, 10_000],
        ['Wuchtgewichte Schwarz', 4, 8_300],
        ['RDKS-Sensor', 4, 9_600],
        ['Versand', 1, 5_990],
    ])
        ->and($rate)->toMatchArray(['percentage' => 19.0, 'inclusive' => true, 'country' => 'DE', 'tax_type' => 'vat'])
        ->and(collect($invoice['lines']['data'])->every(static fn (array $l): bool => $l['taxes'][0]['tax_rate_details']['tax_rate'] === $rate['id']))->toBeTrue()
        ->and($invoice['total'])->toBe(217_090)
        ->and($invoice['total_excluding_tax'])->toBeLessThan(217_090)
        ->and($invoice['status'])->toBe('paid')
        ->and($invoice['amount_paid'])->toBe(217_090)
        // Collected by nobody: finalized without auto-advance, the succeeded payment attached.
        ->and($invoice['auto_advance'])->toBeFalse()
        ->and($this->stripe->to('POST', '/v1/invoices/[^/]+/attach_payment')[0]['params']['payment_intent'])->toBe($order->stripe_payment_intent_id);

    expect($order->stripe_invoice_number)->toBe($invoice['number'])
        ->and($order->stripe_invoice_pdf)->toBe($invoice['invoice_pdf'])
        ->and($order->stripe_invoice_url)->toBe($invoice['hosted_invoice_url'])
        ->and(AuditLog::query()->where('description', 'stripe_invoice.issued')->count())->toBe(1);
});

it('issues it once, and from wherever it stopped: a lost reply leaves one invoice, never two @admin-217', function (): void {
    $order = invoicedOrder();
    $this->stripe->loseReply('POST /v1/invoices/[^/]+/finalize');

    expect(fn () => app(StripeInvoices::class)->issue($order))->toThrow(Exception::class);
    // The draft is kept from the moment it exists; nothing is linked yet.
    expect($order->fresh()->stripe_invoice_id)->not->toBeNull()
        ->and($order->fresh()->stripe_invoice_pdf)->toBeNull();

    app(StripeInvoices::class)->issue($order->fresh());
    $sent = count($this->stripe->sent);
    app(StripeInvoices::class)->issue($order->fresh());

    expect($this->stripe->invoices)->toHaveCount(1)
        ->and(array_values($this->stripe->invoices)[0]['status'])->toBe('paid')
        ->and($this->stripe->to('POST', '/v1/invoiceitems'))->toHaveCount(6)
        // Done is done: a third call asks Stripe nothing.
        ->and(count($this->stripe->sent))->toBe($sent);
});

it('gives a Kleinunternehmer\'s order no VAT line, and deletes a draft that would say another amount than was paid @admin-217', function (): void {
    $small = invoicedOrder(rateBp: 0);
    app(StripeInvoices::class)->issue($small);

    expect(collect($this->stripe->to('POST', '/v1/invoiceitems'))->pluck('params.tax_rates')->filter()->all())->toBe([])
        ->and($this->stripe->taxRates)->toBe([]);

    // The rows sum to 2.170,90 €; the order says a cent more: no invoice for the wrong amount.
    $wrong = invoicedOrder(totalCents: 217_091);

    expect(fn () => app(StripeInvoices::class)->issue($wrong))->toThrow(RuntimeException::class, '217090 cents, the order to 217091');

    expect($wrong->fresh()->stripe_invoice_id)->toBeNull()
        ->and($this->stripe->to('DELETE', '/v1/invoices/[^/]+'))->toHaveCount(1)
        ->and(collect($this->stripe->invoices)->where('customer', $wrong->stripe_customer_id)->all())->toBe([]);
});

it('links the invoice in the mail and on the order page only once Stripe has issued it — and never calls a real order a test purchase @admin-217', function (): void {
    Mail::fake();
    Queue::fake();
    $order = invoicedOrder();

    app(OrderPaid::class)->handle($order);
    $order->refresh();

    Mail::assertSent(OrderConfirmationMail::class, function (OrderConfirmationMail $mail) use ($order): bool {
        $with = $mail->content()->with;

        return $mail->envelope()->subject === "Deine Bestellung {$order->order_number} bei RIMIFY – Bestätigung und Rechnung"
            && $with['stripeInvoiceNumber'] === $order->stripe_invoice_number
            && $with['stripeInvoiceUrl'] === $order->stripe_invoice_url;
    });

    // Stripe refuses: the mail goes, without a link and without „Rechnung“ — and the invoice is tried again.
    Mail::fake();
    $this->stripe->refuse('POST /v1/invoices', 500, 'Stripe is down');
    $refused = invoicedOrder();

    app(OrderPaid::class)->handle($refused);

    Mail::assertSent(OrderConfirmationMail::class, static fn (OrderConfirmationMail $mail): bool => $mail->envelope()->subject === "Deine Bestellung {$refused->order_number} bei RIMIFY – Bestätigung"
        && $mail->content()->with['stripeInvoiceUrl'] === null);
    Queue::assertPushed(IssueStripeInvoice::class, static fn (IssueStripeInvoice $job): bool => $job->orderId === $refused->id);

    expect(AuditLog::query()->where('description', 'stripe_invoice.failed')->count())->toBe(1)
        ->and($refused->fresh()->stripe_invoice_pdf)->toBeNull();

    // The order page, for the browser that placed each: Stripe's invoice by its PDF, and none where there is none yet.
    $page = fn (Order $o) => $this->withSession([BestellungController::SESSION_PLACED => [$o->order_number]])
        ->get('/bestellung/'.$o->public_id)->assertOk()->viewData('page')['props']['invoice'];

    expect($page($order))->toBe(['number' => $order->stripe_invoice_number, 'href' => $order->stripe_invoice_pdf])
        ->and($page($refused->fresh()))->toBeNull();
});

it('asks Stripe for no invoice for an order it was not paid through', function (): void {
    $order = Order::factory()->create(['payment_method' => 'sandbox']);

    app(StripeInvoices::class)->issue($order);

    expect($this->stripe->sent)->toBe([]);
});
