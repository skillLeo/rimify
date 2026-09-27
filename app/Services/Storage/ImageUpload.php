<?php

declare(strict_types=1);

namespace App\Services\Storage;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\AvifEncoder;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\PngEncoder;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;
use Throwable;

/**
 * An image uploaded through the app (under 10 MB; config/media.php `upload`), made safe to store:
 *
 *   - its type is read from its bytes, never from its name or what the browser claimed;
 *   - its size, sides and pixel count are checked before it is decoded, so a small file that would
 *     unpack into gigabytes is refused unopened;
 *   - it passes the VirusScanner hook;
 *   - it is decoded, turned upright and encoded anew — which drops every EXIF field, GPS position
 *     included: GD writes none. What is stored is never the file as it was sent.
 *
 * Stored under a new ULID name, so its address never changes meaning and a CDN may keep it for good.
 *
 * @phpstan-type Stored array{disk: string, path: string, mime: string, width: int, height: int, bytes: int}
 */
final class ImageUpload
{
    /** @var array<string, string> sniffed type => extension */
    public const TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/avif' => 'avif'];

    public function __construct(private readonly VirusScanner $scanner, private readonly StorageProbe $probe) {}

    /**
     * @return Stored
     *
     * @throws UploadRejected with the sentence to show
     */
    public function store(UploadedFile $file, string $disk, string $directory): array
    {
        $path = (string) $file->getRealPath();
        $limits = (array) config('media.upload');
        $maxBytes = (int) $limits['image_max_kb'] * 1024;

        if ($path === '' || ! is_file($path)) {
            throw new UploadRejected('Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.');
        }

        if ((int) $file->getSize() > $maxBytes) {
            throw new UploadRejected('Das Bild ist größer als 10 MB. Verkleinere es bitte und lad es noch einmal hoch.');
        }

        $mime = (string) (new \finfo(FILEINFO_MIME_TYPE))->file($path);

        if (! isset(self::TYPES[$mime])) {
            throw new UploadRejected('Das ist kein Bild in einem Format, das wir annehmen. Erlaubt sind JPEG, PNG, WebP und AVIF.');
        }

        $size = @getimagesize($path);
        $maxSide = (int) $limits['image_max_px'];
        $maxPixels = (int) $limits['image_max_megapixels'] * 1_000_000;

        if ($size === false || $size[0] < 1 || $size[1] < 1) {
            throw new UploadRejected('Das Bild lässt sich nicht öffnen. Speichere es bitte neu und lad es noch einmal hoch.');
        }

        if ($size[0] > $maxSide || $size[1] > $maxSide || $maxPixels < $size[0] * $size[1]) {
            throw new UploadRejected("Das Bild ist zu groß: höchstens {$maxSide} Pixel je Seite. Verkleinere es bitte.");
        }

        $found = $this->scanner->scan($path);

        if ($found !== null) {
            throw new UploadRejected('Der Virenscanner hat die Datei abgelehnt. Sie wird nicht gespeichert.');
        }

        try {
            $image = ImageManager::usingDriver(Driver::class, autoOrientation: true, decodeAnimation: false, strip: true)->decodePath($path);
            $encoded = (string) $image->encode(match ($mime) {
                'image/jpeg' => new JpegEncoder(quality: 88, progressive: true, strip: true),
                'image/png' => new PngEncoder,
                'image/webp' => new WebpEncoder(quality: 88, strip: true),
                default => new AvifEncoder(quality: 70, strip: true),
            });
        } catch (Throwable) {
            throw new UploadRejected('Das Bild lässt sich nicht öffnen. Speichere es bitte neu und lad es noch einmal hoch.');
        }

        $key = trim($directory, '/').'/'.Str::lower((string) Str::ulid()).'.'.self::TYPES[$mime];

        try {
            Storage::disk($disk)->put($key, $encoded, ['ContentType' => $mime, 'CacheControl' => 'public, max-age=31536000, immutable']);
        } catch (Throwable $e) {
            $this->probe->markDown($e);

            throw UploadRejected::storageDown();
        }

        return ['disk' => $disk, 'path' => $key, 'mime' => $mime, 'width' => $image->width(), 'height' => $image->height(), 'bytes' => strlen($encoded)];
    }
}
