<?php

declare(strict_types=1);

namespace App\Payments\Stripe;

use App\Models\Order;
use App\Payments\PaymentConfig;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Stripe\Invoice;
use Stripe\StripeClient;

/**
 * Stripe issues the invoice for every order paid through it (his admin item 17, part 2: „stripe will take care of the
 * invoice creation and storage“; the operator's brief of 29.10.2026, D-361). The shop's Payment Intents integration,
 * done the way Stripe documents it for one (docs.stripe.com/api/invoices/attach_payment): a draft for the order's
 * customer — the one the payment was made for —, every row of the order its own line item (InvoiceRows) with the VAT
 * rate the order was sold at, inclusive, so the invoice shows net, rate and tax; the draft's total checked against the
 * order's to the cent; finalized without collecting; and the payment that already succeeded attached, which credits it at
 * once and marks the invoice paid.
 *
 * Once per order, from wherever it stopped: every step carries its own idempotency key, and the draft's id is kept from
 * the moment it exists. The shop links the invoice only once Stripe reports it paid, with its number and PDF.
 */
final class StripeInvoices
{
    /** What the tax rate is found by in the account: made once by the shop, never typed by hand. */
    public const TAX_RATE_TAG = 'mwst-19';

    private ?StripeClient $client = null;

    public function __construct(private ?PaymentConfig $config = null) {}

    /** Whether Stripe is to invoice this order: paid through Stripe, for a customer the payment was made for. */
    public static function applies(Order $order): bool
    {
        return $order->getAttribute('payment_method') === 'stripe'
            && (string) ($order->stripe_payment_intent_id ?? '') !== ''
            && (string) ($order->stripe_customer_id ?? '') !== ''
            && $order->paid_at !== null;
    }

    /** The invoice issued and paid, its number and PDF on the order — or the order as it is where nothing is to do. */
    public function issue(Order $order): Order
    {
        if (! self::applies($order) || $order->stripe_invoice_pdf !== null) {
            return $order;
        }

        $key = 'rmf-in-'.($order->public_id ?? $order->order_number);
        $invoice = $order->stripe_invoice_id === null ? null : $this->client()->invoices->retrieve($order->stripe_invoice_id);

        if ($invoice === null) {
            $invoice = $this->draft($order, $key);
        }

        if ($invoice->status === Invoice::STATUS_DRAFT) {
            $invoice = $this->client()->invoices->finalizeInvoice($invoice->id, ['auto_advance' => false], ['idempotency_key' => $key.'-finalize']);
        }

        if ($invoice->status === Invoice::STATUS_OPEN) {
            $invoice = $this->client()->invoices->attachPayment($invoice->id, ['payment_intent' => (string) $order->stripe_payment_intent_id], ['idempotency_key' => $key.'-attach']);
        }

        $order->forceFill(['stripe_invoice_number' => $invoice->number])->save();

        if ($invoice->status !== Invoice::STATUS_PAID) {
            throw new RuntimeException("Stripe invoice {$invoice->id} for order {$order->order_number} is {$invoice->status}, not paid.");
        }

        $order->forceFill([
            'stripe_invoice_url' => $invoice->hosted_invoice_url,
            'stripe_invoice_pdf' => $invoice->invoice_pdf,
            'stripe_invoiced_at' => now(),
        ])->save();

        AuditTrail::system('System', 'stripe_invoice.issued', ['order' => $order->order_number, 'number' => $invoice->number, 'total_cents' => $invoice->total], $order);

        return $order;
    }

    /**
     * Every invoice Stripe created in [$from, $to), page by page to the last — the daily copy's list (D-361). Drafts are
     * left out: they carry no number yet and are no invoice.
     *
     * @return iterable<IssuedInvoice>
     */
    public function createdBetween(int $from, int $to): iterable
    {
        foreach ($this->client()->invoices->all(['created' => ['gte' => $from, 'lt' => $to], 'limit' => 100])->autoPagingIterator() as $invoice) {
            if ($invoice->status !== Invoice::STATUS_DRAFT) {
                yield IssuedInvoice::of($invoice);
            }
        }
    }

