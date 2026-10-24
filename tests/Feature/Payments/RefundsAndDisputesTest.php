<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Http\Controllers\Admin\RueckbuchungenController;
use App\Http\Middleware\EnsureSudo;
use App\Mail\RefundMail;
use App\Models\Address;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Dispute;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Refund;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\RefundOrder;
use Database\Seeders\AccessSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\Support\FakeStripe;

/*
 * Block G §5. A refund from the order page goes through Stripe's API only — full or partial, with a reason, after the
 * password again — and is written back, documented by a credit note, mailed and audited. A chargeback from the
 * webhook is listed with its deadline counted down, and answered once with evidence through the API, the invoice as
 * the receipt. Stripe is FakeStripe.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    Storage::fake('local');
    Mail::fake();
    config([
        'rimify.payments.driver' => 'stripe',
        'services.stripe.mode' => 'test',
        'services.stripe.key' => 'pk_test_fakeKey',
        'services.stripe.secret' => 'sk_test_fakeKey',
        'services.stripe.webhook_secret' => 'whsec_test_refunds',
    ]);
    $this->stripe = FakeStripe::install();

    $customer = Customer::query()->create(['email' => 'kunde@beispiel.de', 'firstname' => 'Erika', 'lastname' => 'Mustermann']);
    $address = Address::query()->create(['customer_id' => $customer->id, 'full_name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'house_number' => '12', 'zip_code' => '50667', 'city' => 'Köln', 'country' => 'DE']);
    $this->order = Order::factory()->create([
        'customer_id' => $customer->id, 'delivery_address_id' => $address->id, 'billing_address_id' => $address->id,
        'total_cents' => 159_600, 'subtotal_cents' => 159_600, 'shipping_cents' => 0, 'tax_cents' => 25_482,
        'payment_method' => 'stripe', 'stripe_payment_intent_id' => 'pi_fake000001',
    ]);
    $this->order->lines()->create(['kind' => 'WHEEL', 'label' => 'Testfelge', 'quantity' => 4, 'unit_price_cents' => 39_900, 'line_total_cents' => 159_600, 'tax_rate_bp' => 1900, 'currency' => 'EUR']);
    $this->invoice = app(Invoices::class)->issueFor($this->order);
});

afterEach(fn () => FakeStripe::uninstall());

function refundsAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function refundPost(object $test, array $form, string $role = 'super-admin'): TestResponse
{
    return $test->actingAs(refundsAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
        ->from('/admin/bestellungen/'.$test->order->id)
        ->post('/admin/bestellungen/'.$test->order->id.'/erstattung', $form);
}

it('refunds part of an order through Stripe: written back, a credit note in its own series, the mail, the Protokoll', function (): void {
    refundPost($this, ['amount' => '399,00', 'reason' => 'Eine Felge zurückgeschickt'])
        ->assertRedirect('/admin/bestellungen/'.$this->order->id)->assertSessionHasNoErrors();

    $sent = $this->stripe->to('POST', '/v1/refunds');
    $refund = Refund::query()->sole();
    $order = $this->order->fresh();
    $note = Invoice::query()->where('kind', Invoice::CREDIT_NOTE)->sole();

    expect($sent)->toHaveCount(1)
        ->and((int) $sent[0]['params']['amount'])->toBe(39_900)
        ->and($sent[0]['params']['payment_intent'])->toBe('pi_fake000001')
        ->and($sent[0]['headers']['idempotency-key'])->toBe('rmf-refund-'.$order->order_number.'-1-39900')
        ->and($refund->status)->toBe('succeeded')
        ->and($refund->credit_note_id)->toBe($note->id)
        ->and($order->status)->toBe(OrderStatus::PartiallyRefunded)
        ->and($order->refunded_cents)->toBe(39_900)
        ->and($note->number)->toBe('TEST-GS-000001')
        ->and($note->gross_cents)->toBe(39_900)
        ->and($note->corrects_invoice_id)->toBe($this->invoice->id)
        ->and(RefundOrder::refundable($order))->toBe(119_700);

    Mail::assertSent(RefundMail::class, fn (RefundMail $mail): bool => $mail->hasTo('kunde@beispiel.de') && count($mail->attachments()) === 1);

    $entry = AuditLog::query()->where('description', 'order.refunded')->sole();
    expect($entry->properties['amount_cents'])->toBe(39_900)->and($entry->actor_email)->toBe('super-admin@rimify.test');

    // The rest, then: erstattet — and the webhook's charge.refunded after it finds nothing new.
    refundPost($this, ['amount' => '1.197,00', 'reason' => 'Alles zurück'])->assertSessionHasNoErrors();
    expect($this->order->fresh()->status)->toBe(OrderStatus::Refunded)->and($this->order->fresh()->refunded_cents)->toBe(159_600);
});

it('refuses more than is left, nothing left, and an amount it cannot read — and asks Stripe for nothing', function (array $form, string $sentence): void {
    refundPost($this, $form)->assertSessionHasErrors();
    expect(session('errors')->first())->toBe($sentence)
        ->and($this->stripe->to('POST', '/v1/refunds'))->toBe([]);
})->with([
    'more than paid' => [['amount' => '1.596,01', 'reason' => 'Zu viel'], 'Höchstens 1.596,00'."\u{202F}".'€ lassen sich noch erstatten.'],
    'not an amount' => [['amount' => 'zehn', 'reason' => 'Unlesbar'], 'Gib den Betrag in Euro an, zum Beispiel 399,00.'],
    'no reason' => [['amount' => '10,00', 'reason' => ''], 'Schreib dazu, wofür erstattet wird – es steht auf der Gutschrift.'],
]);

it('says Stripe’s own refusal and records nothing', function (): void {
    $this->stripe->refuse('POST /v1/refunds', 400, 'Charge ch_1 has already been refunded.');

    refundPost($this, ['amount' => '10,00', 'reason' => 'Test'])->assertSessionHasErrors(['refund' => 'Stripe hat die Erstattung abgelehnt: Charge ch_1 has already been refunded.']);

    expect(Refund::query()->count())->toBe(0)->and($this->order->fresh()->refunded_cents)->toBe(0);
});

it('asks for the password again before money leaves, and lets no one refund who may not change orders', function (): void {
    $this->actingAs(refundsAdmin(), 'admin')->from('/admin/bestellungen/'.$this->order->id)
        ->post('/admin/bestellungen/'.$this->order->id.'/erstattung', ['amount' => '10,00', 'reason' => 'Test'])
        ->assertRedirect();
    expect(Refund::query()->count())->toBe(0);

    refundPost($this, ['amount' => '10,00', 'reason' => 'Test'], 'catalogue-manager')->assertForbidden();
    expect($this->stripe->to('POST', '/v1/refunds'))->toBe([]);
});

it('tells the password page it guards a refund, not the shop’s keys (the admin audit’s F-12)', function (): void {
    $page = '/admin/bestellungen/'.$this->order->id;
    $question = '/admin/bestaetigen?weiter='.rawurlencode($page);

    $this->actingAs(refundsAdmin(), 'admin')->from($page)
        ->post($page.'/erstattung', ['amount' => '10,00', 'reason' => 'Test'])
        ->assertRedirect($question);

    $this->actingAs(refundsAdmin(), 'admin')->get($question)
        ->assertInertia(fn (AssertableInertia $inertia) => $inertia
            ->component('Admin/Bestaetigen/Index')
            ->where('weiter', $page)
            ->where('reason', 'Eine Erstattung lässt sich nicht zurücknehmen.'));
});

it('shows the order page what was paid, the invoice, and whether a refund can be made', function (): void {
    $this->actingAs(refundsAdmin(), 'admin')->get('/admin/bestellungen/'.$this->order->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('money.paid', 159_600)
            ->where('money.refundable', 159_600)
            ->where('money.canRefund', true)
            ->where('money.papers.0.number', $this->invoice->number)
            ->where('money.papers.0.href', fn (string $href): bool => str_contains($href, 'signature=')));
});

it('lists a chargeback with its deadline counted down, and answers it once through Stripe with the invoice as receipt', function (): void {
    $dispute = Dispute::query()->create([
        'order_id' => $this->order->id, 'provider' => 'stripe', 'provider_dispute_id' => 'dp_fake1', 'charge_id' => 'ch_fake1',
        'reason' => 'product_not_received', 'amount_cents' => 159_600, 'currency' => 'EUR', 'status' => 'needs_response',
        'evidence_due_by' => now()->addDays(5)->addHour(),
    ]);

    $this->actingAs(refundsAdmin(), 'admin')->get('/admin/rueckbuchungen')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Rueckbuchungen/Index')
            ->where('disputes.0.reason', 'Ware nicht erhalten')
            ->where('disputes.0.daysLeft', 5)
            ->where('disputes.0.order.number', $this->order->order_number));

    $this->actingAs(refundsAdmin(), 'admin')->from('/admin/rueckbuchungen')
        ->post('/admin/rueckbuchungen/'.$dispute->id.'/nachweise', [
            'note' => 'Bestellt am 01.10., versandt am 02.10. mit DHL, zugestellt am 04.10. – Sendungsnummer im Anhang.',
            'shipping' => UploadedFile::fake()->create('zustellnachweis.pdf', 40, 'application/pdf'),
        ])
        ->assertRedirect('/admin/rueckbuchungen')->assertSessionHas('toast', RueckbuchungenController::SENT);

    $update = $this->stripe->to('POST', '/v1/disputes/dp_fake1');
    $files = $this->stripe->to('POST', '/v1/files');

    expect($files)->toHaveCount(2)
        ->and($update)->toHaveCount(1)
        ->and($update[0]['params']['submit'])->toBe('true')
        ->and($update[0]['params']['evidence'])->toHaveKeys(['uncategorized_text', 'shipping_documentation', 'receipt'])
        ->and($dispute->fresh()->evidence_submitted_at)->not->toBeNull()
        ->and($dispute->fresh()->evidence['receipt'])->toBe($this->invoice->number);

    // Once only.
    $this->actingAs(refundsAdmin(), 'admin')->from('/admin/rueckbuchungen')
        ->post('/admin/rueckbuchungen/'.$dispute->id.'/nachweise', ['note' => str_repeat('Noch einmal, bitte. ', 3)])
        ->assertSessionHasErrors('evidence');
    expect($this->stripe->to('POST', '/v1/disputes/dp_fake1'))->toHaveCount(1);
});

it('takes a simulated chargeback from the webhook onto the Rückbuchungen page', function (): void {
    $object = array_replace(FakeStripe::fixture('dispute'), ['id' => 'dp_hook1', 'payment_intent' => 'pi_fake000001', 'reason' => 'fraudulent', 'amount' => 159_600, 'status' => 'needs_response', 'evidence_details' => ['due_by' => now()->addDays(7)->getTimestamp()]]);
    [$payload, $signature] = FakeStripe::event('charge.dispute.created', $object, 'whsec_test_refunds');

    $this->call('POST', '/webhooks/stripe', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $signature, 'CONTENT_TYPE' => 'application/json'], $payload)->assertOk();

    $this->actingAs(refundsAdmin(), 'admin')->get('/admin/rueckbuchungen')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('disputes.0.reference', 'dp_hook1')
            ->where('disputes.0.reason', 'Nicht autorisiert (Betrug gemeldet)')
            ->where('disputes.0.order.number', $this->order->order_number)
            ->where('disputes.0.open', true));
});
