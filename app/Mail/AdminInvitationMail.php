<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The invitation into the admin: who invited you, which role you will hold, the link, and until
 * when it works. Nothing else — no contact details, no legal text.
 *
 * Sent at once, not queued. "Die Einladung ist verschickt" must be true when the page says it, on a
 * server whether or not a queue worker runs; and the link is the one place the plain token exists
 * outside the recipient's inbox, so it is never written to a jobs table either.
 */
class AdminInvitationMail extends Mailable
{
    public const SUBJECT = 'Deine Einladung zum RIMIFY-Admin';

    /**
     * @param  string  $url  route('admin.einladung', token)
     * @param  string  $expiresAt  `03.10.2026, 14:22 Uhr`, in Europe/Berlin
     */
    public function __construct(
        public readonly string $url,
        public readonly string $inviterName,
        public readonly string $roleLabel,
        public readonly string $expiresAt,
        public readonly ?string $recipientName = null,
    ) {
        // Rendered in German whatever the app's locale: the mail layout's own footer line
        // ("All rights reserved.") goes through the translator (lang/de.json).
        $this->locale('de');
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: self::SUBJECT);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admin.invitation',
            with: [
                'url' => $this->url,
                'inviterName' => $this->inviterName,
                'roleLabel' => $this->roleLabel,
                'expiresAt' => $this->expiresAt,
                'recipientName' => $this->recipientName,
            ],
        );
    }
}
