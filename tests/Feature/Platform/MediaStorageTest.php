<?php

declare(strict_types=1);

use App\Models\StorageSetting;
use App\Services\Storage\StorageConfig;
use App\Services\Storage\StorageSettings;
use App\Services\Storage\StorageTester;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeBucket;

/*
 * The four media disks (config/media.php) on one bucket: which credential set builds them (the
 * admin screen's, else `.env`, else local folders), what their URLs are, and the rule the client's
 * bucket forces — no request ever carries an ACL. Every AWS call goes to FakeBucket; none leaves.
 */

const MEDIA_KEY = 'FAKEKEYFORTESTS0AB12';
const MEDIA_SECRET = 'fake/secret/for/tests/only/0000X9Y8';

/** The `.env` set, as config/media.php reads it; null clears it. */
function mediaEnv(?string $bucket = 'rimify-media-test', ?string $url = null): void
{
    config(['media.s3' => [
        'key' => $bucket === null ? null : MEDIA_KEY,
        'secret' => $bucket === null ? null : MEDIA_SECRET,
        'region' => 'eu-north-1',
        'bucket' => $bucket,
        'url' => $url,
        'endpoint' => null,
        'path_style' => false,
    ]]);

    app(StorageSettings::class)->flush();
}

function mediaRow(string $state, string $bucket, bool $flush = true): StorageSetting
{
    $row = new StorageSetting;
    $row->forceFill([
        'state' => $state, 'provider' => 's3', 'region' => 'eu-north-1', 'bucket' => $bucket, 'endpoint' => null,
        'path_style' => false, 'public_url' => null, 'access_key' => 'DBKEYFORTESTS000CD34', 'secret' => 'db/secret/for/tests/only/00000Q7R6',
        'key_last4' => 'CD34', 'secret_last4' => 'Q7R6',
    ])->save();

    if ($flush) {
        app(StorageSettings::class)->flush();
    }

    return $row;
}

beforeEach(function (): void {
    // Whatever this machine's .env holds, a test starts from nothing and never reaches a bucket.
    mediaEnv(null);
    $this->bucket = FakeBucket::install();
});

describe('the ACL rule', function (): void {
    it('sends no ACL with any upload, whatever visibility is asked for', function (string $disk, string $prefix): void {
        mediaEnv();

        Storage::disk($disk)->put('probe.txt', 'eins');
        Storage::disk($disk)->put('probe-public.txt', 'zwei', 'public');
        Storage::disk($disk)->writeStream('probe-stream.txt', fopen('data://text/plain,drei', 'r'));

        $puts = array_values(array_filter($this->bucket->sent, static fn (array $s): bool => $s['name'] === 'PutObject'));

        expect($puts)->toHaveCount(3);

        foreach ($puts as $put) {
            expect($put['params'])->not->toHaveKey('ACL')
                ->and(array_change_key_case($put['headers']))->not->toHaveKey('x-amz-acl')
                ->and($put['params']['Key'])->toStartWith($prefix.'/');
        }
    })->with([
        'Felgenbilder' => ['media_products', 'product-images'],
        'Website-Bilder' => ['media_site', 'website-images'],
        'Gutachten' => ['docs_public', 'ABEs'],
        'Rechnungen' => ['docs_private', 'invoices'],
    ]);

    it('refuses to set an ACL after the fact, and sends nothing', function (): void {
        mediaEnv();

        expect(fn () => Storage::disk('media_products')->setVisibility('a.webp', 'public'))->toThrow(Exception::class);
        expect($this->bucket->names())->not->toContain('PutObjectAcl');
    });
});

describe('addresses', function (): void {
    it('gives a public file the base address plus its key, once', function (): void {
        mediaEnv();

        expect(Storage::disk('media_products')->url('mcr4/960.webp'))->toBe('https://rimify-media-test.s3.eu-north-1.amazonaws.com/product-images/mcr4/960.webp')
            ->and(Storage::disk('docs_public')->url('ABE-12345.pdf'))->toBe('https://rimify-media-test.s3.eu-north-1.amazonaws.com/ABEs/ABE-12345.pdf');
    });

    it('puts a CDN in front when one is configured', function (): void {
        mediaEnv(url: 'https://cdn.rimify.test/');

        expect(Storage::disk('media_site')->url('hero.avif'))->toBe('https://cdn.rimify.test/website-images/hero.avif');
    });

    it('serves an invoice only by a signed link that expires after ten minutes', function (): void {
        mediaEnv();

        $url = Storage::disk('docs_private')->temporaryUrl('exports/R-2026-0001.pdf', now()->addMinutes((int) config('media.signed_url_minutes')));

        // The SDK counts down from its own clock (time()), a moment after ours: across a second's edge the ten minutes
        // read 599 seconds (the full suite of 04.10.2026) — still ten minutes, never more.
        expect($url)->toContain('/invoices/exports/R-2026-0001.pdf')
            ->and($url)->toMatch('/X-Amz-Expires=(599|600)(&|$)/')
            ->and($url)->toContain('X-Amz-Signature=')
            ->and($url)->not->toContain(MEDIA_SECRET);
    });
});

