<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Aws\Exception\AwsException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * `rimify:s3-audit`: the bucket checked by us, not asked about — ten rows, each `ok`, `warn`,
 * `fail`, `info` or `skip`, with what was found. It is also the proof sent to the client.
 *
 *   1 Credentials resolve, and which buckets the key can see.   6 Versioning.
 *   2 The configured bucket exists (else: the names that do).   7 CORS allows PUT and POST from us.
 *   3 Its region is the configured one (a 301 otherwise).       8 Lifecycle clears broken uploads.
 *   4 Write, read and delete in each of the four prefixes.      9 Encryption at rest.
 *   5 Plain HTTP reads: 200, 200, 200 — and 403 on invoices/.  10 Every probe object is gone again.
 *
 * Probe objects are small text files under a random name; every one is deleted, and row 10 says so.
 *
 * @phpstan-type Row array{n: int, check: string, status: 'ok'|'warn'|'fail'|'info'|'skip', detail: string}
 */
final class S3Audit
{
    private const NO_LIFECYCLE_RULE = 'Keine Regel räumt unvollständige Uploads auf – abgebrochene Teile bleiben liegen und kosten.';

    /** @var list<string> probe keys written and not yet confirmed gone */
    private array $probes = [];

    public function __construct(private readonly StorageSettings $settings, private readonly AwsClients $aws) {}

