<?php

declare(strict_types=1);

use App\Services\Storage\StorageSettings;
use Illuminate\Support\Facades\File;
use Tests\Support\FakeBucket;

/*
 * media:migrate-to-s3 — the local folders into the bucket: a dry run that copies nothing, a copy that
 * checks what it copied, a second run that copies nothing again, and --verify that says byte for byte
 * whether the bucket holds every file.
 */

beforeEach(function (): void {
    config(['media.s3' => ['key' => 'FAKEKEYFORTESTS0AB12', 'secret' => 'fake/secret/for/tests/only/0000X9Y8', 'region' => 'eu-north-1', 'bucket' => 'rimify-media-test', 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    $this->bucket = FakeBucket::install();
    app(StorageSettings::class)->flush();

    $this->dirs = [storage_path('app/public/website-images/migrate-test'), storage_path('app/private/invoices/migrate-test')];
    File::ensureDirectoryExists($this->dirs[0]);
    File::ensureDirectoryExists($this->dirs[1]);
    file_put_contents($this->dirs[0].'/startseite.txt', 'Bild der Startseite');
    file_put_contents($this->dirs[1].'/R-2026-0001.txt', 'Rechnung');
});

afterEach(function (): void {
    foreach ($this->dirs as $dir) {
        File::deleteDirectory($dir);
    }
});

/** @return list<string> */
function migrateKeys(FakeBucket $bucket): array
{
    return array_values(array_filter(array_keys($bucket->objects), static fn (string $k): bool => str_contains($k, 'migrate-test')));
}

it('copies nothing on a dry run, and says what it would copy', function (): void {
    $this->artisan('media:migrate-to-s3', ['--dry-run' => true])->expectsOutputToContain('Probelauf')->assertSuccessful();

    expect(migrateKeys($this->bucket))->toBe([]);
});

it('copies each folder into its prefix, and a second run copies nothing', function (): void {
    $this->artisan('media:migrate-to-s3')->assertSuccessful();

    expect(migrateKeys($this->bucket))->toEqualCanonicalizing(['website-images/migrate-test/startseite.txt', 'invoices/migrate-test/R-2026-0001.txt'])
        ->and($this->bucket->objects['invoices/migrate-test/R-2026-0001.txt'])->toBe('Rechnung');

    $puts = count(array_filter($this->bucket->sent, static fn (array $s): bool => $s['name'] === 'PutObject'));
    $this->artisan('media:migrate-to-s3')->assertSuccessful();

    expect(count(array_filter($this->bucket->sent, static fn (array $s): bool => $s['name'] === 'PutObject')))->toBe($puts)
        ->and(array_filter($this->bucket->sent, static fn (array $s): bool => isset($s['params']['ACL'])))->toBe([]);
});

it('verifies byte for byte, and fails when the bucket holds something else', function (): void {
    $this->artisan('media:migrate-to-s3', ['--verify' => true])->assertFailed();
    $this->artisan('media:migrate-to-s3')->assertSuccessful();
    $this->artisan('media:migrate-to-s3', ['--verify' => true])->expectsOutputToContain('Byte für Byte')->assertSuccessful();

    $this->bucket->objects['invoices/migrate-test/R-2026-0001.txt'] = 'Rechnunx';

    $this->artisan('media:migrate-to-s3', ['--verify' => true])->assertFailed();
});

it('refuses to run without a bucket', function (): void {
    config(['media.s3.bucket' => null]);
    app(StorageSettings::class)->flush();

    $this->artisan('media:migrate-to-s3')->expectsOutputToContain('Kein Bucket eingerichtet')->assertFailed();
});
