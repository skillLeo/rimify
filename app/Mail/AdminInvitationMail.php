<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The invitation into the admin: who invited you, which role you will hold, the link, and until
 * when it works. Nothing else — no contact details, no legal text.
 *
 * It carries only strings, already formatted, so a queued copy needs nothing from the database. The
 * link is the one place the plain token exists outside the recipient's inbox, so the queued job is
 * encrypted: the table keeps only the token's hash, and the queue must not keep more than that.
 */
class AdminInvitationMail extends Mailable implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

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
    ) {}

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
