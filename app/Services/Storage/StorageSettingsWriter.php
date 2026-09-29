<?php

declare(strict_types=1);

namespace App\Services\Storage;

use App\Models\AdminUser;
use App\Models\StorageSetting;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;
use SensitiveParameter;

/**
 * Saving Einstellungen › Medien und Speicher. What was entered is merged over what is stored — an
 * empty key or secret keeps the stored one — and tested at once (StorageTester). A set that passes
 * becomes the active one and every process rebuilds its disks; a set that fails is kept as pending,
 * for the operator to correct, while the working set stays in force. Either way one entry in the
 * Protokoll: who, which fields, and the keys' last four characters — never a key.
 *
 * @phpstan-import-type Result from StorageTester
 *
 * @phpstan-type Values array{provider: string, region: string, bucket: string, endpoint: string|null, path_style: bool, public_url: string|null, access_key: string|null, secret: string|null}
 */
final class StorageSettingsWriter
{
    private const FIELDS = ['provider' => 'Anbieter', 'region' => 'Region', 'bucket' => 'Bucket', 'endpoint' => 'Endpunkt', 'path_style' => 'Pfad-Stil', 'public_url' => 'Öffentliche Adresse'];

    public function __construct(private readonly StorageTester $tester, private readonly StorageSettings $settings) {}

    /**
     * @param  Values  $values
     * @return array{active: bool, test: Result}
     */
    public function save(#[SensitiveParameter] array $values, AdminUser $by): array
    {
        $active = StorageSetting::query()->where('state', StorageSetting::ACTIVE)->first();
        $pending = StorageSetting::query()->where('state', StorageSetting::PENDING)->first();
        $base = $pending ?? $active;

        $row = $this->candidate($values, $base);
        $test = $this->tester->run(StorageSettings::fromRow($row, StorageConfig::DATABASE));
        $changed = $this->changed($row, $active);

        DB::transaction(function () use ($row, $test, $active, $pending, $by): void {
            $row->forceFill(['last_test' => $test, 'updated_by' => $by->id]);

            if ($test['ok']) {
                $pending?->delete();
                $row->forceFill(['state' => StorageSetting::ACTIVE, 'verified_at' => now()]);

                if ($active !== null) {
                    $active->forceFill($row->only([...array_keys(self::FIELDS), 'access_key', 'secret', 'key_last4', 'secret_last4', 'verified_at', 'last_test', 'updated_by']))->save();

                    return;
                }
            } else {
                $row->forceFill(['state' => StorageSetting::PENDING, 'verified_at' => null]);

                if ($pending !== null) {
                    $pending->forceFill($row->only([...array_keys(self::FIELDS), 'access_key', 'secret', 'key_last4', 'secret_last4', 'verified_at', 'last_test', 'updated_by']))->save();

                    return;
                }
            }

            $row->save();
        });

        if ($test['ok']) {
            $this->settings->flush();
        }

        AuditTrail::record($by, 'storage.settings_updated', [
            'changed' => $changed,
            'key_last4' => ['old' => $active?->key_last4, 'new' => $row->key_last4],
            // Not `secret_…`: the Protokoll drops any property named like a secret, last four or not.
            'signing_key_last4' => ['old' => $active?->secret_last4, 'new' => $row->secret_last4],
            'active' => $test['ok'],
        ]);

        return ['active' => $test['ok'], 'test' => $test];
    }

    /**
     * The set as it would be: the form's values over the stored ones — a key or secret left empty
     * keeps the stored one.
     *
     * @param  Values  $values
     */
    public function candidate(#[SensitiveParameter] array $values, ?StorageSetting $base): StorageSetting
    {
        $key = $values['access_key'] ?? $base?->access_key;
        $secret = $values['secret'] ?? $base?->secret;

        return (new StorageSetting)->forceFill([
            'provider' => $values['provider'],
            'region' => $values['region'],
            'bucket' => $values['bucket'],
            'endpoint' => $values['endpoint'],
            'path_style' => $values['path_style'],
            'public_url' => $values['public_url'],
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
    private function changed(StorageSetting $row, ?StorageSetting $active): array
    {
        $changed = [];

        foreach (self::FIELDS as $field => $label) {
            if ($active === null || $row->getAttribute($field) != $active->getAttribute($field)) {
                $changed[] = $label;
            }
        }

        if ($active === null || $row->key_last4 !== $active->key_last4 || $row->access_key !== $active->access_key) {
            $changed[] = 'Zugriffsschlüssel';
        }

        if ($active === null || $row->secret !== $active->secret) {
            $changed[] = 'Geheimer Schlüssel';
        }

        return $changed;
    }
}
