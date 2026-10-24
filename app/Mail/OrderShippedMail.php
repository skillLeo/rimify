<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Order;
use App\Services\Commerce\OrderLinks;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The order sent (OrderFulfilment::ship, the admin audit's F-14): its number, the tracking number the team typed, and
 * the order's page. No carrier is named and no tracking link is built — the shop has none on record.
 */
class OrderShippedMail extends Mailable
{
    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        $contact = (string) config('rimify.contact.email');

        return new Envelope(
            subject: "Deine Bestellung {$this->order->order_number} ist unterwegs",
            replyTo: $contact === '' ? [] : [new Address($contact, 'RIMIFY')],
        );
    }

    public function content(): Content
    {
        $tracking = trim((string) $this->order->tracking_code);

        return new Content(
            markdown: 'mail.order.shipped',
            with: [
                'number' => $this->order->order_number,
                'tracking' => $tracking === '' ? null : $tracking,
                'url' => OrderLinks::link($this->order),
                'months' => OrderLinks::MONTHS,
            ],
        );
    }
}
