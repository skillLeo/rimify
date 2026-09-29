<?php

declare(strict_types=1);

use App\Models\Address;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Refund;
use App\Services\Commerce\Invoices;
use App\Support\Money;
use App\Support\Seller;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/*
 * Block G, item 19: §14 UStG invoices. Numbered without a gap and never twice, per series; credit notes in their
 * own; stored once under invoices/ on the private disk with their checksum; served by a signed link only; never
 * changed, never deleted. A test order, or a seller whose data is incomplete, gets the TEST series.
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
    ]);
});

function invoiceOrder(int $totalCents = 159_600): Order
{
    $customer = Customer::query()->create(['email' => 'kunde@beispiel.de', 'firstname' => 'Erika', 'lastname' => 'Mustermann']);
    $address = Address::query()->create(['customer_id' => $customer->id, 'full_name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'house_number' => '12', 'zip_code' => '50667', 'city' => 'Köln', 'country' => 'DE']);
    $order = Order::factory()->create([
        'customer_id' => $customer->id, 'delivery_address_id' => $address->id, 'billing_address_id' => $address->id,
        'total_cents' => $totalCents, 'subtotal_cents' => $totalCents, 'shipping_cents' => 0, 'payment_method' => 'stripe',
        'tax_cents' => Money::fromMinor($totalCents)->vatIncluded(Money::VAT_STANDARD_BP)->toMinor(),
    ]);
    $order->lines()->create(['kind' => 'WHEEL', 'label' => 'Testfelge 8,5J × 18 ET45', 'quantity' => 4, 'unit_price_cents' => intdiv($totalCents, 4), 'line_total_cents' => $totalCents, 'tax_rate_bp' => 1900, 'currency' => 'EUR']);

    return $order->fresh();
}

it('issues RE-000001, then RE-000002: gapless, per series, the sums adding up, the PDF stored with its checksum', function (): void {
    $invoices = app(Invoices::class);
    $first = $invoices->issueFor(invoiceOrder());
    $second = $invoices->issueFor(invoiceOrder(99_900));

    expect($first->number)->toBe('RE-000001')
        ->and($second->number)->toBe('RE-000002')
        ->and($first->gross_cents)->toBe(159_600)
        ->and($first->net_cents + $first->tax_cents)->toBe($first->gross_cents)
        // 19 % inside 1.596,00 €: 254,8235… €, rounded as the basket rounds it (Money).
        ->and($first->tax_cents)->toBe(25_482)
        ->and($first->seller['name'])->toBe('Beispiel Handels GmbH')
        ->and($first->buyer['street'])->toBe('Hauptstraße 12')
        ->and(str_starts_with($first->pdf_key, 'invoices/'))->toBeTrue()
        ->and(hash('sha256', (string) Storage::disk('local')->get($first->pdf_key)))->toBe($first->pdf_sha256)
        ->and(str_starts_with((string) Storage::disk('local')->get($first->pdf_key), '%PDF'))->toBeTrue();
});

it('never issues a second invoice for one order', function (): void {
    $order = invoiceOrder();

    expect(app(Invoices::class)->issueFor($order)->id)->toBe(app(Invoices::class)->issueFor($order)->id)
        ->and(Invoice::query()->count())->toBe(1);
});

it('documents a refund with a credit note in its own series, naming the invoice it corrects', function (): void {
    $order = invoiceOrder();
    $invoice = app(Invoices::class)->issueFor($order);
    $refund = Refund::query()->create(['order_id' => $order->id, 'provider' => 'stripe', 'amount_cents' => 39_900, 'currency' => 'EUR', 'reason' => 'Eine Felge zurückgeschickt', 'status' => 'succeeded']);
    $note = app(Invoices::class)->creditNote($order, $refund);

    expect($note->number)->toBe('GS-000001')
        ->and($note->kind)->toBe(Invoice::CREDIT_NOTE)
        ->and($note->gross_cents)->toBe(39_900)
        ->and($note->corrects_invoice_id)->toBe($invoice->id)
        ->and($note->refund_id)->toBe($refund->id);
});

it('issues a TEST invoice while the seller data is incomplete, and keeps the real series untouched', function (): void {
    config(['rimify.seller.vat_id' => null]);

    expect(Seller::current()->missing())->toBe(['USt-IdNr. oder Steuernummer']);

    $test = app(Invoices::class)->issueFor(invoiceOrder());

    config(['rimify.seller.vat_id' => 'DE000000000']);
    $real = app(Invoices::class)->issueFor(invoiceOrder());

    expect($test->number)->toBe('TEST-RE-000001')
        ->and($test->series)->toBe('TRE')
        ->and($real->number)->toBe('RE-000001');
});

it('rolls the number back with a failed issue: the next invoice takes it, no gap', function (): void {
    $order = invoiceOrder();
    Storage::shouldReceive('disk')->andThrow(new RuntimeException('disk full'));

    expect(fn () => app(Invoices::class)->issueFor($order))->toThrow(RuntimeException::class);
    expect((int) DB::table('invoice_sequences')->where('series', 'RE')->value('last_number'))->toBe(0);
});

it('never changes or deletes an issued invoice — the model refuses, and the database underneath it', function (): void {
    $invoice = app(Invoices::class)->issueFor(invoiceOrder());

    expect(fn () => $invoice->forceFill(['gross_cents' => 1])->save())->toThrow(LogicException::class)
        ->and(fn () => $invoice->delete())->toThrow(LogicException::class)
        ->and(fn () => DB::table('invoices')->whereKey($invoice->id)->update(['gross_cents' => 1]))->toThrow(QueryException::class)
        ->and(fn () => DB::table('invoices')->whereKey($invoice->id)->delete())->toThrow(QueryException::class);
});

it('serves the PDF by its signed link only, and refuses one whose bytes were changed', function (): void {
    $invoice = app(Invoices::class)->issueFor(invoiceOrder());

    $this->get('/rechnung/'.$invoice->number)->assertForbidden();
    $this->get(URL::signedRoute('rechnung.show', ['number' => 'RE-999999']))->assertNotFound();
    $this->get(Invoices::link($invoice))->assertOk()->assertHeader('Content-Type', 'application/pdf');

    Storage::disk('local')->put($invoice->pdf_key, '%PDF-altered');
    $this->withoutExceptionHandling();

    expect(fn () => $this->get(Invoices::link($invoice)))->toThrow(RuntimeException::class, 'was changed');
});

it('prints the model withdrawal form word for word, addressed with the seller’s own data', function (): void {
    $this->get('/rechtliches/widerrufsformular')->assertOk()
        ->assertInertia(fn ($page) => $page->component('Rechtliches/Widerrufsformular')
            ->where('addressee', 'An Beispiel Handels GmbH, Musterweg 1, 50667 Köln, E-Mail: rechnung@beispiel.test:')
            ->where('fields.0', 'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)')
            ->where('footnote', '(*) Unzutreffendes streichen.'));
});
