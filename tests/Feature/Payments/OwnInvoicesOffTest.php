<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Mail\OrderConfirmationMail;
use App\Mail\RefundMail;
use App\Models\Address;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Refund;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\InvoiceSeries;
use App\Services\Commerce\OrderLinks;
use App\Services\Commerce\OrderPaid;
use App\Services\GoLive\GoLiveChecks;
use App\Support\Money;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/*
 * The client's reply to his admin item 17, 29.10.2026 (D-348): „Please disable this feature for now because for now
 * stripe will take care of the invoice creation and storage and in the future we would like to revisit this topic.“
 * With the shop's own invoices off nothing is issued, attached, numbered or mentioned — not in the shop, not in the
 * mails, not in the admin. The code stays (the suite runs it with the switch on); invoices issued before stay readable.
 */

beforeEach(function (): void {
    Storage::fake('local');
    config([
        'rimify.payments.driver' => 'none',
        'rimify.review.enabled' => false,
        'rimify.seller' => [
            'name' => 'Beispiel Handels GmbH', 'street' => 'Musterweg 1', 'zip' => '50667', 'city' => 'Köln',
            'email' => 'rechnung@beispiel.test', 'vat_id' => 'DE000000000', 'tax_number' => null, 'register' => null,
        ],
        // A shop whose mail leaves: the confirmation is said to be sent only then (D-347); Mail::fake() catches it.
        'mail.default' => 'smtp',
    ]);
    app(InvoiceSeries::class)->open(AdminUser::factory()->create(), 1, 1);
});

function offOrder(): Order
{
    $customer = Customer::query()->create(['email' => 'kunde@beispiel.de', 'firstname' => 'Erika', 'lastname' => 'Mustermann']);
    $address = Address::query()->create(['customer_id' => $customer->id, 'full_name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'house_number' => '12', 'zip_code' => '50667', 'city' => 'Köln', 'country' => 'DE']);
    $order = Order::factory()->create([
        'customer_id' => $customer->id, 'delivery_address_id' => $address->id, 'billing_address_id' => $address->id,
        'total_cents' => 159_600, 'subtotal_cents' => 159_600, 'shipping_cents' => 0, 'payment_method' => 'stripe',
        'tax_cents' => Money::fromMinor(159_600)->vatIncluded(1900)->toMinor(), 'status' => 'PAID', 'paid_at' => now(),
    ]);
    $order->lines()->create(['kind' => 'WHEEL', 'label' => 'Testfelge 8,5J × 18 ET45', 'quantity' => 4, 'unit_price_cents' => 39_900, 'line_total_cents' => 159_600, 'tax_rate_bp' => 1900, 'currency' => 'EUR']);

    return $order->fresh() ?? $order;
}

it('issues no invoice for a paid order and sends the confirmation without one, naming none', function (): void {
    Mail::fake();
    config(['rimify.own_invoices' => false]);
    $order = offOrder();

    app(OrderPaid::class)->handle($order);

    expect(Invoice::query()->count())->toBe(0);
    Mail::assertSent(OrderConfirmationMail::class, function (OrderConfirmationMail $mail): bool {
        $html = $mail->render();

        return $mail->attachments() !== [] ? collect($mail->attachments())->every(static fn ($a): bool => ! str_starts_with((string) $a->as, 'RE-')) && ! str_contains($html, 'Rechnung') : ! str_contains($html, 'Rechnung');
    });
    // The control: switched on, the same order gets its invoice.
    config(['rimify.own_invoices' => true]);
    app(Invoices::class)->issueFor($order);
    expect(Invoice::query()->count())->toBe(1);
});

it('issues no credit note for a refund, and the refund mail names none', function (): void {
    config(['rimify.own_invoices' => false]);
    $order = offOrder();
    $refund = Refund::query()->create(['order_id' => $order->id, 'provider' => 'stripe', 'provider_refund_id' => 're_off_1', 'amount_cents' => 39_900, 'currency' => 'EUR', 'reason' => 'Eine Felge zurückgeschickt', 'status' => 'succeeded']);

    $mail = new RefundMail($order, $refund);

    expect($mail->attachments())->toBe([])
        ->and($mail->render())->not->toContain('Gutschrift')
        ->and($mail->render())->toContain('Wir haben dir');
});

it('says nothing of an invoice on the confirmation page, and keeps an old one readable by its link', function (): void {
    $this->seed(ReferenceDataSeeder::class);
    config(['rimify.own_invoices' => true]);
    $old = offOrder();
    $invoice = app(Invoices::class)->issueFor($old);
    config(['rimify.own_invoices' => false]);

    // Issued before the switch: its signed link still opens it.
    $this->get(Invoices::link($invoice))->assertOk();

    $order = offOrder();
    $this->get(OrderLinks::link($order))
        ->assertInertia(fn (AssertableInertia $page) => $page->where('ownInvoices', false)->where('invoice', null));
});

it('shows no invoice numbers in Zahlung, and the go-live item says Stripe issues the invoices', function (): void {
    $this->seed(AccessSeeder::class);
    config(['rimify.own_invoices' => false]);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get('/admin/einstellungen/zahlung')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('ownInvoices', false));

    $item = collect(app(GoLiveChecks::class)->all())->first(static fn ($check): bool => $check->id === 'rechnung');
    expect($item)->not->toBeNull()
        ->and($item->title)->toBe('Rechnungen (§ 14 UStG): stellt Stripe aus')
        ->and($item->sentence)->toContain('Der Shop stellt keine eigenen Rechnungen aus – Stripe erstellt und speichert sie.');
});

it('records a confirmation as not mailed — and the page then says no mail went — where the shop sends no mail, as on the preview', function (): void {
    Mail::fake();
    config(['rimify.own_invoices' => false, 'mail.default' => 'log']);
    $order = offOrder();

    app(OrderPaid::class)->handle($order);

    expect(AuditLog::query()->where('description', 'order.confirmation_sent')->exists())->toBeFalse()
        ->and(AuditLog::query()->where('description', 'order.confirmation_not_mailed')->exists())->toBeTrue();
});
