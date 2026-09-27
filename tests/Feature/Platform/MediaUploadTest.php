<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Services\Admin\SystemHealth;
use App\Services\Storage\ImageUpload;
use App\Services\Storage\PdfUpload;
use App\Services\Storage\StorageProbe;
use App\Services\Storage\StorageSettings;
use App\Services\Storage\UploadRejected;
use App\Services\Storage\VirusScanner;
use Database\Seeders\AccessSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeBucket;

/*
 * Uploads onto the media disks. An image through the app: type from its bytes, limits before it is
 * opened, the scanner hook, EXIF and GPS gone. A large PDF straight into the bucket by a signed form,
 * landing private under invoices/pending/ until it is confirmed — only then moved into place.
 * And what happens when the bucket does not answer: a sentence, and the health line turns amber.
 */

/** A JPEG carrying an EXIF block with a GPS position — what a phone photo brings along. */
function uploadJpegWithGps(): string
{
    $image = imagecreatetruecolor(64, 48);
    imagefill($image, 0, 0, (int) imagecolorallocate($image, 90, 110, 130));
    ob_start();
    imagejpeg($image);
    $jpeg = (string) ob_get_clean();

    // TIFF, little-endian: IFD0 holds one entry pointing at the GPS IFD, which holds GPSLatitudeRef "N".
    $tiff = "II*\0".pack('V', 8)
        .pack('v', 1).pack('vvVV', 0x8825, 4, 1, 26).pack('V', 0)
        .pack('v', 1).pack('vvV', 0x0001, 2, 2)."N\0\0\0".pack('V', 0);
    $app1 = "\xFF\xE1".pack('n', 2 + 6 + strlen($tiff))."Exif\0\0".$tiff;

    $path = tempnam(sys_get_temp_dir(), 'rimify-gps-').'.jpg';
    file_put_contents($path, substr($jpeg, 0, 2).$app1.substr($jpeg, 2));

    return $path;
}

function uploadPng(int $width, int $height): string
{
    $image = imagecreatetruecolor($width, $height);
    $path = tempnam(sys_get_temp_dir(), 'rimify-png-').'.png';
    imagepng($image, $path);

    return $path;
}

