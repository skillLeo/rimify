<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\InvoiceExport;
use App\Payments\Stripe\StripeInvoices;
use App\Services\Admin\AdminAlerts;
use App\Services\Admin\AuditTrail;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Sleep;
use League\Flysystem\FileAttributes;
use RuntimeException;
use Stripe\Invoice;
use Throwable;

/**
 * `rimify:invoices:export-s3` — the daily copy of Stripe's invoices to the shop's own bucket (his admin item 17, part 2:
 * „a script that runs daily to download all of the invoices created each day and upload them to S3“; D-361). Scheduled
 * at 03:15 Europe/Berlin for the day before.
 *
 * Every invoice Stripe created that day, paged through to the last: its PDF to `invoices/YYYY/MM/DD/<number>.pdf` and
 * beside it a JSON file with its id, number, order number, amount, currency and date. Each file is read back and its
 * size checked. A run twice changes nothing: an invoice stored and still there at its size is left alone. One that
 * fails is tried three times, then recorded with its error, alerted to the admin (by mail unless switched off) and
 * shown on the System page; the next run tries it again.
 */
final class InvoicesExportS3Command extends Command
{
    public const DISK = 'invoices_s3';

    /** The last run, for the admin's System page: when, which days, how many stored, skipped and failed. */
    public const LAST_RUN = 'invoice-export:last-run';

    private const TRIES = 3;

    protected $signature = 'rimify:invoices:export-s3
        {--date= : One day (YYYY-MM-DD, Europe/Berlin); default yesterday}
        {--from= : First day of a backfill (YYYY-MM-DD)}
        {--to= : Last day of a backfill (YYYY-MM-DD), default --from}
        {--dry-run : Say what would be copied, write nothing}';

    protected $description = 'Copy the Stripe invoices created on a day (default: yesterday) to the S3 bucket, PDF and JSON, checked by size';

    public function handle(StripeInvoices $stripe, AdminAlerts $alerts): int
    {
        $days = $this->days();

        if ($days === null) {
            return self::INVALID;
        }

        $dry = (bool) $this->option('dry-run');

        if (! $dry && ! self::configured()) {
            $this->error('Für die Rechnungskopie ist kein S3-Speicher eingerichtet (INVOICE_S3_BUCKET, INVOICE_S3_KEY, INVOICE_S3_SECRET in der .env).');
            Cache::forever(self::LAST_RUN, ['at' => now()->toIso8601String(), 'days' => [], 'stored' => 0, 'skipped' => 0, 'failed' => 0, 'unconfigured' => true]);

            return self::FAILURE;
        }

        $counts = ['stored' => 0, 'skipped' => 0, 'failed' => 0];

        foreach ($days as $day) {
            $from = $day->startOfDay();

            foreach ($stripe->createdBetween($from->getTimestamp(), $from->addDay()->getTimestamp()) as $invoice) {
                $outcome = $this->copy($invoice, $dry, $alerts);
                $counts[$outcome]++;
            }
        }

        $this->info(sprintf('%s: %d abgelegt, %d schon da, %d fehlgeschlagen.', $dry ? 'Probelauf' : 'Fertig', $counts['stored'], $counts['skipped'], $counts['failed']));

        if (! $dry) {
            Cache::forever(self::LAST_RUN, ['at' => now()->toIso8601String(), 'days' => array_map(static fn (CarbonImmutable $d): string => $d->toDateString(), $days), ...$counts]);
        }

        return $counts['failed'] === 0 ? self::SUCCESS : self::FAILURE;
    }

    public static function configured(): bool
    {
        return filled(config('filesystems.disks.'.self::DISK.'.bucket'))
            && filled(config('filesystems.disks.'.self::DISK.'.key'))
            && filled(config('filesystems.disks.'.self::DISK.'.secret'));
    }

