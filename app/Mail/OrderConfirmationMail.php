<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Invoice;
use App\Models\Order;
use App\Services\Commerce\Invoices;
use App\Services\Content\LegalTexts;
use App\Support\GermanFormat;
use App\Support\Seller;
use App\Support\WithdrawalForm;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

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
        return new Envelope(subject: "Deine Bestellung {$this->order->order_number} bei RIMIFY – Bestätigung und Rechnung");
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
                'verdict' => $snapshot === null ? null : match ((string) $snapshot->verdict_status) {
                    'PERMITTED' => 'Für dein Fahrzeug freigegeben.',
                    'CONDITIONAL' => 'Für dein Fahrzeug freigegeben, mit Auflagen.',
                    default => 'Freigabe: '.$snapshot->verdict_status,
                },
                'entry' => $snapshot !== null && (bool) $snapshot->requires_entry,
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
                'total' => GermanFormat::money((int) $order->total_cents),
                'address' => $address === null ? [] : array_values(array_filter([
                    $address->full_name,
                    trim($address->street.' '.$address->house_number),
                    trim($address->zip_code.' '.$address->city),
                ])),
                'deliveryTime' => is_string($time = config('rimify.shipping.delivery_time')) && trim($time) !== '' ? trim($time) : null,
                'invoiceNumber' => $this->invoice->number,
                'invoiceUrl' => Invoices::link($this->invoice),
                'orderUrl' => route('bestellung.show', ['order' => $order->order_number]),
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
