<?php

declare(strict_types=1);

namespace App\Services\Mail;

use App\Models\AdminUser;
use App\Models\MailSetting;
use App\Services\Admin\AuditTrail;
use App\Services\Storage\StorageConfig;
use Illuminate\Support\Facades\DB;
use SensitiveParameter;

/**
 * Saving Einstellungen › E-Mail, as Medien und Speicher saves: what was entered over what is stored — an empty key or
 * secret keeps the stored one — and tested at once (SesProbe). A set whose key works becomes the active one, and the
 * shop sends with it as soon as its test clears it (MailSettings::cleared: domain verified, out of the sandbox); a set
 * whose key does not work is kept as pending for correcting, and the working set stays in force. One entry in the
 * Protokoll either way: who, which fields, the keys' last four characters — never a key.
 *
 * @phpstan-import-type Result from SesProbe
 *
 * @phpstan-type Values array{from_address: string, from_name: string|null, topic_arn: string|null, access_key: string|null, secret: string|null}
 */
final class MailSettingsWriter
{
    private const FIELDS = ['from_address' => 'Absenderadresse', 'from_name' => 'Absendername', 'topic_arn' => 'SNS-Thema'];

    private const STORED = ['region', 'from_address', 'from_name', 'topic_arn', 'access_key', 'secret', 'key_last4', 'secret_last4', 'verified_at', 'last_test', 'updated_by'];

    public function __construct(private readonly SesProbe $probe, private readonly MailSettings $settings) {}

    /**
     * @param  Values  $values
     * @return array{active: bool, test: Result}
     */
    public function save(#[SensitiveParameter] array $values, AdminUser $by): array
    {
        $active = MailSetting::query()->where('state', MailSetting::ACTIVE)->first();
        $pending = MailSetting::query()->where('state', MailSetting::PENDING)->first();

        $row = $this->candidate($values, $pending ?? $active);
        $test = $this->probe->run($row);
        $changed = $this->changed($row, $active);

        DB::transaction(function () use ($row, $test, $active, $pending, $by): void {
            $row->forceFill(['last_test' => $test, 'updated_by' => $by->id]);

            if ($test['ok']) {
                $pending?->delete();
                $row->forceFill(['state' => MailSetting::ACTIVE, 'verified_at' => now()]);

                if ($active !== null) {
                    $active->forceFill($row->only(self::STORED))->save();

                    return;
                }
            } else {
                $row->forceFill(['state' => MailSetting::PENDING, 'verified_at' => null]);

                if ($pending !== null) {
                    $pending->forceFill($row->only(self::STORED))->save();

                    return;
                }
            }

            $row->save();
        });

        if ($test['ok']) {
            $this->settings->apply(app('mail.manager'));
        }

        AuditTrail::record($by, 'mail.settings_updated', [
            'changed' => $changed,
            'key_last4' => ['old' => $active?->key_last4, 'new' => $row->key_last4],
            // Not `secret_…`: the Protokoll drops any property named like a secret, last four or not.
            'signing_key_last4' => ['old' => $active?->secret_last4, 'new' => $row->secret_last4],
            'active' => $test['ok'],
            'sending' => MailSettings::cleared($test),
        ]);

        return ['active' => $test['ok'], 'test' => $test];
    }

    /**
     * The set as it would be: the form's values over the stored ones — a key or secret left empty keeps the stored one.
     *
     * @param  Values  $values
     */
    public function candidate(#[SensitiveParameter] array $values, ?MailSetting $base): MailSetting
    {
        $key = $values['access_key'] ?? $base?->access_key;
        $secret = $values['secret'] ?? $base?->secret;

        return (new MailSetting)->forceFill([
            'region' => MailSetting::REGION,
            'from_address' => $values['from_address'],
            'from_name' => $values['from_name'],
            'topic_arn' => $values['topic_arn'],
            'access_key' => $key,
            'secret' => $secret,
            'key_last4' => StorageConfig::last4($key),
            'secret_last4' => StorageConfig::last4($secret),
        ]);
    }

    /**
     * Which fields differ from the set in force, by their German names.
     *
     * @return list<string>
     */
    private function changed(MailSetting $row, ?MailSetting $active): array
    {
        $changed = [];

        foreach (self::FIELDS as $field => $label) {
            if ($active === null || $row->getAttribute($field) != $active->getAttribute($field)) {
                $changed[] = $label;
            }
        }

        if ($active === null || $row->access_key !== $active->access_key) {
            $changed[] = 'Zugriffsschlüssel';
        }

        if ($active === null || $row->secret !== $active->secret) {
            $changed[] = 'Geheimer Schlüssel';
        }

        return $changed;
    }
}
