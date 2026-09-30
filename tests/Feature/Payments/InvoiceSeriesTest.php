<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Models\Address;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Refund;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\InvoiceSeries;
use App\Services\Commerce\InvoiceSeriesRefused;
use App\Support\Money;
use Database\Seeders\AccessSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/*
 * The real invoice numbers are opened once, by a named operator, at the numbers the client's accounting gives — never
 * at 1 by default, never by a config edit. Until then every invoice is a test invoice. No TEST number can ever stand in
 * the real series, and the real series is gapless from its first issue: the code keeps it so, and the database refuses
 * everything that would break it even when the code is bypassed.
 */

const SERIES_URL = '/admin/einstellungen/zahlung/rechnungsnummern';

beforeEach(function (): void {
    Storage::fake('local');
    $this->seed(AccessSeeder::class);
    config([
        'rimify.payments.driver' => 'none',
        'rimify.review.enabled' => false,
        'rimify.seller' => [
            'name' => 'Beispiel Handels GmbH', 'street' => 'Musterweg 1', 'zip' => '50667', 'city' => 'Köln',
            'email' => 'rechnung@beispiel.test', 'vat_id' => 'DE000000000', 'tax_number' => null, 'register' => null, 'small_business' => false,
        ],
    ]);
});

function seriesAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function seriesOrder(string $method = 'stripe', int $totalCents = 99_900): Order
{
    $customer = Customer::query()->create(['email' => 'kunde@beispiel.de', 'firstname' => 'Erika', 'lastname' => 'Mustermann']);
    $address = Address::query()->create(['customer_id' => $customer->id, 'full_name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'house_number' => '12', 'zip_code' => '50667', 'city' => 'Köln', 'country' => 'DE']);
    $order = Order::factory()->create([
        'customer_id' => $customer->id, 'delivery_address_id' => $address->id, 'billing_address_id' => $address->id,
        'total_cents' => $totalCents, 'subtotal_cents' => $totalCents, 'shipping_cents' => 0, 'payment_method' => $method,
        'tax_cents' => Money::fromMinor($totalCents)->vatIncluded(Money::VAT_STANDARD_BP)->toMinor(),
    ]);
    $order->lines()->create(['kind' => 'WHEEL', 'label' => 'Testfelge 8,5J × 18 ET45', 'quantity' => 1, 'unit_price_cents' => $totalCents, 'line_total_cents' => $totalCents, 'tax_rate_bp' => 1900, 'currency' => 'EUR']);

    return $order->fresh();
}

function openSeries(int $invoice = 1043, int $creditNote = 1): void
{
    app(InvoiceSeries::class)->open(seriesAdmin(), $invoice, $creditNote);
}

describe('until the operator opens them', function (): void {
    it('issues every invoice as a test invoice, even for a real sale with the seller complete', function (): void {
        $invoice = app(Invoices::class)->issueFor(seriesOrder());

        expect($invoice->number)->toBe('TEST-RE-000001')
            ->and(Invoices::testReason(seriesOrder()))->toBe('Der Shop vergibt noch keine echten Rechnungsnummern.')
            ->and(DB::table('invoice_sequences')->whereIn('series', ['RE', 'GS'])->count())->toBe(0);
    });

    it('never lets a real series start by itself — not at 1, not at all', function (): void {
        expect(fn () => DB::table('invoice_sequences')->insert(['series' => 'RE', 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()]))
            ->toThrow(QueryException::class, 'opened once, at its first number, by a named operator');
    });
});

describe('the opening', function (): void {
    it('opens both series at the client’s numbers, names the operator on the row and in the Protokoll', function (): void {
        $this->actingAs(seriesAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from('/admin/einstellungen/zahlung')
            ->post(SERIES_URL, ['first_invoice' => '1043', 'first_credit_note' => '1', 'confirmed' => true])
            ->assertRedirect('/admin/einstellungen/zahlung')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast', 'Die Rechnungsnummern sind eröffnet. Die nächste echte Rechnung trägt die Nummer RE-001043.');

        $row = DB::table('invoice_sequences')->where('series', 'RE')->first();
        $entry = AuditLog::query()->where('description', 'invoice.series_opened')->sole();

        expect((int) $row->first_number)->toBe(1043)
            ->and((int) $row->last_number)->toBe(1042)
            ->and($row->opened_by_name)->toBe(seriesAdmin()->name)
            ->and($entry->actor_email)->toBe('super-admin@rimify.test')
            ->and($entry->properties['invoice_first'])->toBe('RE-001043')
            ->and($entry->properties['credit_note_first'])->toBe('GS-000001')
            ->and(InvoiceSeries::opened())->toBeTrue();

        $this->actingAs(seriesAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get('/admin/einstellungen/zahlung')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('invoiceSeries.invoice.first', 'RE-001043')
                ->where('invoiceSeries.invoice.next', 'RE-001043')
                ->where('invoiceSeries.credit_note.first', 'GS-000001'));
    });

    it('is one-way: a second opening is refused in a sentence, and the database refuses any change to the start', function (): void {
        openSeries();

        $this->actingAs(seriesAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from('/admin/einstellungen/zahlung')
            ->post(SERIES_URL, ['first_invoice' => '1', 'first_credit_note' => '1', 'confirmed' => true])
            ->assertSessionHasErrors(['first_invoice' => InvoiceSeries::ALREADY_OPEN]);

        expect(fn () => openSeries(1, 1))->toThrow(InvoiceSeriesRefused::class, InvoiceSeries::ALREADY_OPEN)
            ->and(fn () => DB::table('invoice_sequences')->where('series', 'RE')->update(['first_number' => 1, 'last_number' => DB::raw('last_number + 1')]))->toThrow(QueryException::class)
            ->and(fn () => DB::table('invoice_sequences')->where('series', 'RE')->update(['opened_by_name' => 'Jemand anderes', 'last_number' => DB::raw('last_number + 1')]))->toThrow(QueryException::class)
            ->and(fn () => DB::table('invoice_sequences')->where('series', 'RE')->delete())->toThrow(QueryException::class, 'never deleted')
            ->and((int) DB::table('invoice_sequences')->where('series', 'RE')->value('first_number'))->toBe(1043)
            ->and(AuditLog::query()->where('description', 'invoice.series_opened')->count())->toBe(1);
    });

    it('asks for both numbers and the check against the accounting, and takes whole numbers from 1 only', function (array $form, string $field): void {
        $this->actingAs(seriesAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from('/admin/einstellungen/zahlung')
            ->post(SERIES_URL, [...['first_invoice' => '1043', 'first_credit_note' => '1', 'confirmed' => true], ...$form])
            ->assertSessionHasErrors($field);

        expect(InvoiceSeries::opened())->toBeFalse();
    })->with([
        'no check' => [['confirmed' => false], 'confirmed'],
        'zero' => [['first_invoice' => '0'], 'first_invoice'],
        'not a number' => [['first_invoice' => 'RE-1043'], 'first_invoice'],
        'no credit note number' => [['first_credit_note' => ''], 'first_credit_note'],
        'past the counter' => [['first_invoice' => '1000000000'], 'first_invoice'],
    ]);

    it('is the Super-Admin’s alone, and asks for the password first', function (string $role): void {
        DB::table('role_permissions')->updateOrInsert(
            ['role_id' => DB::table('roles')->where('name', $role)->value('id'), 'module' => 'settings', 'action' => 'edit'],
            ['allowed' => true],
        );

        $this->actingAs(seriesAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
            ->post(SERIES_URL, ['first_invoice' => '1043', 'first_credit_note' => '1', 'confirmed' => true])
            ->assertForbidden();

        $this->flushSession();
        $this->actingAs(seriesAdmin(), 'admin')->post(SERIES_URL, ['first_invoice' => '1043', 'first_credit_note' => '1', 'confirmed' => true])
            ->assertRedirect();

        expect(InvoiceSeries::opened())->toBeFalse();
    })->with(['catalogue-manager', 'accountant']);
});

describe('once opened', function (): void {
    it('is gapless from its first issue, and no test invoice ever takes a real number', function (): void {
        openSeries(1043, 1);
        $invoices = app(Invoices::class);
        $issued = [];

        // Real sales and sandbox orders, interleaved; one issue fails halfway and gives its number back.
        foreach (['stripe', 'sandbox', 'stripe', 'sandbox', 'sandbox', 'stripe', 'fail', 'stripe'] as $kind) {
            if ($kind === 'fail') {
                $order = seriesOrder();
                $disks = app('filesystem');
                Storage::shouldReceive('disk')->once()->andThrow(new RuntimeException('disk full'));

                expect(fn () => $invoices->issueFor($order))->toThrow(RuntimeException::class, 'disk full');
                Storage::swap($disks);

                continue;
            }

            $issued[] = $invoices->issueFor(seriesOrder($kind));
        }

        $real = array_values(array_filter($issued, static fn (Invoice $i): bool => $i->series === 'RE'));
        $test = array_values(array_filter($issued, static fn (Invoice $i): bool => $i->series === 'TRE'));

        expect(array_map(static fn (Invoice $i): string => $i->number, $real))->toBe(['RE-001043', 'RE-001044', 'RE-001045', 'RE-001046'])
            ->and(array_map(static fn (Invoice $i): string => $i->number, $test))->toBe(['TEST-RE-000001', 'TEST-RE-000002', 'TEST-RE-000003'])
            ->and(Invoice::query()->where('series', 'RE')->where('number', 'like', 'TEST-%')->count())->toBe(0)
            ->and(Invoice::query()->where('series', 'TRE')->where('number', 'not like', 'TEST-%')->count())->toBe(0)
            ->and(InvoiceSeries::state()['invoice']['next'] ?? null)->toBe('RE-001047');
    });

    it('numbers credit notes in their own series, from its own start', function (): void {
        openSeries(1043, 17);
        $order = seriesOrder();
        $invoice = app(Invoices::class)->issueFor($order);
        $refund = Refund::query()->create(['order_id' => $order->id, 'provider' => 'stripe', 'amount_cents' => 10_000, 'currency' => 'EUR', 'reason' => 'Eine Felge zurück', 'status' => 'succeeded']);

        expect($invoice->number)->toBe('RE-001043')
            ->and(app(Invoices::class)->creditNote($order, $refund)->number)->toBe('GS-000017');
    });
});

/**
 * An invoice row as Invoices writes it, to be bent one way at a time.
 *
 * @param  array<string, mixed>  $over
 * @return array<string, mixed>
 */
function rawInvoice(array $over): array
{
    $order = seriesOrder();

    return [
        'order_id' => $order->id, 'kind' => 'invoice', 'series' => 'RE', 'sequence' => 1043, 'number' => 'RE-001043',
        'issued_at' => now(), 'net_cents' => 83_950, 'tax_cents' => 15_950, 'gross_cents' => 99_900, 'tax_rate_bp' => 1900,
        'currency' => 'EUR', 'seller' => '{}', 'buyer' => '{}', 'lines' => '[]', 'pdf_key' => 'invoices/x.pdf',
        'pdf_sha256' => str_repeat('a', 64), 'created_at' => now(), ...$over,
    ];
}

describe('the database, with the code bypassed', function (): void {
    beforeEach(fn () => openSeries(1043, 1));

    it('refuses a TEST number in the real series, and a real number in a test series', function (): void {
        DB::table('invoice_sequences')->where('series', 'RE')->update(['last_number' => 1043]);

        expect(fn () => DB::table('invoices')->insert(rawInvoice(['number' => 'TEST-RE-001043'])))->toThrow(QueryException::class)
            ->and(fn () => DB::table('invoices')->insert(rawInvoice(['series' => 'TRE', 'number' => 'RE-001043'])))->toThrow(QueryException::class)
            ->and(fn () => DB::table('invoices')->insert(rawInvoice(['number' => 'RE-1043'])))->toThrow(QueryException::class)
            ->and(fn () => DB::table('invoices')->insert(rawInvoice(['kind' => 'credit_note'])))->toThrow(QueryException::class);

        DB::table('invoices')->insert(rawInvoice([]));

        expect(Invoice::query()->where('number', 'RE-001043')->exists())->toBeTrue();
    });

    it('refuses a skipped number, a counter moved by more than one or backwards, and an invoice the counter has not reached', function (): void {
        expect(fn () => DB::table('invoice_sequences')->where('series', 'RE')->update(['last_number' => 1044]))->toThrow(QueryException::class, 'counts on by one')
            ->and(fn () => DB::table('invoice_sequences')->where('series', 'RE')->update(['last_number' => 1041]))->toThrow(QueryException::class, 'counts on by one')
            ->and(fn () => DB::table('invoices')->insert(rawInvoice([])))->toThrow(QueryException::class, 'just counted to');

        DB::table('invoice_sequences')->where('series', 'RE')->update(['last_number' => 1043]);

        expect(fn () => DB::table('invoices')->insert(rawInvoice(['sequence' => 1044, 'number' => 'RE-001044'])))->toThrow(QueryException::class, 'just counted to');
    });
});
