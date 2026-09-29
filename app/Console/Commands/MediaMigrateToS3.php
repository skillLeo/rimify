<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Storage\AwsClients;
use App\Services\Storage\MediaDisks;
use App\Services\Storage\StorageConfig;
use App\Services\Storage\StorageSettings;
use App\Services\Storage\StorageTester;
use App\Support\GermanFormat;
use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;
use Illuminate\Console\Command;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * The media that lived in local folders before the bucket, moved into it: each of the four disks'
 * folder (storage/app/public|private/<prefix>) into the same prefix of the bucket in force.
 *
 *   --dry-run  says what it would copy, and copies nothing;
 *   --verify   copies nothing, and says for every file whether the bucket holds the same bytes.
 *
 * Idempotent: a file the bucket already holds with the same size and checksum is left alone, so a run
 * cut short is simply run again. The local files are never deleted — that is a separate decision,
 * made after --verify came back clean.
 */
final class MediaMigrateToS3 extends Command
{
    protected $signature = 'media:migrate-to-s3 {--dry-run : Only list what would be copied} {--verify : Only compare local files with the bucket}';

    protected $description = 'Copy the media disks\' local folders into the bucket (idempotent), or compare them';

    public function handle(StorageSettings $settings, MediaDisks $disks, AwsClients $aws): int
    {
        $set = $settings->current();

        if (! $set->isBucket()) {
            $this->error('Kein Bucket eingerichtet: weder in Einstellungen › Medien und Speicher noch in der .env-Datei. Es gibt nichts, wohin kopiert werden könnte.');

            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');
        $verify = (bool) $this->option('verify');
        $s3 = $aws->s3($set);
        $rows = [];
        $errors = [];

        $this->line("Bucket „{$set->bucket}“ · Einstellungen aus: {$set->source}".($dry ? ' · Probelauf, es wird nichts kopiert' : '').($verify ? ' · nur Vergleich' : ''));

        foreach (MediaDisks::names() as $name) {
            $prefix = (string) config("media.disks.{$name}.prefix");
            $local = $disks->make($disks->config($name, StorageConfig::local()));
            $counts = ['files' => 0, 'same' => 0, 'copied' => 0, 'missing' => 0, 'bytes' => 0];

            foreach ($local->allFiles() as $path) {
                $counts['files']++;
                $size = (int) $local->size($path);
                $state = $this->compare($s3, $set, "{$prefix}/{$path}", $size, $local, $path);

                if ($state === 'same') {
                    $counts['same']++;

                    continue;
                }

                if ($verify || $dry) {
                    $counts['missing']++;
                    $counts['bytes'] += $size;

                    if ($this->output->isVerbose()) {
                        $this->line("  {$prefix}/{$path}: ".($state === 'absent' ? 'fehlt im Bucket' : 'im Bucket anders'));
                    }

                    continue;
                }

                try {
                    $this->copy($local, $name, $path);

                    if ($this->compare($s3, $set, "{$prefix}/{$path}", $size, $local, $path) !== 'same') {
                        throw new \RuntimeException('Nach dem Kopieren weicht die Datei im Bucket ab.');
                    }

                    $counts['copied']++;
                    $counts['bytes'] += $size;
                } catch (Throwable $e) {
                    $errors[] = "{$prefix}/{$path}: ".StorageTester::reason($e);
                }
            }

            $rows[] = [
                "{$name} ({$prefix}/)",
                GermanFormat::integer($counts['files']),
                GermanFormat::integer($counts['same']),
                GermanFormat::integer($verify || $dry ? $counts['missing'] : $counts['copied']),
                GermanFormat::integer((int) ceil($counts['bytes'] / 1024)).' KB',
            ];
        }

        $moved = $verify ? 'Fehlt oder anders' : ($dry ? 'Würde kopiert' : 'Kopiert');
        $this->table(['Speicher', 'Dateien lokal', 'Schon im Bucket', $moved, 'Umfang'], $rows);

        foreach ($errors as $error) {
            $this->error($error);
        }

        if ($errors !== []) {
            return self::FAILURE;
        }

        if ($verify) {
            $differ = array_sum(array_map(static fn (array $r): int => (int) str_replace('.', '', $r[3]), $rows));

            if ($differ > 0) {
                $this->error("{$differ} Dateien fehlen im Bucket oder sind dort anders. Führ den Befehl ohne --verify aus.");

                return self::FAILURE;
            }

            $this->info('Der Bucket hat jede lokale Datei, Byte für Byte.');
        }

        return self::SUCCESS;
    }

    /**
     * `same` when the bucket holds this file: same size, and — where S3's ETag is the MD5 of a single
     * upload — the same MD5. `absent` or `differs` otherwise.
     */
    private function compare(S3Client $s3, StorageConfig $set, string $key, int $size, Filesystem $local, string $path): string
    {
        try {
            $head = $s3->headObject(['Bucket' => $set->bucket, 'Key' => $key]);
        } catch (S3Exception $e) {
            if ($e->getStatusCode() === 404 || $e->getAwsErrorCode() === 'NotFound') {
                return 'absent';
            }

            throw $e;
        }

        if ((int) $head->get('ContentLength') !== $size) {
            return 'differs';
        }

        $etag = trim((string) $head->get('ETag'), '"');

        // A multipart upload's ETag is not an MD5 (it carries a „-n“); the size has to do.
        if ($etag === '' || str_contains($etag, '-')) {
            return 'same';
        }

        return hash_equals($etag, md5((string) $local->get($path))) ? 'same' : 'differs';
    }

    private function copy(Filesystem $local, string $disk, string $path): void
    {
        $stream = $local->readStream($path);
        $mime = $local->mimeType($path) ?: 'application/octet-stream';

        try {
            Storage::disk($disk)->writeStream($path, $stream, ['ContentType' => $mime]);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
    }
}