function uploadBucket(): FakeBucket
{
    config(['media.s3' => ['key' => 'FAKEKEYFORTESTS0AB12', 'secret' => 'fake/secret/for/tests/only/0000X9Y8', 'region' => 'eu-north-1', 'bucket' => 'rimify-media-test', 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    $bucket = FakeBucket::install();
    app(StorageSettings::class)->flush();

    return $bucket;
}

beforeEach(function (): void {
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
});

describe('an image through the app', function (): void {
    it('stores it anew: upright, same type, no EXIF and no GPS — and sends no ACL', function (): void {
        $bucket = uploadBucket();
        $source = uploadJpegWithGps();

        expect(@exif_read_data($source)['GPSLatitudeRef'] ?? null)->toBe('N');

        $stored = app(ImageUpload::class)->store(new UploadedFile($source, 'IMG_2041.jpg', 'image/jpeg', null, true), 'media_products', 'felgen/mcr4');
        $object = $bucket->objects['product-images/'.$stored['path']];
        $copy = tempnam(sys_get_temp_dir(), 'rimify-out-').'.jpg';
        file_put_contents($copy, $object);

        expect($stored['path'])->toMatch('#^felgen/mcr4/[0-9a-z]{26}\.jpg$#')
            ->and($stored)->toMatchArray(['disk' => 'media_products', 'mime' => 'image/jpeg', 'width' => 64, 'height' => 48])
            ->and(@exif_read_data($copy) ?: [])->not->toHaveKey('GPSLatitudeRef')
            ->and(str_contains($object, 'Exif'))->toBeFalse()
            ->and($bucket->sent[0]['params'])->not->toHaveKey('ACL')
            ->and($bucket->sent[0]['params']['ContentType'])->toBe('image/jpeg');

        @unlink($source);
        @unlink($copy);
    });

    it('reads the type from the bytes, not from the name', function (): void {
        $path = tempnam(sys_get_temp_dir(), 'rimify-txt-');
        file_put_contents($path, 'kein Bild, nur Text');

        expect(fn () => app(ImageUpload::class)->store(new UploadedFile($path, 'felge.jpg', 'image/jpeg', null, true), 'media_products', 'felgen'))
            ->toThrow(UploadRejected::class, 'Das ist kein Bild in einem Format, das wir annehmen. Erlaubt sind JPEG, PNG, WebP und AVIF.');
    });

    it('refuses an image over 10 MB, and one wider than 8000 pixels, before opening it', function (): void {
        $big = UploadedFile::fake()->create('riesig.jpg', 11 * 1024, 'image/jpeg');
        $wide = uploadPng(8001, 1);

        expect(fn () => app(ImageUpload::class)->store($big, 'media_products', 'felgen'))->toThrow(UploadRejected::class, 'Das Bild ist größer als 10 MB.')
            ->and(fn () => app(ImageUpload::class)->store(new UploadedFile($wide, 'breit.png', 'image/png', null, true), 'media_products', 'felgen'))->toThrow(UploadRejected::class, 'höchstens 8000 Pixel je Seite');
    });

    it('passes every image through the scanner hook', function (): void {
        app()->instance(VirusScanner::class, new class implements VirusScanner
        {
            public function scan(string $path): ?string
            {
                return 'Test-Signatur gefunden';
            }

            public function active(): bool
            {
                return true;
            }
        });

        expect(fn () => app(ImageUpload::class)->store(new UploadedFile(uploadPng(20, 20), 'a.png', 'image/png', null, true), 'media_site', 'seiten'))
            ->toThrow(UploadRejected::class, 'Der Virenscanner hat die Datei abgelehnt.');
    });
});

describe('when the bucket does not answer', function (): void {
    it('says so in a sentence, and the health line turns amber at once', function (): void {
        $this->seed(AccessSeeder::class);
        uploadBucket()->failWith('RequestTimeout');

        try {
            app(ImageUpload::class)->store(new UploadedFile(uploadPng(20, 20), 'a.png', 'image/png', null, true), 'media_products', 'felgen');
            $this->fail('The upload should have been refused.');
        } catch (UploadRejected $e) {
            expect($e->storageDown)->toBeTrue()
                ->and($e->getMessage())->toBe('Der Speicher ist gerade nicht erreichbar. Deine Datei ist nicht gespeichert – versuch es bitte in ein paar Minuten noch einmal.');
        }

        $storage = collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'storage');

        expect(app(StorageProbe::class)->status()['reachable'] ?? null)->toBeFalse()
            ->and($storage)->toMatchArray(['state' => 'warn', 'sentence' => 'Speicher nicht erreichbar']);
    });

    it('asks the bucket itself when nothing failed yet, and stays green when it answers', function (): void {
        $bucket = uploadBucket();

        $storage = collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'storage');

        expect($storage['state'])->toBe('ok')
            ->and($bucket->names())->toBe(['PutObject'])
            ->and($bucket->sent[0]['params']['Key'])->toBe('invoices/.healthcheck');
    });
});

describe('a large PDF straight into the bucket', function (): void {
    it('hands the Gutachten editors a signed form for one private key, PDF only, within the limit', function (): void {
        $this->seed(AccessSeeder::class);
        uploadBucket();
        $editor = AdminUser::query()->where('email', 'compliance-editor@rimify.test')->firstOrFail();

        $form = $this->actingAs($editor, 'admin')->postJson('/admin/uploads/pdf')->assertOk()->json();
        $policy = json_decode((string) base64_decode((string) $form['fields']['Policy'], true), true);

        expect($form['url'])->toBe('https://rimify-media-test.s3.eu-north-1.amazonaws.com')
            ->and($form['key'])->toMatch('#^pending/[0-9a-z]{26}\.pdf$#')
            ->and($form['fields']['key'])->toBe('invoices/'.$form['key'])
            ->and($form['fields']['Content-Type'])->toBe('application/pdf')
            ->and(array_change_key_case($form['fields']))->not->toHaveKey('acl')
            ->and($form['fields'])->toHaveKey('X-Amz-Signature')
            ->and($policy['conditions'])->toContain(['content-length-range', 1, 200 * 1024 * 1024])
            ->and($policy['conditions'])->toContain(['eq', '$key', 'invoices/'.$form['key']]);
    });

    it('refuses the form to anyone who may not edit the Gutachten', function (): void {
        $this->seed(AccessSeeder::class);
        $editor = AdminUser::query()->where('email', 'content-editor@rimify.test')->firstOrFail();

        $this->actingAs($editor, 'admin')->postJson('/admin/uploads/pdf')->assertForbidden();
    });

    it('moves a checked upload into place and leaves nothing in pending/', function (): void {
        $bucket = uploadBucket();
        $bucket->objects['invoices/pending/01jabcdefghjkmnpqrstvwxyz0.pdf'] = "%PDF-1.7\n…";

        $done = app(PdfUpload::class)->confirm('pending/01jabcdefghjkmnpqrstvwxyz0.pdf', 'docs_public', 'gutachten');

        expect($done)->toBe(['disk' => 'docs_public', 'path' => 'gutachten/01jabcdefghjkmnpqrstvwxyz0.pdf', 'bytes' => strlen("%PDF-1.7\n…")])
            ->and(array_keys($bucket->objects))->toBe(['ABEs/gutachten/01jabcdefghjkmnpqrstvwxyz0.pdf'])
            ->and($bucket->names())->not->toContain('PutObjectAcl');
    });

    it('refuses what is not a PDF, what never arrived and a key it did not hand out', function (): void {
        $bucket = uploadBucket();
        $bucket->objects['invoices/pending/01jabcdefghjkmnpqrstvwxyz1.pdf'] = 'MZ… kein PDF';

        expect(fn () => app(PdfUpload::class)->confirm('pending/01jabcdefghjkmnpqrstvwxyz1.pdf', 'docs_public', 'gutachten'))
            ->toThrow(UploadRejected::class, 'Das ist keine PDF-Datei.')
            ->and($bucket->objects)->toBe([])
            ->and(fn () => app(PdfUpload::class)->confirm('pending/01jabcdefghjkmnpqrstvwxyz2.pdf', 'docs_public', 'gutachten'))
            ->toThrow(UploadRejected::class, 'Die Datei ist nicht vollständig angekommen.')
            ->and(fn () => app(PdfUpload::class)->confirm('../ABEs/fremd.pdf', 'docs_public', 'gutachten'))
            ->toThrow(UploadRejected::class, 'Diese Datei kennen wir nicht.');
    });

    it('works the same without a bucket: a signed address of the app stands in for it', function (): void {
        $this->seed(AccessSeeder::class);
        $editor = AdminUser::query()->where('email', 'compliance-editor@rimify.test')->firstOrFail();
        $form = $this->actingAs($editor, 'admin')->postJson('/admin/uploads/pdf')->assertOk()->json();
        $pdf = UploadedFile::fake()->createWithContent('gutachten.pdf', "%PDF-1.4\nTestinhalt");

        $this->actingAs($editor, 'admin')->post($form['url'], ['file' => $pdf])->assertNoContent();
        $done = app(PdfUpload::class)->confirm($form['key'], 'docs_public', 'gutachten');

        expect(Storage::disk('docs_public')->get($done['path']))->toBe("%PDF-1.4\nTestinhalt")
            ->and(Storage::disk('docs_private')->exists($form['key']))->toBeFalse();

        Storage::disk('docs_public')->delete($done['path']);

        // The address is signed: tampered with, it is refused.
        $this->actingAs($editor, 'admin')->post($form['url'].'x', ['file' => $pdf])->assertForbidden();
    });
});
