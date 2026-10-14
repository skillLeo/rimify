<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Storage\DocumentFiles;
use App\Services\Storage\StorageSettings;
use App\Services\Storage\StorageTester;
use Illuminate\Console\Command;
use Throwable;

/**
 * `rimify:pdf-migrate`: every Gutachten's PDF brought to the disk in force, and a report of what was found (EIGENE-FUNDE
 * 105, ADMIN-GEFUNDEN 501; the operator's brief of 14.10.2026 §6; D-229).
 *
 * For each document with a file: on the disk in force — nothing to do; only on the server's disk while the bucket is in
 * force — copied over and read back against the SHA-256 on record, the original left where it is; nowhere — reported as
 * missing, with the document, so a person can upload it again. `--nur-pruefen` reports and copies nothing.
 *
 * Idempotent: run it after every switch of the storage, and again after a run cut short.
 */
final class PdfMigrate extends Command
{
    protected $signature = 'rimify:pdf-migrate {--nur-pruefen : Nur berichten, nichts kopieren}';

    protected $description = 'Gutachten-PDFs, die nach einem Speicherwechsel auf der anderen Seite liegen, in den Speicher in Kraft holen – und berichten';

    public function handle(DocumentFiles $files, StorageSettings $settings): int
    {
        $check = (bool) $this->option('nur-pruefen');
        $rows = [];
        $missing = 0;
        $failed = 0;

        $this->line('Speicher in Kraft: '.($settings->current()->isBucket() ? 'Bucket' : 'Server').($check ? ' · nur prüfen, es wird nichts kopiert' : ''));

        foreach (ApprovalDocument::query()->whereNotNull('pdf_key')->orderBy('id')->get() as $document) {
            $key = (string) $document->pdf_key;
            $files->forget($key);
            $state = $files->locate($key)['state'];
            $label = '#'.$document->id.' '.FitmentRows::label($document).' ('.$document->status->value.')';

            if ($state === DocumentFiles::FOUND) {
                $rows[] = [$label, 'liegt im Speicher in Kraft'];

                continue;
            }

            if ($state === DocumentFiles::MISSING) {
                $missing++;
                $rows[] = [$label, 'FEHLT – in keinem Speicher gefunden; das PDF muss neu hochgeladen werden'];

                continue;
            }

            if ($check) {
                $rows[] = [$label, 'liegt nur auf dem Server – würde kopiert'];

                continue;
            }

            try {
                $this->copy($files, $key, $document->pdf_sha256);
                $files->forget($key);
                $rows[] = [$label, 'kopiert und gegen den SHA-256 geprüft; das Original bleibt auf dem Server'];
            } catch (Throwable $e) {
                $failed++;
                $rows[] = [$label, 'NICHT kopiert: '.StorageTester::reason($e)];
            }
        }

        $this->table(['Gutachten', 'Befund'], $rows);

        if ($missing > 0 || $failed > 0) {
            $this->error(trim(($missing > 0 ? "{$missing} PDF(s) fehlen in jedem Speicher. " : '').($failed > 0 ? "{$failed} konnten nicht kopiert werden." : '')));

            return self::FAILURE;
        }

        $this->info($rows === [] ? 'Kein Gutachten hat ein PDF.' : 'Jedes Gutachten-PDF liegt im Speicher in Kraft'.($check ? ' oder würde dorthin kopiert.' : '.'));

        return self::SUCCESS;
    }

    /** From the server's disk into the disk in force, then read back: the bytes must be the ones on record. */
    private function copy(DocumentFiles $files, string $key, ?string $sha256): void
    {
        $stream = $files->local()->readStream($key);

        try {
            $files->current()->writeStream($key, $stream, ['ContentType' => 'application/pdf']);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        $copied = hash('sha256', (string) $files->current()->get($key));

        if ($sha256 !== null && ! hash_equals($sha256, $copied)) {
            throw new \RuntimeException("Nach dem Kopieren weicht die Prüfsumme ab ({$copied} statt {$sha256}).");
        }
    }
}
