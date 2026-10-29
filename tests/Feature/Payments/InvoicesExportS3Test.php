<?php

declare(strict_types=1);

use App\Console\Commands\InvoicesExportS3Command;
use App\Models\AuditLog;
use App\Models\InvoiceExport;
use App\Services\Admin\SystemHealth;
use Carbon\CarbonImmutable;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Sleep;
use Illuminate\Support\Str;
use Tests\Support\FakeStripe;

/*
 * His admin item 17, part 2 (D-361): `rimify:invoices:export-s3` copies the Stripe invoices created on a day — every
 * page of Stripe's list — to the shop's bucket, PDF and JSON, each read back by size; twice changes nothing; a failure is
 * tried three times, then recorded, audited and shown on the System page, and the next run tries it again. Against a fake
 * bucket, Stripe's API in memory and Stripe's PDFs served by a faked HTTP answer.
 */

const EXPORT_PDF = "%PDF-1.4\n% eine Rechnung von Stripe\n%%EOF\n";

beforeEach(function (): void {
    config([
        'services.stripe.mode' => 'test',
        'services.stripe.key' => 'pk_test_fakeKey',
        'services.stripe.secret' => 'sk_test_fakeKey',
        'services.stripe.webhook_secret' => 'whsec_test_secret',
        'filesystems.disks.invoices_s3.bucket' => 'rimify-rechnungen-test',
        'filesystems.disks.invoices_s3.key' => 'test-key',
        'filesystems.disks.invoices_s3.secret' => 'test-secret',
    ]);
    $this->stripe = FakeStripe::install();
    $this->bucket = Storage::fake(InvoicesExportS3Command::DISK);
    Sleep::fake();
    // One stub for Stripe's PDFs, read per test: what it serves, and which invoices' PDFs are down (504).
    $this->pdf = EXPORT_PDF;
    $this->down = [];
    Http::fake(['pay.stripe.com/*' => static fn (Request $request) => in_array(Str::between($request->url(), '/invoice/', '/pdf'), test()->down, true)
        ? Http::response('Gateway Timeout', 504)
        : Http::response(test()->pdf)]);
});

afterEach(fn () => FakeStripe::uninstall());

/** An invoice Stripe created at this Berlin time, numbered and paid. */
function exportInvoice(string $berlin, int $n, string $status = 'paid'): string
{
    $id = 'in_exp'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    test()->stripe->invoices[$id] = [
        'id' => $id, 'object' => 'invoice', 'customer' => 'cus_x', 'currency' => 'eur', 'status' => $status,
        'number' => $status === 'draft' ? null : 'A1B2C3D4-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT),
        'total' => 100_000 + $n, 'metadata' => ['order_number' => '2610-'.(10_000 + $n)],
        'created' => CarbonImmutable::parse($berlin, 'Europe/Berlin')->getTimestamp(),
        'invoice_pdf' => 'https://pay.stripe.com/invoice/'.$id.'/pdf', 'hosted_invoice_url' => 'https://invoice.stripe.com/i/'.$id,
    ];

    return $id;
}

it('copies every invoice of the day, PDF and JSON, by its number under the day — only that day\'s, never a draft @admin-217', function (): void {
    exportInvoice('2026-10-28 00:00:00', 1);
    exportInvoice('2026-10-28 23:59:59', 2);
    exportInvoice('2026-10-27 23:59:59', 3);
    exportInvoice('2026-10-29 00:00:00', 4);
    exportInvoice('2026-10-28 12:00:00', 5, 'draft');

    $this->artisan('rimify:invoices:export-s3', ['--date' => '2026-10-28'])
        ->expectsOutputToContain('Fertig: 2 abgelegt, 0 schon da, 0 fehlgeschlagen.')
        ->assertSuccessful();

    expect($this->bucket->allFiles())->toEqualCanonicalizing([
        'invoices/2026/10/28/A1B2C3D4-0001.pdf', 'invoices/2026/10/28/A1B2C3D4-0001.json',
        'invoices/2026/10/28/A1B2C3D4-0002.pdf', 'invoices/2026/10/28/A1B2C3D4-0002.json',
    ])
        ->and($this->bucket->get('invoices/2026/10/28/A1B2C3D4-0001.pdf'))->toBe(EXPORT_PDF)
        ->and(json_decode((string) $this->bucket->get('invoices/2026/10/28/A1B2C3D4-0002.json'), true))->toBe([
            'id' => 'in_exp0002', 'number' => 'A1B2C3D4-0002', 'order_number' => '2610-10002', 'amount' => 100_002, 'currency' => 'EUR',
            'date' => '2026-10-28T23:59:59+01:00',
        ])
        ->and(InvoiceExport::query()->where('status', InvoiceExport::STORED)->pluck('pdf_bytes')->unique()->all())->toBe([strlen(EXPORT_PDF)]);

    // Twice changes nothing: both stay as they are, and Stripe's PDFs are not fetched again.
    $this->artisan('rimify:invoices:export-s3', ['--date' => '2026-10-28'])->expectsOutputToContain('Fertig: 0 abgelegt, 2 schon da, 0 fehlgeschlagen.')->assertSuccessful();

    Http::assertSentCount(2);
});

