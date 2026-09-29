<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Refund;
use App\Payments\Payments;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use App\Support\Money;
use App\Support\Seller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use RuntimeException;

/**
 * §14 UStG invoices and credit notes (Block G, item 19).
 *
 * Numbered per series from `invoice_sequences`, the row locked inside the transaction that writes the invoice: a
 * number is taken only when its invoice is written (a failure rolls both back — never a gap), and the unique index
 * refuses it twice (never reused). The PDF is rendered with the number, stored once under `invoices/` on the private
 * disk with its SHA-256 in the row, and served only through a signed link (InvoiceController). An issued invoice is
 * never changed or deleted (model and trigger); a refund is documented by a credit note in its own series.
 *
 * Money is integer cents throughout, and the invoice is built from the order's own frozen lines and totals — the
 * same figures the PaymentIntent was created at — so invoice, order and payment agree to the cent.
 *
 * A test order (the review's sandbox, Stripe in Testmodus) or a seller whose data is incomplete gets a test invoice
 * in the TEST series, marked on its face as not an invoice under the UStG: the real series stays unbroken for the
 * first real sale.
 */
final class Invoices
{
    public const DISK = 'local';

    public const DIR = 'invoices';

    /** Series: real invoices, real credit notes, and the two test series beside them. */
    public const SERIES = ['invoice' => 'RE', 'credit_note' => 'GS'];

    public const TEST_PREFIX = 'T';

    /** Minutes a customer's download link stays valid. */
    public const LINK_MINUTES = 60 * 24 * 7;

    /** The order's invoice — issued now, or the one issued before (a webhook replayed never issues a second). */
    public function issueFor(Order $order): Invoice
    {
        $existing = Invoice::query()->where('order_id', $order->id)->where('kind', Invoice::INVOICE)->first();

        if ($existing !== null) {
            return $existing;
        }

        $order->loadMissing(['lines', 'billingAddress', 'deliveryAddress', 'customer']);
        $lines = [];

        foreach ($order->lines as $line) {
            $lines[] = [
                'quantity' => (int) $line->quantity,
                'label' => (string) $line->label,
                'unitGrossCents' => (int) $line->unit_price_cents,
                'grossCents' => (int) $line->line_total_cents,
            ];
        }

        if ((int) $order->shipping_cents > 0) {
            $lines[] = ['quantity' => 1, 'label' => 'Versand', 'unitGrossCents' => (int) $order->shipping_cents, 'grossCents' => (int) $order->shipping_cents];
        }

        return $this->issue($order, Invoice::INVOICE, (int) $order->total_cents, $lines);
    }

    /** The credit note for a refund that Stripe took: the amount returned, against the order's invoice. */
    public function creditNote(Order $order, Refund $refund): Invoice
    {
        $corrects = $this->issueFor($order);
        $lines = [[
            'quantity' => 1,
            'label' => sprintf('Gutschrift zu Rechnung %s: %s', $corrects->number, $refund->reason),
            'unitGrossCents' => (int) $refund->amount_cents,
            'grossCents' => (int) $refund->amount_cents,
        ]];

        return $this->issue($order, Invoice::CREDIT_NOTE, (int) $refund->amount_cents, $lines, $refund, $corrects);
    }

    /** A signed link to the PDF, for the customer's mail and the confirmation page. */
    public static function link(Invoice $invoice): string
    {
        return URL::temporarySignedRoute('rechnung.show', now()->addMinutes(self::LINK_MINUTES), ['number' => $invoice->number]);
    }

    /** The PDF's bytes, as stored — refused if they no longer match the checksum written with the invoice. */
    public function pdf(Invoice $invoice): string
    {
        $bytes = Storage::disk(self::DISK)->get($invoice->pdf_key);

        if (! is_string($bytes) || ! hash_equals($invoice->pdf_sha256, hash('sha256', $bytes))) {
            throw new RuntimeException("The PDF of invoice {$invoice->number} is missing or was changed.");
        }

        return $bytes;
    }

