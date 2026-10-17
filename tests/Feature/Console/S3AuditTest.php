<?php

declare(strict_types=1);

use App\Services\Storage\S3Audit;
use App\Services\Storage\StorageSettings;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeBucket;

/*
 * rimify:s3-audit — ten checks of the bucket, the proof the client gets — and its row in
 * rimify:preflight. AWS is FakeBucket; the plain HTTP reads are faked: 200 on the three public
 * prefixes, 403 on invoices/ (and, in the case that must never pass, 200 there too).
 */

const AUDIT_HOST = 'https://rimify-media-test.s3.eu-north-1.amazonaws.com';

beforeEach(function (): void {
    config(['app.url' => 'https://rimify.test']);
    config(['media.s3' => ['key' => 'FAKEKEYFORTESTS0AB12', 'secret' => 'fake/secret/for/tests/only/0000X9Y8', 'region' => 'eu-north-1', 'bucket' => 'rimify-media-test', 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    $this->bucket = FakeBucket::install();
    app(StorageSettings::class)->flush();

    $this->bucket->answers = [
        'GetCallerIdentity' => ['Arn' => 'arn:aws:iam::000000000000:user/rimify-media'],
        'GetBucketLocation' => ['LocationConstraint' => 'eu-north-1'],
        'GetBucketVersioning' => ['Status' => 'Enabled'],
        'GetBucketCors' => ['CORSRules' => [['AllowedMethods' => ['GET', 'PUT', 'POST'], 'AllowedOrigins' => ['https://rimify.test']]]],
        'GetBucketLifecycleConfiguration' => ['Rules' => [['Status' => 'Enabled', 'AbortIncompleteMultipartUpload' => ['DaysAfterInitiation' => 1]]]],
        'GetBucketEncryption' => ['ServerSideEncryptionConfiguration' => ['Rules' => [['ApplyServerSideEncryptionByDefault' => ['SSEAlgorithm' => 'AES256']]]]],
    ];
});

function auditHttp(int $invoices = 403): void
{
    Http::fake([
        AUDIT_HOST.'/invoices/*' => Http::response('', $invoices),
        AUDIT_HOST.'/*' => Http::response('rimify-audit', 200),
    ]);
}

/** @return array<int, array{n: int, check: string, status: string, detail: string}> */
function auditRows(): array
{
    return collect(app(S3Audit::class)->run()['rows'])->keyBy('n')->all();
}

it('passes a bucket set up as agreed, and leaves no probe file behind', function (): void {
    auditHttp();
    $rows = auditRows();

    expect(array_column($rows, 'status', 'n'))->toBe([1 => 'ok', 2 => 'ok', 3 => 'ok', 4 => 'ok', 5 => 'ok', 6 => 'ok', 7 => 'ok', 8 => 'ok', 9 => 'info', 10 => 'ok'])
        ->and($rows[1]['detail'])->toContain('arn:aws:iam::000000000000:user/rimify-media')->toContain('rimify-media-test')
        ->and($rows[4]['detail'])->toBe('product-images/, website-images/, ABEs/, invoices/')
        ->and($rows[5]['detail'])->toBe('product-images/ 200, website-images/ 200, ABEs/ 200, invoices/ 403')
        ->and($this->bucket->objects)->toBe([])
        ->and(array_filter($this->bucket->sent, static fn (array $s): bool => isset($s['params']['ACL'])))->toBe([]);

    $this->artisan('rimify:s3-audit', ['--no-report' => true])->expectsOutputToContain('Alle Prüfungen bestanden.')->assertSuccessful();
});

it('fails loudly when invoices/ can be read by anyone', function (): void {
    auditHttp(invoices: 200);

    expect(auditRows()[5])->toMatchArray(['status' => 'fail'])
        ->and(auditRows()[5]['detail'])->toStartWith('ACHTUNG: invoices/ IST ÖFFENTLICH LESBAR');

    $this->artisan('rimify:s3-audit', ['--no-report' => true])->assertFailed();
});

it('names the region the bucket is really in, and the buckets that exist when the name is wrong', function (): void {
    auditHttp();
    $this->bucket->answers['GetBucketLocation'] = ['LocationConstraint' => 'eu-central-1'];

    expect(auditRows()[3]['status'])->toBe('fail');

    $this->bucket->refuse['HeadBucket'] = 'NoSuchBucket';
    $this->bucket->buckets = ['rimify-media-eu'];
    $rows = auditRows();

    expect($rows[2]['status'])->toBe('fail')
        ->and($rows[2]['detail'])->toContain('Vorhandene Buckets: rimify-media-eu')
        ->and($rows[3]['status'])->toBe('skip');
});

it('warns — and does not fail — on versioning and lifecycle, and fails on missing CORS', function (): void {
    auditHttp();
    $this->bucket->answers['GetBucketVersioning'] = [];
    $this->bucket->refuse['GetBucketLifecycleConfiguration'] = 'NoSuchLifecycleConfiguration';
    $this->bucket->refuse['GetBucketCors'] = 'NoSuchCORSConfiguration';
    $rows = auditRows();

    expect($rows[6]['status'])->toBe('warn')
        ->and($rows[8]['status'])->toBe('warn')
        ->and($rows[7]['status'])->toBe('fail')
        ->and($rows[7]['detail'])->toContain('PUT und POST für https://rimify.test');
});

/** The plain reads as auditHttp() answers them, and the browser's CORS question answered by a rule allowing `$allowed`. */
function auditHttpWithCors(?string $allowed): void
{
    Http::fake(static function (Request $request) use ($allowed) {
        if ($request->method() === 'OPTIONS') {
            return $allowed !== null && $request->header('Origin')[0] === $allowed
                ? Http::response('', 200, ['Access-Control-Allow-Origin' => $allowed, 'Access-Control-Allow-Methods' => 'PUT, POST'])
                : Http::response('', 403);
        }

        return str_contains($request->url(), '/invoices/') ? Http::response('', 403) : Http::response('rimify-audit', 200);
    });
}

it('asks as the browser asks where the key may not read the CORS rule — a rule it cannot see is not a missing rule (ADMIN-GEFUNDEN 502)', function (): void {
    $this->bucket->refuse['GetBucketCors'] = 'AccessDenied';

    auditHttpWithCors('https://rimify.test');
    $row = auditRows()[7];

    expect($row['status'])->toBe('ok')
        ->and($row['detail'])->toStartWith('PUT und POST von https://rimify.test erlaubt.')
        ->and($row['detail'])->toContain('Die Regel selbst darf der Schlüssel nicht lesen');

    Http::assertSent(static fn (Request $r): bool => $r->method() === 'OPTIONS'
        && $r->url() === AUDIT_HOST.'/'
        && $r->header('Origin') === ['https://rimify.test']
        && $r->header('Access-Control-Request-Method') === ['POST']);
});

it('fails the CORS row when the browser would be refused, though the key cannot read the rule', function (): void {
    $this->bucket->refuse['GetBucketCors'] = 'AccessDenied';

    // The rule allows another site only.
    auditHttpWithCors('https://elsewhere.test');
    $row = auditRows()[7];

    expect($row['status'])->toBe('fail')
        ->and($row['detail'])->toContain('Der Browser darf von https://rimify.test nicht direkt in den Bucket hochladen (PUT: HTTP 403, POST: HTTP 403)');
});

it('names the permission the key lacks where it may not read a setting, and says „keine Regel“ only where AWS does (ADMIN-GEFUNDEN 502)', function (): void {
    auditHttpWithCors('https://rimify.test');

    foreach (['ListBuckets', 'GetBucketLocation', 'GetBucketVersioning', 'GetBucketCors', 'GetBucketLifecycleConfiguration', 'GetBucketEncryption'] as $command) {
        $this->bucket->refuse[$command] = 'AccessDenied';
    }

    $rows = auditRows();

    expect($rows[1]['detail'])->toContain('Liste der Buckets: Nicht lesbar – dem Schlüssel fehlt die Berechtigung s3:ListAllMyBuckets (AccessDenied')
        ->and($rows[3]['detail'])->toStartWith('Nicht lesbar – dem Schlüssel fehlt die Berechtigung s3:GetBucketLocation (AccessDenied')
        ->and($rows[6]['detail'])->toStartWith('Nicht lesbar – dem Schlüssel fehlt die Berechtigung s3:GetBucketVersioning (AccessDenied')
        ->and($rows[7]['detail'])->toContain('Die Regel selbst darf der Schlüssel nicht lesen – ihm fehlt die Berechtigung s3:GetBucketCORS (AccessDenied')
        ->and($rows[8]['detail'])->toStartWith('Nicht lesbar – dem Schlüssel fehlt die Berechtigung s3:GetLifecycleConfiguration (AccessDenied')
        ->and($rows[9]['detail'])->toStartWith('Nicht lesbar – dem Schlüssel fehlt die Berechtigung s3:GetEncryptionConfiguration (AccessDenied')
        ->and(array_column($rows, 'status', 'n'))->toMatchArray([3 => 'warn', 6 => 'warn', 7 => 'ok', 8 => 'warn', 9 => 'info'])
        ->and(implode(' ', array_column($rows, 'detail')))->not->toContain('Keine Regel');

    // Where AWS says there is none, the row says so.
    $this->bucket->refuse = ['GetBucketLifecycleConfiguration' => 'NoSuchLifecycleConfiguration', 'GetBucketEncryption' => 'ServerSideEncryptionConfigurationNotFoundError'];
    $rows = auditRows();

    expect($rows[8]['detail'])->toStartWith('Keine Regel räumt unvollständige Uploads auf')
        ->and($rows[9]['detail'])->toBe('Keine Standardverschlüsselung eingestellt');

    // A failure that is not a refusal claims no permission.
    $this->bucket->refuse = ['GetBucketVersioning' => 'InternalError'];

    expect(auditRows()[6]['detail'])->toStartWith('Abfrage fehlgeschlagen: InternalError');
});

it('is one row of the preflight', function (): void {
    auditHttp();

    // One expectation per line: the console mock credits a written line to the first that matches it.
    $this->artisan('rimify:preflight')->expectsOutputToContain('10 Prüfungen, 0 Warnungen')->expectsOutputToContain('GO.');
    $this->artisan('rimify:preflight', ['--skip-s3' => true])->expectsOutputToContain('mit --skip-s3 ausgelassen');
});
