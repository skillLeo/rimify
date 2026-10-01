<?php

declare(strict_types=1);

namespace App\Mail;

use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\PapersWording;
use App\Models\Invoice;
use App\Models\Order;
use App\Services\Commerce\Invoices;
use App\Services\Commerce\PackageTyreSizes;
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
use Throwable;

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
        // A Komplettrad's tyre size per package: its wheel line says that size's Auflagen only.
        $tyres = PackageTyreSizes::of($order->lines);

        foreach ($order->lines as $line) {
            $snapshot = $line->fitmentSnapshot;
            $groups = null;

            if ($snapshot !== null) {
                try {
                    // As the order page says them: the combination's once, each tyre size's with that size.
                    $groups = FitmentVerdict::fromArray((array) $snapshot->verdict)->conditionGroups()->toArray(PackageTyreSizes::for($line, $tyres));
                } catch (Throwable) {
                    $groups = null;
                }
            }

            // Where the sizes differ in the Abnahme, each size says it; one line here would claim it for all.
            $entryBySize = $groups !== null && count(array_unique(array_column($groups['sizes'], 'entry'))) > 1;
            $entryHere = $groups !== null && $groups['entry'] !== null ? $groups['entry'] : (bool) ($snapshot?->requires_entry);

            $lines[] = [
                'label' => (string) $line->label,
                'quantity' => (int) $line->quantity,
                'total' => GermanFormat::money((int) $line->line_total_cents),
                // In words, never a code (R-15) — as the order page says it.
                'verdict' => $snapshot === null ? null : match ((string) $snapshot->verdict_status) {
                    'PERMITTED' => 'Für dein Fahrzeug freigegeben.',
                    // Every Auflage a Hinweis (#23, D-104): nothing to do, so not „mit Auflagen“.
                    'CONDITIONAL' => self::notesOnly((array) $snapshot->verdict)
                        ? 'Für dein Fahrzeug freigegeben, mit Hinweisen aus dem Gutachten.'
                        : 'Für dein Fahrzeug freigegeben, mit Auflagen.',
                    'NOT_PERMITTED' => 'Nicht freigegeben.',
                    default => 'Keine Freigabe hinterlegt.',
                },
                // The papers, in the two lines the purchase showed (PapersWording): the Auflagen's, and the document's.
                'entry' => $snapshot === null ? null : ($entryBySize ? PapersWording::entryBySize($groups['sizes'], $snapshot->papersExempt()) : PapersWording::entryLine($entryHere, $snapshot->papersExempt())),
                'papers' => $snapshot === null ? null : PapersWording::papersLine($snapshot->papersExempt()),
                'conditions' => $groups['combination'] ?? [],
                'chosen' => $groups['chosen'] ?? null,
                // Each tyre size with its own Auflagen and, where they differ, its own Abnahme line.
                'sizes' => array_map(static fn (array $s): array => [
                    'size' => $s['size'],
                    'axle' => $s['axle'],
                    'conditions' => $s['conditions'],
                ], $groups['sizes'] ?? []),
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

    /**
     * Whether the frozen answer's Auflagen were all Hinweise (#23, D-104); a snapshot that cannot be read claims
     * nothing.
     *
     * @param  array<string, mixed>  $verdict
     */
    private static function notesOnly(array $verdict): bool
    {
        try {
            return FitmentVerdict::fromArray($verdict)->notesOnly();
        } catch (Throwable) {
            return false;
        }
    }
}