    /** The draft with every row of the order, its total checked: a draft that says another amount is deleted. */
    private function draft(Order $order, string $key): Invoice
    {
        $customer = (string) $order->stripe_customer_id;
        $taxRates = $order->vatRateBp() === 1900 ? [$this->taxRate()] : [];

        $invoice = $this->client()->invoices->create([
            'customer' => $customer,
            'currency' => 'eur',
            'collection_method' => 'charge_automatically',
            'auto_advance' => false,
            'pending_invoice_items_behavior' => 'exclude',
            'description' => 'RIMIFY-Bestellung '.$order->order_number,
            'rendering' => ['pdf' => ['page_size' => 'a4']],
            'metadata' => ['order_id' => (string) $order->id, 'order_number' => $order->order_number],
        ], ['idempotency_key' => $key]);

        // Kept from the moment it exists: a run that stops after this continues with this draft, never a second one.
        $order->forceFill(['stripe_invoice_id' => $invoice->id])->save();

        foreach (InvoiceRows::of($order) as $i => $row) {
            // A total that is not quantity × price per piece (a rounded set) goes as one piece of its total, said so.
            $whole = $row['totalCents'] === $row['quantity'] * $row['unitCents'];

            $this->client()->invoiceItems->create([
                'customer' => $customer,
                'invoice' => $invoice->id,
                'currency' => 'eur',
                'description' => $whole ? $row['label'] : $row['quantity'].' × '.$row['label'],
                'quantity' => $whole ? $row['quantity'] : 1,
                'unit_amount_decimal' => (string) ($whole ? $row['unitCents'] : $row['totalCents']),
                'tax_rates' => $taxRates,
            ], ['idempotency_key' => $key.'-row-'.($i + 1)]);
        }

        $invoice = $this->client()->invoices->retrieve($invoice->id);

        if ((int) $invoice->total !== (int) $order->total_cents) {
            $this->client()->invoices->delete($invoice->id);
            $order->forceFill(['stripe_invoice_id' => null])->save();

            throw new RuntimeException("Stripe's draft for order {$order->order_number} came to {$invoice->total} cents, the order to {$order->total_cents}: deleted, no invoice issued.");
        }

        return $invoice;
    }

    /** The account's inclusive 19 % VAT rate for Germany, found by the shop's tag or made once. */
    private function taxRate(): string
    {
        return Cache::remember('stripe-tax-rate:'.self::TAX_RATE_TAG.':'.substr(hash('sha256', (string) $this->config()->secretKey), 0, 12), 86_400, function (): string {
            foreach ($this->client()->taxRates->all(['active' => true, 'inclusive' => true, 'limit' => 100])->autoPagingIterator() as $rate) {
                if (($rate->metadata['rimify'] ?? null) === self::TAX_RATE_TAG && (float) $rate->percentage === 19.0) {
                    return $rate->id;
                }
            }

            return $this->client()->taxRates->create([
                'display_name' => 'MwSt.',
                'description' => 'Umsatzsteuer 19 %',
                'percentage' => 19.0,
                'inclusive' => true,
                'country' => 'DE',
                'jurisdiction' => 'DE',
                'tax_type' => 'vat',
                'metadata' => ['rimify' => self::TAX_RATE_TAG],
            ], ['idempotency_key' => 'rmf-tax-'.self::TAX_RATE_TAG])->id;
        });
    }

    private function client(): StripeClient
    {
        if ($this->config()->secretKey === null) {
            throw new RuntimeException('No Stripe secret key is configured.');
        }

        return $this->client ??= new StripeClient(['api_key' => $this->config()->secretKey]);
    }

    private function config(): PaymentConfig
    {
        return $this->config ??= PaymentConfig::current();
    }
}
