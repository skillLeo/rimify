<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\AdminUser;
use App\Models\PaymentSetting;
use App\Payments\PaymentConfig;
use Illuminate\Support\Facades\DB;
use SensitiveParameter;

/**
 * Saving Einstellungen › Zahlung. What was entered is merged over what is stored — an empty key keeps the stored
 * one — and written encrypted (the model's casts). One entry in the Protokoll per save: who, which fields, the
 * mode and each key's last four characters — never a key.
 *
 * @phpstan-type Values array{mode: 'test'|'live', publishable_key: string|null, secret_key: string|null, webhook_secret: string|null}
 */
final class PaymentSettingsWriter
{
    /** @param  Values  $values */
    public function save(#[SensitiveParameter] array $values, AdminUser $by): PaymentSetting
    {
        return DB::transaction(function () use ($values, $by): PaymentSetting {
            $row = PaymentSetting::query()->lockForUpdate()->orderBy('id')->first() ?? new PaymentSetting;
            $before = [
                'mode' => $row->mode ?? 'test',
                'publishable' => $row->publishable_last4,
                'secret' => $row->secret_last4,
                'webhook' => $row->webhook_last4,
            ];

            $row->forceFill(['mode' => $values['mode'], 'updated_by' => $by->id]);

            foreach (['publishable_key' => 'publishable_last4', 'secret_key' => 'secret_last4', 'webhook_secret' => 'webhook_last4'] as $key => $last4) {
                if ($values[$key] !== null) {
                    $row->forceFill([$key => $values[$key], $last4 => PaymentConfig::last4($values[$key])]);
                }
            }

            $changedKeys = array_values(array_filter([
                $values['publishable_key'] !== null ? 'Öffentlicher Schlüssel' : null,
                $values['secret_key'] !== null ? 'Geheimer Schlüssel' : null,
                $values['webhook_secret'] !== null ? 'Webhook-Signaturschlüssel' : null,
            ]));

            // A key changed: the last connection test no longer speaks for it.
            if ($changedKeys !== []) {
                $row->forceFill(['last_test' => null, 'tested_at' => null]);
            }

            $row->save();

            AuditTrail::record($by, 'payments.settings_updated', [
                'changed' => array_values(array_filter([$before['mode'] !== $values['mode'] ? 'Modus' : null, ...$changedKeys])),
                'mode' => ['old' => $before['mode'], 'new' => $values['mode']],
                // Not `secret_…`: the Protokoll drops any property named like a secret, last four or not.
                'publishable_last4' => ['old' => $before['publishable'], 'new' => $row->publishable_last4],
                'signing_key_last4' => ['old' => $before['secret'], 'new' => $row->secret_last4],
                'webhook_last4' => ['old' => $before['webhook'], 'new' => $row->webhook_last4],
            ]);

            return $row;
        });
    }
}
