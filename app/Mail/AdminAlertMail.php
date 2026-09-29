<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * An alert by e-mail, for the kinds a person switched on under „Was du bekommst“. The same sentence
 * the bell shows, and a link into the admin when the alert has a page. Sent at once, like the
 * invitation: it reports on the queue, so it does not wait in it.
 */
class AdminAlertMail extends Mailable
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $detail,
        public readonly ?string $url,
        public readonly string $settingsUrl,
    ) {
        $this->locale('de');
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'RIMIFY-Admin: '.$this->title);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admin.alert',
            with: [
                'title' => $this->title,
                'detail' => $this->detail,
                'url' => $this->url,
                'settingsUrl' => $this->settingsUrl,
            ],
        );
    }
}
