<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** A contact-form message to the shop (the client's #12, D-123): „Antworten“ in the mail program answers the sender. */
class ContactMessageMail extends Mailable
{
    public function __construct(public ContactMessage $contactMessage) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kontaktformular: '.$this->contactMessage->subject,
            replyTo: [new Address($this->contactMessage->email, $this->contactMessage->name)],
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.contact.message',
            with: [
                'name' => $this->contactMessage->name,
                'email' => $this->contactMessage->email,
                'subject' => $this->contactMessage->subject,
                'body' => $this->contactMessage->message,
                'vehicle' => $this->contactMessage->vehicle_label,
                'from' => $this->contactMessage->from_path,
            ],
        );
    }
}
