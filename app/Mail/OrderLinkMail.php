<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Order;
use App\Services\Commerce\OrderLinks;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** A fresh link to an order whose link expired (D-240), to the address the order went to. */
class OrderLinkMail extends Mailable
{
    public function __construct(public Order $order, public string $url) {}

    public function envelope(): Envelope
    {
        $contact = (string) config('rimify.contact.email');

        return new Envelope(
            subject: "Dein neuer Link zur Bestellung {$this->order->order_number}",
            replyTo: $contact === '' ? [] : [new Address($contact, 'RIMIFY')],
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.order.link',
            with: ['number' => $this->order->order_number, 'url' => $this->url, 'months' => OrderLinks::MONTHS],
        );
    }
}