describe('which set builds the disks', function (): void {
    it('uses local folders when no bucket is set anywhere', function (): void {
        $set = app(StorageSettings::class)->current();
        Storage::disk('media_products')->put('probe.txt', 'lokal');

        expect($set->source)->toBe(StorageConfig::LOCAL)
            ->and(file_exists(storage_path('app/public/product-images/probe.txt')))->toBeTrue()
            ->and($this->bucket->sent)->toBe([]);

        Storage::disk('media_products')->delete('probe.txt');
    });

    it('falls back to the .env set', function (): void {
        mediaEnv();

        expect(app(StorageSettings::class)->current()->source)->toBe(StorageConfig::ENV);
    });

    it('prefers the admin screen\'s active set over .env — and never a pending one', function (): void {
        mediaEnv();
        mediaRow(StorageSetting::PENDING, 'noch-nicht-geprueft');

        expect(app(StorageSettings::class)->current()->bucket)->toBe('rimify-media-test');

        mediaRow(StorageSetting::ACTIVE, 'aus-dem-admin');

        expect(app(StorageSettings::class)->current()->source)->toBe(StorageConfig::DATABASE)
            ->and(app(StorageSettings::class)->current()->bucket)->toBe('aus-dem-admin');

        Storage::disk('media_site')->put('a.txt', 'x');

        expect($this->bucket->sent[0]['params']['Bucket'])->toBe('aus-dem-admin');
    });

    it('rebuilds the disks for a worker once a save bumped the version', function (): void {
        mediaEnv();
        $settings = app(StorageSettings::class);
        Storage::disk('media_products')->put('a.txt', 'x');

        // Another process saved: the row and the shared stamp moved, nothing in this one.
        mediaRow(StorageSetting::ACTIVE, 'neu-gespeichert', flush: false);
        Storage::disk('media_products')->put('b.txt', 'x');
        Cache::increment(StorageSettings::VERSION_KEY);
        $settings->refreshIfChanged();
        Storage::disk('media_products')->put('c.txt', 'x');

        // Before its next job the worker still wrote to the old bucket; after it, to the new one.
        expect(array_column(array_column($this->bucket->sent, 'params'), 'Bucket'))->toBe(['rimify-media-test', 'rimify-media-test', 'neu-gespeichert']);
    });
});

describe('the keys', function (): void {
    it('keeps them encrypted in the table and out of every dump', function (): void {
        $row = mediaRow(StorageSetting::ACTIVE, 'aus-dem-admin');
        $raw = (array) DB::table('storage_settings')->where('id', $row->id)->first();
        $set = app(StorageSettings::class)->current();

        expect(json_encode($raw))->not->toContain('DBKEYFORTESTS000CD34')->not->toContain('db/secret/for/tests/only/00000Q7R6')
            ->and($row->toArray())->not->toHaveKeys(['access_key', 'secret'])
            ->and(print_r($set, true))->not->toContain('00000Q7R6')->toContain('••••••••••••Q7R6')
            ->and(StorageConfig::mask('WXYZ'))->toBe('••••••••••••WXYZ')
            ->and(StorageConfig::mask(null))->toBeNull();
    });
});

describe('the connection test', function (): void {
    it('writes, reads, compares and deletes on invoices/ and leaves nothing behind', function (): void {
        $result = app(StorageTester::class)->run(new StorageConfig(StorageConfig::DATABASE, 'eu-north-1', 'rimify-media-test', null, false, null, MEDIA_KEY, MEDIA_SECRET));

        expect($result['ok'])->toBeTrue()
            ->and(array_column($result['steps'], 'step'))->toBe(['Testdatei in invoices/ schreiben', 'Testdatei wieder lesen', 'Inhalt vergleichen', 'Testdatei löschen'])
            ->and($this->bucket->sent[0]['params']['Key'])->toBe('invoices/.healthcheck')
            ->and($this->bucket->objects)->toBe([]);
    });

    it('names the storage\'s own reason when a step fails', function (): void {
        $this->bucket->failWith('AccessDenied');
        $result = app(StorageTester::class)->run(new StorageConfig(StorageConfig::DATABASE, 'eu-north-1', 'rimify-media-test', null, false, null, MEDIA_KEY, MEDIA_SECRET));

        expect($result['ok'])->toBeFalse()
            ->and($result['steps'][0]['ok'])->toBeFalse()
            ->and($result['steps'][0]['detail'])->toStartWith('AccessDenied');
    });
});