    /** @return 'stored'|'skipped'|'failed' */
    private function copy(Invoice $invoice, bool $dry, AdminAlerts $alerts): string
    {
        $date = CarbonImmutable::createFromTimestamp((int) $invoice->created, 'Europe/Berlin');
        $number = (string) ($invoice->number ?? $invoice->id);
        $base = 'invoices/'.$date->format('Y/m/d').'/'.preg_replace('/[^A-Za-z0-9._-]/', '_', $number);
        $known = InvoiceExport::query()->firstWhere('stripe_invoice_id', $invoice->id);

        if ($dry) {
            $this->line(($known?->status === InvoiceExport::STORED ? 'schon da   ' : 'würde ablegen ').$base.'.pdf');

            return $known?->status === InvoiceExport::STORED ? 'skipped' : 'stored';
        }

        $disk = Storage::disk(self::DISK);

        // Twice changes nothing: stored, and both files still there at their sizes.
        if ($known?->status === InvoiceExport::STORED && $known->pdf_bytes !== null && $known->json_bytes !== null
            && self::listedSize($disk, $base.'.pdf') === $known->pdf_bytes
            && self::listedSize($disk, $base.'.json') === $known->json_bytes) {
            return 'skipped';
        }

        $json = (string) json_encode([
            'id' => $invoice->id,
            'number' => $invoice->number,
            'order_number' => $invoice->metadata['order_number'] ?? null,
            'amount' => (int) $invoice->total,
            'currency' => strtoupper((string) $invoice->currency),
            'date' => $date->toIso8601String(),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $error = null;

        for ($try = 1; $try <= self::TRIES; $try++) {
            try {
                $pdf = $this->pdf($invoice);
                $this->put($disk, $base.'.pdf', $pdf);
                $this->put($disk, $base.'.json', $json);

                InvoiceExport::query()->updateOrCreate(['stripe_invoice_id' => $invoice->id], [
                    'number' => $invoice->number, 'order_number' => $invoice->metadata['order_number'] ?? null, 'invoice_date' => $date->toDateString(),
                    'pdf_path' => $base.'.pdf', 'pdf_bytes' => strlen($pdf), 'json_bytes' => strlen($json),
                    'status' => InvoiceExport::STORED, 'error' => null, 'attempts' => $try,
                ]);
                $this->line('abgelegt '.$base.'.pdf');

                return 'stored';
            } catch (Throwable $e) {
                $error = mb_substr($e->getMessage(), 0, 450);

                if ($try < self::TRIES) {
                    Sleep::for($try * 2)->seconds();
                }
            }
        }

        InvoiceExport::query()->updateOrCreate(['stripe_invoice_id' => $invoice->id], [
            'number' => $invoice->number, 'order_number' => $invoice->metadata['order_number'] ?? null, 'invoice_date' => $date->toDateString(),
            'status' => InvoiceExport::FAILED, 'error' => $error, 'attempts' => self::TRIES,
        ]);
        AuditTrail::system('System', 'invoice_export.failed', ['invoice' => $invoice->id, 'number' => $invoice->number, 'date' => $date->format('d.m.Y'), 'error' => $error]);
        $alerts->send('invoice_export_failed', 'Rechnung '.$number.' nicht nach S3 kopiert', $error, ['route' => 'admin.system.index', 'params' => []]);
        $this->error('fehlgeschlagen '.$base.'.pdf: '.$error);

        return 'failed';
    }

    /** The invoice's PDF as Stripe serves it, or an exception: never an empty or foreign file in its place. */
    private function pdf(Invoice $invoice): string
    {
        $url = (string) ($invoice->invoice_pdf ?? '');

        if ($url === '') {
            throw new RuntimeException("Stripe gives no PDF for {$invoice->id}.");
        }

        $body = Http::timeout(30)->get($url)->throw()->body();

        if (! str_starts_with($body, '%PDF-')) {
            throw new RuntimeException("What Stripe served for {$invoice->id} is no PDF.");
        }

        return $body;
    }

    /** Written, then checked by size: a file the bucket lists at another size, or not at all, counts as not written. */
    private function put(FilesystemAdapter $disk, string $path, string $bytes): void
    {
        $disk->put($path, $bytes);
        $listed = self::listedSize($disk, $path);

        if ($listed !== strlen($bytes)) {
            throw new RuntimeException("{$path}: the bucket lists ".($listed === null ? 'no file' : "{$listed} bytes").', '.strlen($bytes).' were written.');
        }
    }

    /**
     * A file's size as the bucket lists its folder — or null where it lists none. Read from the listing, never by asking
     * for the object itself: the IAM user may only write and list the bucket (STRIPE-RECHNUNGEN.md).
     */
    private static function listedSize(FilesystemAdapter $disk, string $path): ?int
    {
        foreach ($disk->getDriver()->listContents(dirname($path), false) as $item) {
            if ($item instanceof FileAttributes && $item->path() === $path) {
                return $item->fileSize();
            }
        }

        return null;
    }

    /** @return list<CarbonImmutable>|null the days asked for, in Europe/Berlin — or null, said why */
    private function days(): ?array
    {
        $read = static fn (mixed $value): ?CarbonImmutable => is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1
            ? CarbonImmutable::createFromFormat('!Y-m-d', $value, 'Europe/Berlin') ?: null
            : null;

        if ($this->option('from') !== null) {
            $from = $read($this->option('from'));
            $to = $this->option('to') === null ? $from : $read($this->option('to'));

            if ($from === null || $to === null || $to->lt($from) || $from->diffInDays($to) > 366) {
                $this->error('--from und --to bitte als Datum (JJJJ-MM-TT), --to nicht vor --from, höchstens ein Jahr.');

                return null;
            }

            $days = [];

            for ($day = $from; $day->lte($to); $day = $day->addDay()) {
                $days[] = $day;
            }

            return $days;
        }

        if ($this->option('date') !== null) {
            $day = $read($this->option('date'));

            if ($day === null) {
                $this->error('--date bitte als Datum (JJJJ-MM-TT).');

                return null;
            }

            return [$day];
        }

        return [CarbonImmutable::now('Europe/Berlin')->subDay()->startOfDay()];
    }
}
