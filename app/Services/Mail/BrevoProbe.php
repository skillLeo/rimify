<?php

declare(strict_types=1);

namespace App\Services\Mail;

use App\Models\MailSetting;
use Closure;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Throwable;

/**
 * „Verbindung testen“ for Brevo (his round of 08.11, §7A; D-450): signs in to Brevo's SMTP relay with the login and the key
 * on the form, and signs off again — nothing is sent. What it reports is what the relay answered, word for word: an SMTP
 * key Brevo does not know comes back as „535 Authentication failed“, not as a guess of ours. Whether the sender's domain is
 * verified the relay does not say at sign-in; Brevo's own page does, and its logs say what became of a message.
 *
 * @phpstan-type Step array{step: string, ok: bool, detail: string|null}
 * @phpstan-type Result array{ok: bool, provider: 'brevo', steps: list<Step>, at: string}
 */
final class BrevoProbe
{
    public const STEP = 'Anmeldung bei Brevo ('.MailSetting::BREVO_HOST.')';

    /** @param  (Closure(string, string): void)|null  $signIn  login, key — throws where the relay refuses */
    public function __construct(private readonly ?Closure $signIn = null) {}

    /** @return Result */
    public function run(MailSetting $set): array
    {
        if (! $set->complete() || $set->domain() === null) {
            return self::result(false, 'Absenderadresse, SMTP-Login und SMTP-Schlüssel werden gebraucht.');
        }

        try {
            ($this->signIn ?? self::signIn(...))((string) $set->smtp_login, (string) $set->secret);
        } catch (Throwable $e) {
            return self::result(false, self::reason($e));
        }

        return self::result(true, null);
    }

    /** The relay's own words, the key never among them. */
    public static function reason(Throwable $e): string
    {
        $message = trim((string) preg_replace('/\s+/', ' ', $e->getMessage()));

        return $message === '' ? 'Brevo hat die Anmeldung abgelehnt, ohne einen Grund zu nennen.' : mb_substr($message, 0, 300);
    }

    private static function signIn(string $login, #[\SensitiveParameter] string $key): void
    {
        $transport = new EsmtpTransport(MailSetting::BREVO_HOST, MailSetting::BREVO_PORT);
        $transport->setUsername($login);
        $transport->setPassword($key);
        $transport->start();
        $transport->stop();
    }

    /** @return Result */
    private static function result(bool $ok, ?string $detail): array
    {
        return ['ok' => $ok, 'provider' => 'brevo', 'steps' => [['step' => self::STEP, 'ok' => $ok, 'detail' => $detail]], 'at' => now()->toIso8601String()];
    }
}
