<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use App\Services\Storage\DocumentFiles;
use App\Services\Storage\StorageSettings;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeBucket;

/*
 * EIGENE-FUNDE 105's cause (ADMIN-GEFUNDEN 501, D-229): switching the shop from the server's disk to the bucket moves no
 * file, and a link built for wherever storage points *now* answered 403 for both of the client's Gutachten. The file is
 * found where it is, a file found nowhere is said to be missing, rimify:pdf-migrate brings it over, and the go-live check
 * fails on any released document whose PDF does not open.
 */

const PDF_BYTES = "%PDF-1.4\n% the client's Teilegutachten, in five bytes and a comment\n";

beforeEach(function (): void {
    config(['app.url' => 'https://rimify.test']);
    Cache::flush();
});

function releasedWithPdf(string $key): ApprovalDocument
{
    Storage::disk(GutachtenController::DISK)->put($key, PDF_BYTES);

    return ApprovalDocument::factory()->create(['pdf_key' => $key, 'pdf_sha256' => hash('sha256', PDF_BYTES), 'valid_from' => null, 'valid_to' => null]);
}

/** The bucket in force from here on — as Einstellungen › Medien und Speicher does it after the client's switch. */
function switchToBucket(): FakeBucket
{
    config(['media.s3' => ['key' => 'FAKEKEYFORTESTS0AB12', 'secret' => 'fake/secret/for/tests/only/0000X9Y8', 'region' => 'eu-north-1', 'bucket' => 'rimify-media-test', 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    $bucket = FakeBucket::install();
    app(StorageSettings::class)->flush();

    return $bucket;
}

it('still opens a released Gutachten after the storage moved to the bucket, from where the file is', function (): void {
    $document = releasedWithPdf('gutachten/01-teilegutachten-1810080716.pdf');
    $files = app(DocumentFiles::class);

    expect($files->locate('gutachten/01-teilegutachten-1810080716.pdf'))->toBe(['state' => DocumentFiles::FOUND, 'url' => 'https://rimify.test/storage/ABEs/gutachten/01-teilegutachten-1810080716.pdf']);

    $bucket = switchToBucket();

    // The bucket does not hold it: the link is the server's, never the bucket's address that would answer 403.
    expect($files->locate('gutachten/01-teilegutachten-1810080716.pdf'))->toBe(['state' => DocumentFiles::ELSEWHERE, 'url' => 'https://rimify.test/storage/ABEs/gutachten/01-teilegutachten-1810080716.pdf']);

    expect(Artisan::call('rimify:pdf-migrate'))->toBe(0)
        ->and(Artisan::output())->toContain('kopiert und gegen den SHA-256 geprüft')
        ->and($bucket->objects['ABEs/gutachten/01-teilegutachten-1810080716.pdf'] ?? null)->toBe(PDF_BYTES)
        // The original stays on the server: nothing of the client's is deleted.
        ->and(Storage::build(['driver' => 'local', 'root' => storage_path('app/public/ABEs')])->exists('gutachten/01-teilegutachten-1810080716.pdf'))->toBeTrue();

    $found = $files->locate('gutachten/01-teilegutachten-1810080716.pdf');

    expect($found['state'])->toBe(DocumentFiles::FOUND)
        ->and($found['url'])->toStartWith('https://rimify-media-test.s3.eu-north-1.amazonaws.com/ABEs/gutachten/01-teilegutachten-1810080716.pdf')
        ->and($document->refresh()->pdf_key)->toBe('gutachten/01-teilegutachten-1810080716.pdf');

    Storage::build(['driver' => 'local', 'root' => storage_path('app/public/ABEs')])->delete('gutachten/01-teilegutachten-1810080716.pdf');
});

it('says a file found nowhere is missing — in the migration report and in the go-live check, never as a link', function (): void {
    ApprovalDocument::factory()->create(['kind' => 'ABE', 'kba_number' => '53841', 'pdf_key' => 'gutachten/verloren.pdf', 'valid_from' => null, 'valid_to' => null]);

    expect(app(DocumentFiles::class)->locate('gutachten/verloren.pdf'))->toBe(['state' => DocumentFiles::MISSING, 'url' => null])
        ->and(Artisan::call('rimify:pdf-migrate', ['--nur-pruefen' => true]))->toBe(1)
        ->and(Artisan::output())->toContain('FEHLT – in keinem Speicher gefunden');

    $check = collect(app(GoLiveChecks::class)->all(network: false))->firstWhere('id', 'gutachten-pdf');

    expect($check?->state)->toBe(GoLiveCheck::MISSING)
        ->and($check?->sentence)->toStartWith('ABE 53841: das PDF liegt in keinem Speicher.');
});
