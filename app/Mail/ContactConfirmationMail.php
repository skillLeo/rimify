<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The sender's copy (the client's #12, D-123): what arrived, word for word, and when someone reads it — the service
 * hours the client gave, never a reply time nobody promised.
 */
class ContactConfirmationMail extends Mailable
{
    public function __construct(public ContactMessage $contactMessage) {}

    public function envelope(): Envelope
    {
        $contact = (string) config('rimify.contact.email');

        return new Envelope(
            subject: 'Deine Nachricht an RIMIFY ist angekommen',
            replyTo: $contact === '' ? [] : [new Address($contact, 'RIMIFY')],
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.contact.confirmation',
            with: [
                'name' => $this->contactMessage->name,
                'subject' => $this->contactMessage->subject,
                'body' => $this->contactMessage->message,
                'vehicle' => $this->contactMessage->vehicle_label,
                'hours' => (string) config('rimify.contact.hours'),
            ],
        );
    }
}
