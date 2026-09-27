<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Aws\S3\PostObjectV4;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Throwable;

/**
 * A large PDF (a Gutachten, up to config/media.php `pdf_max_mb`) goes from the browser straight into
 * the bucket, never through the app: `presign` hands out a form the bucket accepts for ten minutes —
 * one key, PDF only, up to the size limit, no ACL — and the browser posts the file there, retrying on
 * its own (usePresignedUpload).
 *
 * It lands under `invoices/pending/`, private: nobody can open an upload nobody has checked. Only
 * `confirm` moves it into place — after the object is found, its size is within the limit, its first
 * bytes say PDF and the VirusScanner hook passed — and only then does the calling feature write its
 * row. A pending upload that is never confirmed is never public and never in the database.
 *
 * Without a bucket (a development machine) the form posts to the app's own signed address instead,
 * which stores the file in the same pending place, so the flow is the same everywhere.
 *
 * @phpstan-type Form array{url: string, fields: array<string, string>, key: string, maxBytes: int, expiresAt: string}
 * @phpstan-type Confirmed array{disk: string, path: string, bytes: int}
 */
final class PdfUpload
{
    public const PENDING = 'pending';

    private const PENDING_KEY = '#^pending/[0-9a-z]{26}\.pdf$#';

    public function __construct(
        private readonly StorageSettings $settings,
        private readonly AwsClients $aws,
        private readonly VirusScanner $scanner,
        private readonly StorageProbe $probe,
    ) {}

    public static function maxBytes(): int
    {
        return (int) config('media.upload.pdf_max_mb') * 1024 * 1024;
    }

    /** @return Form */
    public function presign(): array
    {
        $set = $this->settings->current();
        $key = self::PENDING.'/'.Str::lower((string) Str::ulid()).'.pdf';
        $expires = now()->addMinutes((int) config('media.upload.presign_minutes'));

        if (! $set->isBucket()) {
            return [
                'url' => URL::temporarySignedRoute('admin.uploads.pdf.local', $expires, ['name' => basename($key)]),
                'fields' => [],
                'key' => $key,
                'maxBytes' => self::maxBytes(),
                'expiresAt' => $expires->toIso8601String(),
            ];
        }

        $objectKey = self::objectKey($key);
        $post = new PostObjectV4(
            $this->aws->s3($set),
            (string) $set->bucket,
            ['key' => $objectKey, 'Content-Type' => 'application/pdf'],
            [
                ['bucket' => (string) $set->bucket],
                ['eq', '$key', $objectKey],
                ['eq', '$Content-Type', 'application/pdf'],
                ['content-length-range', 1, self::maxBytes()],
            ],
            $expires->getTimestamp(),
        );

        /** @var array<string, string> $fields */
        $fields = $post->getFormInputs();

        return [
            'url' => (string) $post->getFormAttributes()['action'],
            'fields' => $fields,
            'key' => $key,
            'maxBytes' => self::maxBytes(),
            'expiresAt' => $expires->toIso8601String(),
        ];
    }

    /**
     * The upload checked and moved to `$disk`/`$directory`. The caller writes its row after this and
     * only after this.
     *
     * @return Confirmed
     *
     * @throws UploadRejected with the sentence to show
     */
    public function confirm(string $key, string $disk, string $directory): array
    {
        if (preg_match(self::PENDING_KEY, $key) !== 1) {
            throw new UploadRejected('Diese Datei kennen wir nicht. Lad sie bitte noch einmal hoch.');
        }

        $set = $this->settings->current();
        $final = trim($directory, '/').'/'.basename($key);

        try {
            [$bytes, $magic] = $set->isBucket() ? $this->inspectInBucket($set, $key) : $this->inspectLocally($key);
        } catch (UploadRejected $e) {
            throw $e;
        } catch (Throwable $e) {
            $this->probe->markDown($e);

            throw UploadRejected::storageDown();
        }

        $refusal = match (true) {
            $bytes > self::maxBytes() => 'Die Datei ist größer als '.config('media.upload.pdf_max_mb').' MB und wird nicht gespeichert.',
            $magic !== '%PDF-' => 'Das ist keine PDF-Datei. Lad bitte das Gutachten als PDF hoch.',
            default => $this->scan($key),
        };

        if ($refusal !== null) {
            $this->forget($key);

            throw new UploadRejected($refusal);
        }

        try {
            if ($set->isBucket()) {
                $s3 = $this->aws->s3($set);
                $s3->copyObject([
                    'Bucket' => $set->bucket,
                    'Key' => config("media.disks.{$disk}.prefix").'/'.$final,
                    'CopySource' => $set->bucket.'/'.self::objectKey($key),
                    'ContentType' => 'application/pdf',
                    'MetadataDirective' => 'REPLACE',
                ]);
            } else {
                $source = Storage::disk('docs_private')->readStream($key);
                Storage::disk($disk)->writeStream($final, $source);
            }

            $this->forget($key);
        } catch (Throwable $e) {
            $this->probe->markDown($e);

            throw UploadRejected::storageDown();
        }

        return ['disk' => $disk, 'path' => $final, 'bytes' => $bytes];
    }

    /** The key in the bucket: the private disk's prefix in front. */
    private static function objectKey(string $key): string
    {
        return config('media.disks.docs_private.prefix').'/'.$key;
    }

    /** @return array{0: int, 1: string} size, first five bytes — without fetching the whole file */
    private function inspectInBucket(StorageConfig $set, string $key): array
    {
        $s3 = $this->aws->s3($set);

        if (! $s3->doesObjectExistV2((string) $set->bucket, self::objectKey($key))) {
            throw new UploadRejected('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        $bytes = (int) $s3->headObject(['Bucket' => $set->bucket, 'Key' => self::objectKey($key)])->get('ContentLength');
        $magic = (string) $s3->getObject(['Bucket' => $set->bucket, 'Key' => self::objectKey($key), 'Range' => 'bytes=0-4'])->get('Body');

        return [$bytes, substr($magic, 0, 5)];
    }

    /** @return array{0: int, 1: string} */
    private function inspectLocally(string $key): array
    {
        $disk = Storage::disk('docs_private');

        if (! $disk->exists($key)) {
            throw new UploadRejected('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        $stream = $disk->readStream($key);
        $magic = is_resource($stream) ? (string) fread($stream, 5) : '';

        if (is_resource($stream)) {
            fclose($stream);
        }

        return [(int) $disk->size($key), $magic];
    }

    /** The scanner's refusal, or null — the file fetched for it only when there is a scanner. */
    private function scan(string $key): ?string
    {
        if (! $this->scanner->active()) {
            return null;
        }

        $local = tempnam(sys_get_temp_dir(), 'rimify-pdf-');
        $target = fopen((string) $local, 'wb');
        $source = Storage::disk('docs_private')->readStream($key);

        try {
            if (is_resource($source) && is_resource($target)) {
                stream_copy_to_stream($source, $target);
            }

            return $this->scanner->scan((string) $local) === null ? null : 'Der Virenscanner hat die Datei abgelehnt. Sie wird nicht gespeichert.';
        } finally {
            if (is_resource($source)) {
                fclose($source);
            }

            if (is_resource($target)) {
                fclose($target);
            }

            @unlink((string) $local);
        }
    }

    private function forget(string $key): void
    {
        try {
            Storage::disk('docs_private')->delete($key);
        } catch (Throwable) {
            // Left in pending/, private: never public, never in the database.
        }
    }
}