it('pages through Stripe\'s whole list, and backfills days with --from and --to @admin-217', function (): void {
    foreach (range(1, 105) as $n) {
        exportInvoice('2026-10-26 10:00:00', $n);
    }

    exportInvoice('2026-10-27 09:30:00', 200);

    $this->artisan('rimify:invoices:export-s3', ['--from' => '2026-10-26', '--to' => '2026-10-27'])
        ->expectsOutputToContain('Fertig: 106 abgelegt')
        ->assertSuccessful();

    // Two pages for the 26th: Stripe lists at most 100 at a time.
    expect(count($this->stripe->to('GET', '/v1/invoices')))->toBe(3)
        ->and(InvoiceExport::query()->where('status', InvoiceExport::STORED)->count())->toBe(106)
        ->and($this->bucket->exists('invoices/2026/10/27/A1B2C3D4-0200.pdf'))->toBeTrue();
});

it('tries a failed copy three times, records, audits and shows it — and the next run stores it @admin-217', function (): void {
    exportInvoice('2026-10-28 10:00:00', 1);
    exportInvoice('2026-10-28 11:00:00', 2);
    $this->down = ['in_exp0002'];

    $this->artisan('rimify:invoices:export-s3', ['--date' => '2026-10-28'])
        ->expectsOutputToContain('Fertig: 1 abgelegt, 0 schon da, 1 fehlgeschlagen.')
        ->assertFailed();

    $failed = InvoiceExport::query()->firstWhere('stripe_invoice_id', 'in_exp0002');
    $health = collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'invoices');

    expect($failed?->status)->toBe(InvoiceExport::FAILED)
        ->and($failed?->attempts)->toBe(3)
        ->and($failed?->error)->toContain('504')
        ->and($this->bucket->exists('invoices/2026/10/28/A1B2C3D4-0002.pdf'))->toBeFalse()
        ->and(AuditLog::query()->where('description', 'invoice_export.failed')->count())->toBe(1)
        ->and($health)->toMatchArray(['state' => 'warn', 'sentence' => 'Eine Stripe-Rechnung wurde nicht nach S3 kopiert; die nächste Kopie versucht es wieder.']);

    $this->down = [];

    $this->artisan('rimify:invoices:export-s3', ['--date' => '2026-10-28'])->expectsOutputToContain('Fertig: 1 abgelegt, 1 schon da, 0 fehlgeschlagen.')->assertSuccessful();

    expect(InvoiceExport::query()->where('status', InvoiceExport::FAILED)->count())->toBe(0)
        ->and(collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'invoices')['state'])->toBe('ok');
});

it('refuses what Stripe serves that is no PDF, and writes nothing on a dry run', function (): void {
    exportInvoice('2026-10-28 10:00:00', 1);

    $this->artisan('rimify:invoices:export-s3', ['--date' => '2026-10-28', '--dry-run' => true])
        ->expectsOutputToContain('würde ablegen invoices/2026/10/28/A1B2C3D4-0001.pdf')
        ->assertSuccessful();

    expect($this->bucket->allFiles())->toBe([])->and(InvoiceExport::query()->count())->toBe(0);

    $this->pdf = '<html>Anmelden</html>';

    $this->artisan('rimify:invoices:export-s3', ['--date' => '2026-10-28'])->assertFailed();

    expect($this->bucket->allFiles())->toBe([])
        ->and(InvoiceExport::query()->sole()->error)->toContain('is no PDF');
});

it('says what is missing where no bucket is set up, and refuses days it cannot read', function (): void {
    config(['filesystems.disks.invoices_s3.bucket' => null]);

    $this->artisan('rimify:invoices:export-s3')
        ->expectsOutputToContain('kein S3-Speicher eingerichtet')
        ->assertFailed();

    expect(collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'invoices')['sentence'])
        ->toBe('Für die tägliche Kopie der Stripe-Rechnungen ist noch kein S3-Speicher eingerichtet.');

    $this->artisan('rimify:invoices:export-s3', ['--date' => '28.10.2026'])->assertExitCode(2);
    $this->artisan('rimify:invoices:export-s3', ['--from' => '2026-10-28', '--to' => '2026-10-27'])->assertExitCode(2);
});

it('is scheduled daily at 03:15 Berlin time', function (): void {
    $event = collect(app(Schedule::class)->events())
        ->first(static fn ($e): bool => str_contains((string) $e->command, 'rimify:invoices:export-s3'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('15 3 * * *')
        ->and($event->timezone)->toBe('Europe/Berlin');
});
