<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Mail\DeliverabilityTestMail;
use App\Services\Mail\MailSettings;
use Illuminate\Console\Command;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * `rimify:mail-test you@example.com`: one message through the configured mailer, from the configured sender
 * (docs/launch/GO-LIVE.md §9) — Amazon SES once Einstellungen › E-Mail clears it. The preflight can only read the
 * settings; this proves a message leaves the server. With `--anhaenge` it is the deliverability test of
 * docs/ops/MAIL-SES.md: the order confirmation's layout and two PDFs, for Gmail, Outlook and GMX to judge. Whether it
 * arrives, from the shop's domain and not in spam, the person who receives it sees.
 */
final class MailTest extends Command
{
    protected $signature = 'rimify:mail-test
        {to : The address the test message goes to}
        {--anhaenge : The deliverability test: the confirmation\'s layout with two PDF attachments}';

    protected $description = 'Send one test e-mail through the configured mailer, from the configured sender';

    public function handle(MailSettings $settings): int
    {
        $to = trim((string) $this->argument('to'));

        if (filter_var($to, FILTER_VALIDATE_EMAIL) === false) {
            $this->error("Not an e-mail address: {$to}");

            return self::INVALID;
        }

        // The mailer the message will really use: SES applies when the mail manager is first made.
        $settings->apply(app('mail.manager'));
        $mailer = (string) config('mail.default');
        $from = (string) config('mail.from.address');

        try {
            if ($this->option('anhaenge')) {
                Mail::to($to)->send(new DeliverabilityTestMail);
            } else {
                Mail::raw(
                    "Hallo,\n\ndiese Nachricht prüft, ob der Shop E-Mails verschicken kann. Sie wurde mit „php artisan rimify:mail-test“ ausgelöst; du musst nichts tun.\n\nRIMIFY",
                    static fn (Message $message) => $message->to($to)->subject('RIMIFY – Testnachricht zum E-Mail-Versand'),
                );
            }
        } catch (Throwable $e) {
            $this->error("Not sent ({$mailer}): {$e->getMessage()}");

            return self::FAILURE;
        }

        if (in_array($mailer, ['log', 'array'], true)) {
            $this->warn("Written to the {$mailer} mailer, not sent: enter the Amazon SES key in Einstellungen › E-Mail (docs/ops/MAIL-SES.md).");

            return self::FAILURE;
        }

        $this->info("Sent via {$mailer} from {$from} to {$to}".($this->option('anhaenge') ? ', with two PDF attachments' : '').'. Check that it arrives, from that sender, and not in spam.');

        return self::SUCCESS;
    }
}
