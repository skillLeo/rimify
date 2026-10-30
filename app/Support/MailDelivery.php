<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Whether a mail the shop sends now leaves the server (the operator's brief of 29.10.2026, #12): not while the mailer
 * writes to the log or keeps mail in memory — the state of every shop until Einstellungen › E-Mail switches it to
 * Amazon SES (MailSettings::apply). A page may say a message was mailed only where this is true.
 */
final class MailDelivery
{
    /** Mailers that never hand a message to anyone. */
    private const NOWHERE = ['log', 'array', 'null'];

    public static function real(): bool
    {
        // The mail manager first: an active SES set becomes the default mailer only when it is made (AppServiceProvider),
        // and a page asks before anything has been sent — without this the contact form never forwarded a message (D-364).
        app('mail.manager');

        return ! in_array((string) config('mail.default'), self::NOWHERE, true);
    }
}
