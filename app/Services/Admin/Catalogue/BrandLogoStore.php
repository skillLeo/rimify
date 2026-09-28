<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Models\Brand;
use App\Services\Storage\VirusScanner;
use App\Support\BrandLogos;
use App\Support\Security\SvgSanitizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * A brand's logo, uploaded in Katalog › Marken. The brand wall draws a logo as a mask filled with the
 * shop's own ink (BrandLogos), so a logo must be a shape on a transparent ground: an SVG, or a PNG or WebP
 * with an alpha channel. The type is read from the bytes, never from the file's name; an SVG is reduced
 * to drawing (SvgSanitizer) before it is written; a raster without transparency is refused, because it
 * would paint a solid block. The file goes to the `public` disk under `brands/` — the upload path
 * BrandLogos has always read — and is only kept when BrandLogos can size it.
 */
final class BrandLogoStore
{
    public const MAX_BYTES = 1_048_576;

    public const DIR = 'brands';

    public const NOT_A_LOGO = 'Das ist kein Logo, das der Shop zeichnen kann. Bitte eine SVG-Datei oder ein PNG oder WebP mit transparentem Hintergrund hochladen.';

    public const OPAQUE = 'Das Bild hat keinen transparenten Hintergrund. Die Markenwand zeichnet nur die Form des Logos – bitte ein PNG oder WebP mit Transparenz oder eine SVG-Datei hochladen.';

    public const TOO_LARGE = 'Das Logo ist größer als 1 MB. Bitte eine kleinere Datei hochladen.';

    public const INFECTED = 'Der Virenscanner hat die Datei abgelehnt. Sie wird nicht gespeichert.';

    public function __construct(private readonly VirusScanner $scanner) {}

    /**
     * Stores the logo and returns its `logo_path`, or a German sentence saying why not (nothing is
     * stored then).
     *
     * @return array{path: string|null, refusal: string|null}
     */
    public function store(Brand $brand, UploadedFile $file): array
    {
        $bytes = (string) file_get_contents($file->getRealPath() ?: '');

        if ($bytes === '' || strlen($bytes) > self::MAX_BYTES) {
            return self::refused($bytes === '' ? self::NOT_A_LOGO : self::TOO_LARGE);
        }

        if ($this->scanner->scan((string) $file->getRealPath()) !== null) {
            return self::refused(self::INFECTED);
        }

        $format = self::format($bytes);

        if ($format === null) {
            return self::refused(self::NOT_A_LOGO);
        }

        if ($format === 'svg') {
            $bytes = (string) SvgSanitizer::clean($bytes);

            if ($bytes === '') {
                return self::refused(self::NOT_A_LOGO);
            }
        }

        $path = self::DIR.'/'.Str::slug($brand->name ?: 'marke').'-'.substr(sha1($bytes), 0, 12).'.'.$format;
        $disk = Storage::disk('public');
        $disk->put($path, $bytes);

        // Only a logo the brand wall can size is kept: a raster without alpha, or a shape without a
        // measurable box, is removed again and said.
        if (BrandLogos::aspectOf($disk->path($path)) === null) {
            $disk->delete($path);

            return self::refused($format === 'svg' ? self::NOT_A_LOGO : self::OPAQUE);
        }

        return ['path' => $path, 'refusal' => null];
    }

    /** Removes an uploaded logo's file. A bundled logo (`/images/brands/…`) belongs to the build and stays. */
    public function forget(?string $path): void
    {
        if ($path === null || $path === '' || str_starts_with($path, BrandLogos::BUNDLED_PREFIX) || str_contains($path, '..')) {
            return;
        }

        if (str_starts_with(ltrim($path, '/'), self::DIR.'/')) {
            Storage::disk('public')->delete(ltrim($path, '/'));
        }
    }

    /** The file's type from its first bytes: svg, png or webp — or null. */
    private static function format(string $bytes): ?string
    {
        return match (true) {
            str_starts_with($bytes, "\x89PNG\r\n\x1a\n") => 'png',
            substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP' => 'webp',
            // A drawing program's prolog: an XML declaration, comments, a DOCTYPE line — then the root.
            preg_match('/^\s*(<\?xml[^>]*>\s*)?((<!--.*?-->|<!DOCTYPE[^>\[]*>)\s*)*<svg\b/is', $bytes) === 1 => 'svg',
            default => null,
        };
    }

    /** @return array{path: null, refusal: string} */
    private static function refused(string $why): array
    {
        return ['path' => null, 'refusal' => $why];
    }
}
