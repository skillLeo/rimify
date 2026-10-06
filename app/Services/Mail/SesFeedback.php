<?php

declare(strict_types=1);

namespace App\Services\Mail;

use App\Models\MailSuppression;
use App\Services\Admin\AuditTrail;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * What a verified SNS message from SES means for the shop (the brief „AFTER CI“, §3: handle bounces and complaints):
 *
 *  - a subscription confirmation is confirmed by calling the address SNS sent — on an SNS host only;
 *  - a permanent bounce, or a complaint, puts every address it names on the shop's list: nothing more is sent there
 *    (DropSuppressedRecipients), and the Protokoll says so; SES keeps its own account-level list besides;
 *  - a transient bounce, a delivery and anything else change nothing.
 *
 * The same message delivered twice changes nothing the second time: the SNS message id is unique per address.
 */
final class SesFeedback
{
    /** @return array{handled: string, suppressed: int} */
    public function handle(SnsMessage $message): array
    {
        return match ($message->type()) {
            'SubscriptionConfirmation' => $this->confirm($message),
            'UnsubscribeConfirmation' => ['handled' => 'unsubscribed', 'suppressed' => 0],
            'Notification' => $this->notification($message),
            default => ['handled' => 'ignored', 'suppressed' => 0],
        };
    }

    /** @return array{handled: string, suppressed: int} */
    private function confirm(SnsMessage $message): array
    {
        $url = $message->field('SubscribeURL');

        if (! SnsMessage::fromSns($url)) {
            return ['handled' => 'refused', 'suppressed' => 0];
        }

        try {
            $confirmed = Http::timeout(5)->get($url)->successful();
        } catch (Throwable) {
            $confirmed = false;
        }

        if ($confirmed) {
            AuditTrail::system('Amazon SES', 'mail.sns_subscribed', ['topic' => $message->field('TopicArn')]);
        }

        return ['handled' => $confirmed ? 'subscribed' : 'not confirmed', 'suppressed' => 0];
    }

    /** @return array{handled: string, suppressed: int} */
    private function notification(SnsMessage $message): array
    {
        $payload = json_decode($message->field('Message'), true);

        if (! is_array($payload)) {
            return ['handled' => 'ignored', 'suppressed' => 0];
        }

        // SES says notificationType for identity notifications and eventType for a configuration set's events.
        $type = (string) ($payload['notificationType'] ?? $payload['eventType'] ?? '');

        [$reason, $detail, $recipients, $at] = match ($type) {
            'Bounce' => self::bounce((array) ($payload['bounce'] ?? [])),
            'Complaint' => self::complaint((array) ($payload['complaint'] ?? [])),
            default => [null, null, [], null],
        };

        if ($reason === null || $recipients === []) {
            return ['handled' => strtolower($type) ?: 'ignored', 'suppressed' => 0];
        }

        $id = $message->field('MessageId');
        $occurred = self::time($at) ?? CarbonImmutable::now();
        $new = 0;

        foreach ($recipients as $email) {
            $inserted = DB::table('mail_suppressions')->insertOrIgnore([
                'email' => $email,
                'reason' => $reason,
                'detail' => $detail,
                'sns_message_id' => $id,
                'occurred_at' => $occurred,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($inserted > 0) {
                $new++;
                AuditTrail::system('Amazon SES', 'mail.suppressed', ['email' => $email, 'reason' => $reason, 'detail' => $detail]);
            }
        }

        return ['handled' => $reason, 'suppressed' => $new];
    }

    /**
     * @param  array<array-key, mixed>  $bounce
     * @return array{0: string|null, 1: string|null, 2: list<string>, 3: mixed}
     */
    private static function bounce(array $bounce): array
    {
        // A transient bounce (a full mailbox, a server that is down) may deliver tomorrow: nothing to stop.
        if (($bounce['bounceType'] ?? null) !== 'Permanent') {
            return [null, null, [], null];
        }

        $detail = 'Permanent/'.(string) ($bounce['bounceSubType'] ?? 'General');

        return [MailSuppression::BOUNCE, $detail, self::addresses((array) ($bounce['bouncedRecipients'] ?? [])), $bounce['timestamp'] ?? null];
    }

    /**
     * @param  array<array-key, mixed>  $complaint
     * @return array{0: string|null, 1: string|null, 2: list<string>, 3: mixed}
     */
    private static function complaint(array $complaint): array
    {
        $detail = isset($complaint['complaintFeedbackType']) ? (string) $complaint['complaintFeedbackType'] : 'ohne Angabe';

        return [MailSuppression::COMPLAINT, $detail, self::addresses((array) ($complaint['complainedRecipients'] ?? [])), $complaint['timestamp'] ?? null];
    }

    /**
     * @param  array<array-key, mixed>  $recipients
     * @return list<string>
     */
    private static function addresses(array $recipients): array
    {
        $out = [];

        foreach ($recipients as $recipient) {
            $email = is_array($recipient) ? strtolower(trim((string) ($recipient['emailAddress'] ?? ''))) : '';

            // SES may write „Name <address>“: the address alone.
            if (preg_match('/<([^>]+)>/', $email, $m) === 1) {
                $email = trim($m[1]);
            }

            if (filter_var($email, FILTER_VALIDATE_EMAIL) !== false) {
                $out[] = $email;
            }
        }

        return array_values(array_unique($out));
    }

    private static function time(mixed $value): ?CarbonImmutable
    {
        try {
            return is_string($value) && $value !== '' ? CarbonImmutable::parse($value)->utc() : null;
        } catch (Throwable) {
            return null;
        }
    }
}
