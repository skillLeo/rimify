<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorageBucketsRequest;
use App\Http\Requests\Admin\StorageSettingsRequest;
use App\Http\Requests\Admin\StorageSettingsViewRequest;
use App\Models\StorageSetting;
use App\Services\Storage\AwsClients;
use App\Services\Storage\StorageConfig;
use App\Services\Storage\StorageSettings;
use App\Services\Storage\StorageSettingsWriter;
use App\Services\Storage\StorageTester;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Einstellungen › Medien und Speicher: the bucket the shop's files live in, entered by the operator
 * — never written into the code or a file. The keys are write-only (their last four characters are
 * all the page ever gets), a save is tested before it replaces what works, and „Verbindung testen“
 * does the same round trip on demand. The page says which set is in force: this one, the `.env`
 * fallback, or local folders.
 */
class SpeicherController extends Controller
{
    public function edit(StorageSettingsViewRequest $request, StorageSettings $settings): Response
    {
        $active = StorageSetting::query()->where('state', StorageSetting::ACTIVE)->first();
        $pending = StorageSetting::query()->where('state', StorageSetting::PENDING)->first();
        $shown = $pending ?? $active;
        $current = $settings->current();

        return Inertia::render('Admin/Einstellungen/Speicher', [
            'form' => [
                'provider' => $shown->provider ?? 's3',
                'region' => $shown->region ?? (string) config('media.s3.region', 'eu-north-1'),
                'bucket' => $shown->bucket ?? '',
                'endpoint' => $shown->endpoint ?? '',
                'path_style' => (bool) ($shown->path_style ?? false),
                'public_url' => $shown->public_url ?? '',
            ],
            // Only ever the last four characters, masked.
            'keyMasked' => StorageConfig::mask($shown?->key_last4),
            'secretMasked' => StorageConfig::mask($shown?->secret_last4),
            'source' => $current->source,
            'pending' => $pending !== null,
            'verifiedAt' => $active?->verified_at?->toIso8601String(),
            'test' => $request->session()->get('storage_test') ?? $shown?->last_test,
            // „Buckets von AWS laden“: the names the key may list, or why it may not.
            'buckets' => $request->session()->get('storage_buckets'),
            'disks' => config('media.disks'),
        ]);
    }

    public function update(StorageSettingsRequest $request, StorageSettingsWriter $writer): RedirectResponse
    {
        $result = $writer->save($request->values(), $request->admin());

        return back()
            ->with('storage_test', $result['test'])
            ->with('toast', $result['active']
                ? 'Gespeichert und geprüft. Die Dateien liegen ab jetzt in diesem Bucket.'
                : 'Gespeichert, aber die Verbindung klappt nicht. Es gelten weiter die bisherigen Einstellungen.');
    }

    /**
     * „Buckets von AWS laden“: the names this key may list, for the select — the real name, from AWS
     * itself. A key that may not list gets its reason, and the field stays free text.
     */
    public function buckets(StorageBucketsRequest $request, AwsClients $aws): RedirectResponse
    {
        $values = $request->values();
        $stored = StorageSetting::query()->where('state', StorageSetting::PENDING)->first()
            ?? StorageSetting::query()->where('state', StorageSetting::ACTIVE)->first();
        $set = new StorageConfig(
            StorageConfig::DATABASE,
            $values['region'],
            null,
            $values['endpoint'],
            $values['path_style'],
            null,
            $values['access_key'] ?? $stored?->access_key,
            $values['secret'] ?? $stored?->secret,
        );

        try {
            $names = array_map(static fn (array $b): string => (string) $b['Name'], (array) $aws->s3($set)->listBuckets()->get('Buckets'));
            sort($names);
            $result = ['names' => $names, 'error' => null];
        } catch (Throwable $e) {
            $result = ['names' => [], 'error' => StorageTester::reason($e)];
        }

        return back()->with('storage_buckets', $result);
    }

    /** „Verbindung testen“ with the values on the form — nothing is saved. */
    public function test(StorageSettingsRequest $request, StorageSettingsWriter $writer, StorageTester $tester): RedirectResponse
    {
        $base = StorageSetting::query()->where('state', StorageSetting::PENDING)->first()
            ?? StorageSetting::query()->where('state', StorageSetting::ACTIVE)->first();
        $candidate = $writer->candidate($request->values(), $base);
        $result = $tester->run(StorageSettings::fromRow($candidate, StorageConfig::DATABASE));

        return back()
            ->with('storage_test', $result)
            ->with('toast', $result['ok'] ? 'Verbindung steht.' : 'Die Verbindung klappt nicht. Die Schritte darunter sagen, woran es liegt.');
    }
}