    /** Whether a new invoice is a test invoice, and why — null for a real one. */
    public static function testReason(Order $order): ?string
    {
        if ($order->getAttribute('payment_method') === 'sandbox' || Payments::sandbox()) {
            return 'Testbestellung der Vorschau – es wurde kein Geld bewegt.';
        }

        if (Payments::checkout()['testMode'] ?? false) {
            return 'Stripe im Testmodus – es wurde kein Geld bewegt.';
        }

        $missing = Seller::current()->missing();

        return $missing === [] ? null : 'Es fehlen noch Angaben zum Verkäufer: '.implode(', ', $missing).'.';
    }

    /**
     * @param  list<array{quantity: int, label: string, unitGrossCents: int, grossCents: int}>  $lines
     */
    private function issue(Order $order, string $kind, int $grossCents, array $lines, ?Refund $refund = null, ?Invoice $corrects = null): Invoice
    {
        $test = self::testReason($order);
        $series = ($test === null ? '' : self::TEST_PREFIX).self::SERIES[$kind];
        $taxCents = Money::fromMinor($grossCents)->vatIncluded(Money::VAT_STANDARD_BP)->toMinor();
        $seller = Seller::current();
        $address = $order->billingAddress ?? $order->deliveryAddress;
        $buyer = [
            'name' => (string) $address?->full_name,
            'street' => trim($address?->street.' '.$address?->house_number),
            'zipCity' => trim($address?->zip_code.' '.$address?->city),
            'country' => 'Deutschland',
            'email' => $order->customer?->email,
        ];

        $invoice = DB::transaction(function () use ($order, $kind, $series, $grossCents, $taxCents, $seller, $buyer, $lines, $refund, $corrects, $test): Invoice {
            DB::table('invoice_sequences')->insertOrIgnore(['series' => $series, 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()]);
            $last = (int) DB::table('invoice_sequences')->where('series', $series)->lockForUpdate()->value('last_number');
            $sequence = $last + 1;
            DB::table('invoice_sequences')->where('series', $series)->update(['last_number' => $sequence, 'updated_at' => now()]);

            $number = ($test === null ? '' : 'TEST-').self::SERIES[$kind].'-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
            $issuedAt = now();
            $key = self::DIR.'/'.$issuedAt->format('Y').'/'.$number.'.pdf';
            $bytes = $this->render([
                'kind' => $kind,
                'number' => $number,
                'issuedAt' => $issuedAt,
                'order' => $order,
                'seller' => $seller,
                'buyer' => $buyer,
                'lines' => $lines,
                'grossCents' => $grossCents,
                'taxCents' => $taxCents,
                'netCents' => $grossCents - $taxCents,
                'corrects' => $corrects,
                'test' => $test,
            ]);

            Storage::disk(self::DISK)->put($key, $bytes);

            return Invoice::query()->create([
                'order_id' => $order->id,
                'kind' => $kind,
                'series' => $series,
                'sequence' => $sequence,
                'number' => $number,
                'issued_at' => $issuedAt,
                'net_cents' => $grossCents - $taxCents,
                'tax_cents' => $taxCents,
                'gross_cents' => $grossCents,
                'tax_rate_bp' => Money::VAT_STANDARD_BP,
                'currency' => (string) ($order->getAttribute('currency') ?? 'EUR'),
                'seller' => $seller->toArray(),
                'buyer' => $buyer,
                'lines' => $lines,
                'refund_id' => $refund?->id,
                'corrects_invoice_id' => $corrects?->id,
                'pdf_key' => $key,
                'pdf_sha256' => hash('sha256', $bytes),
            ]);
        });

        AuditTrail::system('System', $kind === Invoice::INVOICE ? 'invoice.issued' : 'invoice.credit_note_issued', [
            'order' => $order->order_number,
            'number' => $invoice->number,
            'gross_cents' => $invoice->gross_cents,
            'test' => $test !== null,
        ], $order);

        return $invoice;
    }

    /** @param  array<string, mixed>  $data */
    private function render(array $data): string
    {
        // DejaVu Sans, dompdf's bundled face, has no narrow no-break space: the money keeps its space, as a plain one.
        $money = static fn (int $cents): string => str_replace("\u{202F}", "\u{00A0}", GermanFormat::money($cents));

        return Pdf::loadView('pdf.invoice', $data + ['money' => $money])->setPaper('a4')->output();
    }
}
