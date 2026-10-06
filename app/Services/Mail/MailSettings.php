<?php

declare(strict_types=1);

namespace App\Services\Mail;

use App\Models\MailSetting;
use Illuminate\Mail\MailManager;
use Throwable;

/**
 * Whether the shop sends through Amazon SES, and with what: the active set of Einstellungen › E-Mail, once its test
 * found the sender's domain verified in SES and the account out of the sandbox. Until then nothing changes — the
 * mailer `.env` names stays in force, on the host `log` (the brief „AFTER CI“, §3: keep writing to the log driver until
 * the credentials arrive), and `rimify:go-live-check` says „fehlt“.
 *
 * Applied when the mail manager is first made (AppServiceProvider), so a request that sends nothing asks the database
 * nothing; a save applies it again in the saving process.
 */
final class MailSettings
{
    /** The active set, if it is whole and its last test cleared it for sending. */
    public function sending(): ?MailSetting
    {
        // No schema lookup first (slow on shared MariaDB): a database without the table throws, and is caught.
        try {
            $row = MailSetting::query()->where('state', MailSetting::ACTIVE)->first();
        } catch (Throwable) {
            return null;
        }

        return $row !== null && $row->complete() && $row->verified_at !== null && self::cleared($row->last_test) ? $row : null;
    }

    /**
     * Whether a test result clears the set for the shop's mail: the credential works, the sender's domain is verified
     * in SES, and the account may send to anyone — in the sandbox SES delivers to verified addresses only, so a
     * customer's confirmation would be refused.
     *
     * @param  array<string, mixed>|null  $test
     */
    public static function cleared(?array $test): bool
    {
        return ($test['ok'] ?? false) === true
            && ($test['identity_verified'] ?? false) === true
            && ($test['production_access'] ?? false) === true
            && ($test['sending_enabled'] ?? false) === true;
    }

    /** Point the default mailer at SES with the active set — or leave the configuration as `.env` made it. */
    public function apply(?MailManager $manager = null): void
    {
        $set = $this->sending();

        if ($set === null) {
            return;
        }

        config([
            'mail.default' => 'ses-v2',
            'mail.mailers.ses-v2' => ['transport' => 'ses-v2'],
            'services.ses' => ['key' => $set->access_key, 'secret' => $set->secret, 'region' => $set->region],
            'mail.from.address' => $set->from_address,
            'mail.from.name' => $set->from_name ?: config('mail.from.name'),
        ]);

        $manager?->forgetMailers();
    }
}
