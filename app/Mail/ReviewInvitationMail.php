<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Order;
use App\Services\Commerce\Reviews\ReviewLink;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Some days after delivery, once: how are the rims? One signed link, a few stars, a sentence if they like (D-103). */
class ReviewInvitationMail extends Mailable
{
    /** @param  list<string>  $wheels  what was bought, as the order line names it */
    public function __construct(public Order $order, public array $wheels) {}

    public function envelope(): Envelope
    {
        $contact = (string) config('rimify.contact.email');

        return new Envelope(
            subject: 'Wie zufrieden bist du mit deinen Felgen?',
            replyTo: $contact === '' ? [] : [new Address($contact, 'RIMIFY')],
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.order.review-invitation',
            with: [
                'number' => $this->order->order_number,
                'wheels' => $this->wheels,
                'url' => ReviewLink::for($this->order),
                'days' => max(1, (int) config('rimify.reviews.link_days', 60)),
            ],
        );
    }
}