    /** @return array{config: StorageConfig, rows: list<Row>} */
    public function run(?StorageConfig $set = null): array
    {
        $set ??= $this->settings->current();
        $rows = [];

        if (! $set->isBucket()) {
            $rows[] = self::row(1, 'Zugangsdaten', 'fail', 'Kein Bucket eingerichtet: weder in Einstellungen › Medien und Speicher noch in der .env-Datei.');

            return ['config' => $set, 'rows' => [...$rows, ...self::skipAfter(1)]];
        }

        $s3 = $this->aws->s3($set);
        $bucket = (string) $set->bucket;

        // 1 · Credentials, and what the key can see.
        $visible = null;

        try {
            $identity = $this->aws->sts($set)->getCallerIdentity();
            $arn = (string) $identity->get('Arn');

            try {
                $visible = array_map(static fn (array $b): string => (string) $b['Name'], (array) $s3->listBuckets()->get('Buckets'));
                $rows[] = self::row(1, 'Zugangsdaten', 'ok', "{$arn} sieht: ".($visible === [] ? 'keinen Bucket' : implode(', ', $visible)));
            } catch (AwsException $e) {
                $rows[] = self::row(1, 'Zugangsdaten', 'ok', "{$arn} · Liste der Buckets: ".self::unreadable($e, 's3:ListAllMyBuckets'));
            }
        } catch (Throwable $e) {
            $rows[] = self::row(1, 'Zugangsdaten', 'fail', self::aws($e));

            return ['config' => $set, 'rows' => [...$rows, ...self::skipAfter(1)]];
        }

        // 2 · The bucket exists under this exact name.
        try {
            $s3->headBucket(['Bucket' => $bucket]);
            $rows[] = self::row(2, 'Bucket', 'ok', "„{$bucket}“ gefunden");
        } catch (Throwable $e) {
            $names = $visible === null ? 'nicht auflistbar' : ($visible === [] ? 'keine' : implode(', ', $visible));
            $rows[] = self::row(2, 'Bucket', 'fail', "„{$bucket}“ gibt es nicht oder ist nicht erreichbar (".self::aws($e)."). Vorhandene Buckets: {$names}");

            return ['config' => $set, 'rows' => [...$rows, ...self::skipAfter(2)]];
        }

        // 3 · Region.
        try {
            $location = (string) ($s3->getBucketLocation(['Bucket' => $bucket])->get('LocationConstraint') ?: 'us-east-1');
            $rows[] = $location === $set->region
                ? self::row(3, 'Region', 'ok', $location)
                : self::row(3, 'Region', 'fail', "Der Bucket liegt in {$location}, eingestellt ist {$set->region} – AWS antwortet dann mit 301, das wie ein Rechteproblem aussieht.");
        } catch (Throwable $e) {
            $rows[] = self::row(3, 'Region', 'warn', self::unreadable($e, 's3:GetBucketLocation'));
        }

        $prefixes = [];

        foreach ((array) config('media.disks') as $spec) {
            $prefixes[(string) $spec['prefix']] = $spec['visibility'] === 'public';
        }

        // 4 · Write, read, delete in each prefix.
        $fails = [];

        foreach (array_keys($prefixes) as $prefix) {
            $key = $this->probeKey($prefix);
            $content = 'rimify-audit '.$key;

            try {
                $s3->putObject(['Bucket' => $bucket, 'Key' => $key, 'Body' => $content, 'ContentType' => 'text/plain']);
                $got = (string) $s3->getObject(['Bucket' => $bucket, 'Key' => $key])->get('Body');
                $s3->deleteObject(['Bucket' => $bucket, 'Key' => $key]);

                if ($got !== $content) {
                    $fails[] = "{$prefix}/: gelesen ≠ geschrieben";
                }
            } catch (Throwable $e) {
                $fails[] = "{$prefix}/: ".self::aws($e);
            }
        }

        $rows[] = $fails === []
            ? self::row(4, 'Schreiben, lesen, löschen', 'ok', implode(', ', array_map(static fn (string $p): string => "{$p}/", array_keys($prefixes))))
            : self::row(4, 'Schreiben, lesen, löschen', 'fail', implode(' · ', $fails));

        // 5 · Plain HTTP reads, no credentials: public prefixes 200, the private one 403.
        $codes = [];
        $wrong = [];
        $leak = false;

        foreach ($prefixes as $prefix => $public) {
            $key = $this->probeKey($prefix);

            try {
                $s3->putObject(['Bucket' => $bucket, 'Key' => $key, 'Body' => 'rimify-audit', 'ContentType' => 'text/plain']);
                $status = Http::timeout(15)->withoutRedirecting()->get(self::objectUrl($set, $key))->status();
            } catch (Throwable $e) {
                $status = 0;
                $wrong[] = "{$prefix}/: ".self::aws($e);
            } finally {
                try {
                    $s3->deleteObject(['Bucket' => $bucket, 'Key' => $key]);
                } catch (Throwable) {
                    // Row 10 finds it.
                }
            }

            $codes[] = "{$prefix}/ {$status}";
            $expected = $public ? 200 : 403;

            if ($status !== $expected) {
                $wrong[] = "{$prefix}/ antwortet {$status}, erwartet {$expected}";
                $leak = $leak || (! $public && $status === 200);
            }
        }

        $rows[] = $leak
            ? self::row(5, 'Öffentlich lesbar', 'fail', 'ACHTUNG: invoices/ IST ÖFFENTLICH LESBAR – Rechnungen sind für jeden abrufbar. '.implode(', ', $codes))
            : ($wrong === [] ? self::row(5, 'Öffentlich lesbar', 'ok', implode(', ', $codes)) : self::row(5, 'Öffentlich lesbar', 'fail', implode(' · ', $wrong)));

        // 6 · Versioning.
        try {
            $status = (string) ($s3->getBucketVersioning(['Bucket' => $bucket])->get('Status') ?: 'aus');
            $rows[] = $status === 'Enabled'
                ? self::row(6, 'Versionierung', 'ok', 'Enabled')
                : self::row(6, 'Versionierung', 'warn', "{$status} – eine überschriebene oder gelöschte Datei ist dann endgültig weg.");
        } catch (Throwable $e) {
            $rows[] = self::row(6, 'Versionierung', 'warn', self::unreadable($e, 's3:GetBucketVersioning'));
        }

        // 7 · CORS: PUT and POST from our origins.
        $origin = rtrim((string) config('app.url'), '/');

        try {
            $rules = (array) $s3->getBucketCors(['Bucket' => $bucket])->get('CORSRules');
            $origins = [];
            $allows = false;

            foreach ($rules as $rule) {
                $methods = array_map('strtoupper', (array) ($rule['AllowedMethods'] ?? []));
                $ruleOrigins = (array) ($rule['AllowedOrigins'] ?? []);
                $origins = [...$origins, ...$ruleOrigins];
                $allows = $allows || (in_array('PUT', $methods, true) && in_array('POST', $methods, true) && (in_array('*', $ruleOrigins, true) || in_array($origin, $ruleOrigins, true)));
            }

            $list = $origins === [] ? 'keine' : implode(', ', array_unique($origins));
            $rows[] = $allows
                ? self::row(7, 'CORS', 'ok', "PUT und POST erlaubt für: {$list}")
                : self::row(7, 'CORS', 'fail', "PUT und POST für {$origin} fehlen. Eingetragen: {$list}");
        } catch (Throwable $e) {
            // A key that may not READ the rule says nothing about the rule (ADMIN-GEFUNDEN 502): then the browser's own
            // question decides — the Gutachten upload is a POST with progress, so the browser asks first, every time.
            $rows[] = self::awsCode($e) === 'NoSuchCORSConfiguration'
                ? self::row(7, 'CORS', 'fail', 'Keine CORS-Regel ('.self::aws($e)."). Nötig: PUT und POST für {$origin} – für das direkte Hochladen der Gutachten.")
                : self::preflightRow($set, $origin, self::denied($e)
                    ? 'Die Regel selbst darf der Schlüssel nicht lesen – ihm fehlt die Berechtigung s3:GetBucketCORS ('.self::aws($e).')'
                    : 'Die Regel selbst ließ sich nicht lesen ('.self::aws($e).')');
        }

        // 8 · Lifecycle: incomplete multipart uploads cleaned up.
        try {
            $rules = (array) $s3->getBucketLifecycleConfiguration(['Bucket' => $bucket])->get('Rules');
            $clears = array_filter($rules, static fn (array $r): bool => ($r['Status'] ?? '') === 'Enabled' && isset($r['AbortIncompleteMultipartUpload']));
            $rows[] = $clears !== []
                ? self::row(8, 'Lebenszyklus', 'ok', 'Unvollständige Uploads werden aufgeräumt')
                : self::row(8, 'Lebenszyklus', 'warn', self::NO_LIFECYCLE_RULE);
        } catch (Throwable $e) {
            // „Keine Regel“ only where AWS says there is none — a rule the key may not read is not a missing rule.
            $rows[] = self::awsCode($e) === 'NoSuchLifecycleConfiguration'
                ? self::row(8, 'Lebenszyklus', 'warn', self::NO_LIFECYCLE_RULE)
                : self::row(8, 'Lebenszyklus', 'warn', self::unreadable($e, 's3:GetLifecycleConfiguration'));
        }

        // 9 · Encryption at rest.
        try {
            $sse = (array) $s3->getBucketEncryption(['Bucket' => $bucket])->search('ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault');
            $rows[] = self::row(9, 'Verschlüsselung', 'info', (string) ($sse['SSEAlgorithm'] ?? 'unbekannt'));
        } catch (Throwable $e) {
            $rows[] = self::awsCode($e) === 'ServerSideEncryptionConfigurationNotFoundError'
                ? self::row(9, 'Verschlüsselung', 'info', 'Keine Standardverschlüsselung eingestellt')
                : self::row(9, 'Verschlüsselung', 'info', self::unreadable($e, 's3:GetEncryptionConfiguration'));
        }

        // 10 · Nothing left behind.
        $left = [];

        foreach ($this->probes as $key) {
            try {
                if ($s3->doesObjectExistV2($bucket, $key)) {
                    $s3->deleteObject(['Bucket' => $bucket, 'Key' => $key]);
                    $left[] = $key;
                }
            } catch (Throwable) {
                $left[] = $key;
            }
        }

        $rows[] = $left === []
            ? self::row(10, 'Aufräumen', 'ok', count($this->probes).' Prüfdateien geschrieben, alle wieder gelöscht')
            : self::row(10, 'Aufräumen', 'warn', count($left).' Prüfdateien mussten nachträglich gelöscht werden: '.implode(', ', $left));

        return ['config' => $set, 'rows' => $rows];
    }

