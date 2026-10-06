<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Models\MailSuppression;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mime\Address;
use Throwable;

/**
 * Before any mail leaves: every address SES reported as permanently undeliverable or complaining (MailSuppression, in
 * force) is taken off To, Cc and Bcc. A message left with nobody to send to is not sent — SES would refuse it anyway,
 * and every refusal counts against the account. The log says which message was stopped and why; the Protokoll already
 * holds the report that put the address on the list.
 *
 * Answers null to let the message go on (the mailer asks its listeners until one answers), false to stop it.
 */
final class DropSuppressedRecipients
{
    public function handle(MessageSending $event): ?bool
    {
        $message = $event->message;
        $lists = ['To' => $message->getTo(), 'Cc' => $message->getCc(), 'Bcc' => $message->getBcc()];
        $all = [...$lists['To'], ...$lists['Cc'], ...$lists['Bcc']];

        if ($all === []) {
            return null;
        }

        try {
            $suppressed = MailSuppression::query()->inForce()
                ->whereIn('email', array_map(static fn (Address $a): string => strtolower($a->getAddress()), $all))
                ->pluck('email')->all();
        } catch (Throwable) {
            // No table yet (before its migration): nothing is on the list.
            return null;
        }

        if ($suppressed === []) {
            return null;
        }

        foreach ($lists as $header => $list) {
            $kept = array_values(array_filter($list, static fn (Address $a): bool => ! in_array(strtolower($a->getAddress()), $suppressed, true)));

            if (count($kept) === count($list)) {
                continue;
            }

            if ($kept === []) {
                $message->getHeaders()->remove($header);
            } else {
                match ($header) {
                    'To' => $message->to(...$kept),
                    'Cc' => $message->cc(...$kept),
                    default => $message->bcc(...$kept),
                };
            }
        }

        $left = $message->getTo() !== [];

        Log::warning('Mail to an address SES reported as undeliverable or complaining was not sent', [
            'subject' => $message->getSubject(),
            'suppressed' => $suppressed,
            'sent_to_others' => $left,
        ]);

        return $left ? null : false;
    }
}
