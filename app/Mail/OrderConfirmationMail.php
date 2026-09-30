<?php

declare(strict_types=1);

namespace App\Mail;

use App\Domain\Fitment\Verdict\PapersWording;
use App\Models\Invoice;
use App\Models\Order;
use App\Services\Commerce\Invoices;
use App\Services\Content\LegalTexts;
use App\Support\GermanFormat;
use App\Support\Seller;
use App\Support\Shipping;
use App\Support\WithdrawalForm;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\URL;

/**
 * The order confirmation, sent when the payment is confirmed (§ 312f Abs. 2 BGB): the contract on a durable
 * medium — what was bought at what price, each wheel's frozen verdict with its Auflagen in full, the address, the
 * delivery time — and, in the mail's own text, the AGB, the Widerrufsbelehrung and the Muster-Widerrufsformular as
 * they stand today. The invoice is attached as issued (Invoices), with a signed link beside it.
 */
class OrderConfirmationMail extends Mailable
{
    public function __construct(public Order $order, public Invoice $invoice) {}

    public function envelope(): Envelope
    {
        // An answer to this mail reaches the shop: it is sent from a no-reply address.
        $contact = (string) config('rimify.contact.email');

        return new Envelope(
            subject: "Deine Bestellung {$this->order->order_number} bei RIMIFY – Bestätigung und Rechnung",
            replyTo: $contact === '' ? [] : [new Address($contact, 'RIMIFY')],
        );
    }

    public function content(): Content
    {
        $order = $this->order->loadMissing(['lines.fitmentSnapshot', 'deliveryAddress']);
        $legal = app(LegalTexts::class);
        $address = $order->deliveryAddress;
        $lines = [];

        foreach ($order->lines as $line) {
            $snapshot = $line->fitmentSnapshot;
            $detail = $snapshot === null ? [] : (array) $snapshot->verdict;
            $conditions = [];

            foreach (is_array($detail['conditions'] ?? null) ? $detail['conditions'] : [] as $condition) {
                if (is_array($condition) && is_string($condition['textDe'] ?? null) && trim($condition['textDe']) !== '') {
                    $conditions[] = trim($condition['textDe']);
                }
            }

            $lines[] = [
                'label' => (string) $line->label,
                'quantity' => (int) $line->quantity,
                'total' => GermanFormat::money((int) $line->line_total_cents),
                // In words, never a code (R-15) — as the order page says it.
                'verdict' => $snapshot === null ? null : match ((string) $snapshot->verdict_status) {
                    'PERMITTED' => 'Für dein Fahrzeug freigegeben.',
                    'CONDITIONAL' => 'Für dein Fahrzeug freigegeben, mit Auflagen.',
                    'NOT_PERMITTED' => 'Nicht freigegeben.',
                    default => 'Keine Freigabe hinterlegt.',
                },
                // The papers, in the two lines the purchase showed (PapersWording): the Auflagen's, and the document's.
                'entry' => $snapshot === null ? null : PapersWording::entryLine((bool) $snapshot->requires_entry, $snapshot->papersExempt()),
                'papers' => $snapshot === null ? null : PapersWording::papersLine($snapshot->papersExempt()),
                'conditions' => $conditions,
            ];
        }

        return new Content(
            markdown: 'mail.order.confirmation',
            with: [
                'number' => $order->order_number,
                'vehicle' => $order->vehicle_label,
                'lines' => $lines,
                'subtotal' => GermanFormat::money((int) $order->subtotal_cents),
                'shipping' => GermanFormat::money((int) $order->shipping_cents),
                'tax' => GermanFormat::money((int) $order->tax_cents),
                // The order's own rate: a Kleinunternehmer's order (§ 19 UStG) carries the § 19 sentence, no VAT line.
                'rate' => GermanFormat::percent($order->vatRateBp() / 100, false),
                'smallBusiness' => $order->vatRateBp() === 0,
                'total' => GermanFormat::money((int) $order->total_cents),
                'address' => $address === null ? [] : array_values(array_filter([
                    $address->full_name,
                    trim($address->street.' '.$address->house_number),
                    trim($address->zip_code.' '.$address->city),
                ])),
                'deliveryTime' => Shipping::current()->deliveryTime(),
                // The seller under the signature, as on the invoice (§ 35a GmbHG): only what is given, never a placeholder.
                'sellerLine' => Seller::current()->documentLine(),
                'invoiceNumber' => $this->invoice->number,
                'invoiceUrl' => Invoices::link($this->invoice),
                // Signed: the page opens on any device the customer reads this mail on, not only where they ordered.
                'orderUrl' => URL::signedRoute('bestellung.show', ['order' => $order->order_number]),
                'agb' => $legal->text('agb'),
                'widerruf' => $legal->text('widerrufsbelehrung'),
                'form' => WithdrawalForm::text(Seller::current()),
            ],
        );
    }

    /** @return list<Attachment> */
    public function attachments(): array
    {
        $invoice = $this->invoice;

        return [
            Attachment::fromData(static fn (): string => app(Invoices::class)->pdf($invoice), $invoice->number.'.pdf')->withMime('application/pdf'),
        ];
    }
}