    /**
     * Row 7 asked as a browser asks: an OPTIONS request from our origin for PUT and for POST, without credentials. The
     * bucket answers it from its CORS rule whatever the key may read — 200 with our origin allowed, or 403.
     * `$unreadable` says why the rule itself could not be read.
     *
     * @return Row
     */
    private static function preflightRow(StorageConfig $set, string $origin, string $unreadable): array
    {
        $refused = [];

        foreach (['PUT', 'POST'] as $method) {
            try {
                $response = Http::timeout(15)->withoutRedirecting()
                    ->withHeaders(['Origin' => $origin, 'Access-Control-Request-Method' => $method])
                    ->send('OPTIONS', self::objectUrl($set, ''));
                $allowedOrigin = (string) $response->header('Access-Control-Allow-Origin');
                $allowedMethods = array_map('trim', explode(',', strtoupper((string) $response->header('Access-Control-Allow-Methods'))));

                if ($response->status() !== 200 || ! in_array($allowedOrigin, ['*', $origin], true) || ! in_array($method, $allowedMethods, true)) {
                    $refused[] = "{$method}: HTTP {$response->status()}";
                }
            } catch (Throwable $e) {
                $refused[] = "{$method}: ".self::aws($e);
            }
        }

        $unread = "{$unreadable}. Deshalb wurde wie ein Browser gefragt.";

        return $refused === []
            ? self::row(7, 'CORS', 'ok', "PUT und POST von {$origin} erlaubt. {$unread}")
            : self::row(7, 'CORS', 'fail', "Der Browser darf von {$origin} nicht direkt in den Bucket hochladen (".implode(', ', $refused)."). Nötig: PUT und POST für {$origin} – für das direkte Hochladen der Gutachten. {$unread}");
    }

