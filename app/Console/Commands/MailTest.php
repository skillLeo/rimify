<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * `rimify:mail-test you@example.com`: one message through the configured mailer, from the configured
 * sender (docs/launch/GO-LIVE.md §9). The preflight can only read the settings; this proves a message
 * leaves the server. Whether it arrives, from the shop's domain and not in spam, the person who
 * receives it sees.
 */
final class MailTest extends Command
{
    protected $signature = 'rimify:mail-test {to : The address the test message goes to}';

    protected $description = 'Send one test e-mail through the configured mailer, from the configured sender';

    public function handle(): int
    {
        $to = trim((string) $this->argument('to'));

        if (filter_var($to, FILTER_VALIDATE_EMAIL) === false) {
            $this->error("Not an e-mail address: {$to}");

            return self::INVALID;
        }

        $mailer = (string) config('mail.default');
        $from = (string) config('mail.from.address');

        try {
            Mail::raw(
                "Hallo,\n\ndiese Nachricht prüft, ob der Shop E-Mails verschicken kann. Sie wurde mit „php artisan rimify:mail-test“ ausgelöst; du musst nichts tun.\n\nRIMIFY",
                static fn (Message $message) => $message->to($to)->subject('RIMIFY – Testnachricht zum E-Mail-Versand'),
            );
        } catch (Throwable $e) {
            $this->error("Not sent ({$mailer}): {$e->getMessage()}");

            return self::FAILURE;
        }

        if (in_array($mailer, ['log', 'array'], true)) {
            $this->warn("Written to the {$mailer} mailer, not sent: set MAIL_MAILER=smtp and the account's MAIL_* values.");

            return self::FAILURE;
        }

        $this->info("Sent via {$mailer} from {$from} to {$to}. Check that it arrives, from that sender, and not in spam.");

        return self::SUCCESS;
    }
}
