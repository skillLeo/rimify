<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Refund;
use App\Services\Commerce\Invoices;
use App\Support\GermanFormat;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** A refund made: the amount, the way it goes back, and the credit note attached. */
class RefundMail extends Mailable
{
    public function __construct(public Order $order, public Refund $refund, public Invoice $creditNote) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Erstattung zu deiner Bestellung {$this->order->order_number}");
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.order.refund',
            with: [
                'number' => $this->order->order_number,
                'amount' => GermanFormat::money((int) $this->refund->amount_cents),
                'full' => $this->order->refunded_cents >= $this->order->total_cents,
                'creditNote' => $this->creditNote->number,
                'creditNoteUrl' => Invoices::link($this->creditNote),
            ],
        );
    }

    /** @return list<Attachment> */
    public function attachments(): array
    {
        $note = $this->creditNote;

        return [
            Attachment::fromData(static fn (): string => app(Invoices::class)->pdf($note), $note->number.'.pdf')->withMime('application/pdf'),
        ];
    }
}