    /** @return list<Row> */
    private static function skipAfter(int $n): array
    {
        $names = [1 => 'Zugangsdaten', 2 => 'Bucket', 3 => 'Region', 4 => 'Schreiben, lesen, löschen', 5 => 'Öffentlich lesbar', 6 => 'Versionierung', 7 => 'CORS', 8 => 'Lebenszyklus', 9 => 'Verschlüsselung', 10 => 'Aufräumen'];
        $rows = [];

        for ($i = $n + 1; $i <= 10; $i++) {
            $rows[] = self::row($i, $names[$i], 'skip', 'übersprungen');
        }

        return $rows;
    }

    /** @return Row */
    private static function row(int $n, string $check, string $status, string $detail): array
    {
        /** @var 'ok'|'warn'|'fail'|'info'|'skip' $status */
        return ['n' => $n, 'check' => $check, 'status' => $status, 'detail' => $detail];
    }

    private function probeKey(string $prefix): string
    {
        $key = "{$prefix}/.rimify-audit-".Str::lower((string) Str::ulid()).'.txt';
        $this->probes[] = $key;

        return $key;
    }

    /** The object's address on the bucket itself, for a read with no credentials at all. */
    private static function objectUrl(StorageConfig $set, string $key): string
    {
        $base = $set->endpoint !== null && $set->endpoint !== ''
            ? rtrim($set->endpoint, '/').'/'.$set->bucket
            : "https://{$set->bucket}.s3.{$set->region}.amazonaws.com";

        return $base.'/'.implode('/', array_map('rawurlencode', explode('/', $key)));
    }

    private static function aws(Throwable $e): string
    {
        return StorageTester::reason($e);
    }

    /**
     * A setting the key may not read says nothing about the setting (ADMIN-GEFUNDEN 502): the row names what is
     * unknown, why, and what would make it known — the permission the key lacks. Any other failure is reported as is.
     */
    private static function unreadable(Throwable $e, string $permission): string
    {
        return self::denied($e)
            ? "Nicht lesbar – dem Schlüssel fehlt die Berechtigung {$permission} (".self::aws($e).')'
            : 'Abfrage fehlgeschlagen: '.self::aws($e);
    }

    /** Whether AWS refused the key the question, rather than failing to answer it. */
    private static function denied(Throwable $e): bool
    {
        for ($cause = $e; $cause !== null; $cause = $cause->getPrevious()) {
            if ($cause instanceof AwsException) {
                return in_array($cause->getAwsErrorCode(), ['AccessDenied', 'AllAccessDisabled'], true) || $cause->getStatusCode() === 403;
            }
        }

        return false;
    }

    private static function awsCode(Throwable $e): ?string
    {
        return $e instanceof AwsException ? $e->getAwsErrorCode() : null;
    }
}
