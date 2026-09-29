<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\CustomerAccount;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The one link an account needs: to set its first password after „Konto anlegen“ (`opened`), or a new one after
 * „Passwort vergessen“ (`reset`). Valid a day and only once.
 */
class CustomerAccountMail extends Mailable
{
    public function __construct(public CustomerAccount $account, public string $kind) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->kind === 'opened' ? 'Dein Konto bei RIMIFY – nur noch das Passwort' : 'Neues Passwort für dein Konto bei RIMIFY');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.account.link', with: [
            'opened' => $this->kind === 'opened',
            'url' => $this->account->passwordLink(),
            'hours' => CustomerAccount::LINK_HOURS,
        ]);
    }
}
