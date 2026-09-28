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

    public const BACKDROP = 'Das Logo hat eine gefüllte Hintergrundfläche. Die Markenwand zeichnet jede Fläche in der Schriftfarbe – bitte das Logo ohne Hintergrund exportieren.';

    public const ENTITIES = 'Die SVG-Datei enthält eine DOCTYPE-Angabe mit Entitäten, die der Shop aus Sicherheitsgründen nicht liest. Bitte ohne DOCTYPE exportieren (in Illustrator: „SVG-Code …“, dann speichern).';

    public const SAMPLE_RANGE = 'Die Beispielmarke zeigt nie ein Logo. Lade es bei der echten Marke hoch.';

    public const TOO_MANY_PIXELS = 'Das Logo ist zu groß: höchstens 4.000 × 4.000 Bildpunkte. Bitte kleiner exportieren.';

    /** The largest side a logo may have: past it a file is not decoded at all (K2-41). */
    private const MAX_SIDE_PX = 4000;

    /** How much of a raster must be see-through for a mark to stand on the wall's ground. */
    private const MIN_CLEAR = 0.05;

    /** A card: its opaque area fills this much of its own box … */
    private const CARD_FILL = 0.9;

    /** … in one colour this much of the time. */
    private const CARD_DOMINANT = 0.6;

    /** GD's alpha runs 0 (opaque) … 127 (clear); from here on a pixel counts as see-through. */
    private const CLEAR_ALPHA = 100;

    public function __construct(private readonly VirusScanner $scanner) {}

    /**
     * Stores the logo and returns its `logo_path`, or a German sentence saying why not (nothing is
     * stored then).
     *
     * @return array{path: string|null, refusal: string|null}
     */
    public function store(Brand $brand, UploadedFile $file): array
    {
        // The sample range never shows a logo (BrandLogos::resolve): one stored for it would be praised
        // and then reported missing (K2-25).
        if ($brand->slug === BrandLogos::SAMPLE_RANGE) {
            return self::refused(self::SAMPLE_RANGE);
        }

        $bytes = (string) file_get_contents($file->getRealPath() ?: '');

        if ($bytes === '' || strlen($bytes) > self::MAX_BYTES) {
            return self::refused($bytes === '' ? self::NOT_A_LOGO : self::TOO_LARGE);
        }

        if ($this->scanner->scan((string) $file->getRealPath()) !== null) {
            return self::refused(self::INFECTED);
        }

        // A byte-order mark in front of an SVG is an editor's habit, not a different file (K2-14).
        if (str_starts_with($bytes, "\xEF\xBB\xBF")) {
            $bytes = substr($bytes, 3);
        }

        $format = self::format($bytes);

        if ($format === null) {
            return self::refused(SvgSanitizer::declaresEntities($bytes) ? self::ENTITIES : self::NOT_A_LOGO);
        }

        if ($format === 'svg') {
            if (SvgSanitizer::declaresEntities($bytes)) {
                return self::refused(self::ENTITIES);
            }

            $bytes = (string) SvgSanitizer::clean($bytes);

            if ($bytes === '') {
                return self::refused(self::NOT_A_LOGO);
            }

            if (SvgSanitizer::hasBackdrop($bytes)) {
                return self::refused(self::BACKDROP);
            }
        } else {
            $refusal = self::rasterRefusal($bytes);

            if ($refusal !== null) {
                return self::refused($refusal);
            }
        }

        // The brand's id in the name: two brands (a renamed one and a new one of its old name) never share
        // a file, so removing one's logo never takes the other's (K2-26).
        $path = self::DIR.'/'.Str::slug($brand->name ?: 'marke').'-'.$brand->id.'-'.substr(sha1($bytes), 0, 12).'.'.$format;
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

    /**
     * Why a PNG or WebP cannot stand on the brand wall, or null when it can. The wall paints every opaque
     * pixel as ink, so what matters is the picture, not the header's alpha flag (K2-02, K2-36):
     *
     *   - its sides are read before anything is decoded — a small file of huge sides would take the
     *     server's memory (K2-41);
     *   - some of it must be see-through, or the logo is a solid block;
     *   - it must not be a card: an opaque area that fills its own box in one dominant colour (a logo on a
     *     white sticker with a clear margin) is a slab on the wall. A text logo or a round badge leaves
     *     room in its box, and passes.
     */
    private static function rasterRefusal(string $bytes): ?string
    {
        $size = @getimagesizefromstring($bytes);

        if ($size === false) {
            return self::NOT_A_LOGO;
        }

        [$width, $height] = [(int) $size[0], (int) $size[1]];

        if ($width < 1 || $height < 1) {
            return self::NOT_A_LOGO;
        }

        if ($width > self::MAX_SIDE_PX || $height > self::MAX_SIDE_PX) {
            return self::TOO_MANY_PIXELS;
        }

        $image = @imagecreatefromstring($bytes);

        if ($image === false) {
            // This server cannot decode it — not the same as an opaque file.
            return self::NOT_A_LOGO;
        }

        // A grid of at most ~40 000 samples, however large the picture.
        $step = max(1, (int) ceil(sqrt($width * $height / 40_000)));
        $clear = 0;
        $opaque = [];

        for ($y = 0; $y < $height; $y += $step) {
            for ($x = 0; $x < $width; $x += $step) {
                $rgba = imagecolorsforindex($image, imagecolorat($image, $x, $y));

                if ($rgba['alpha'] >= self::CLEAR_ALPHA) {
                    $clear++;
                } else {
                    // The colour to 3 bits a channel: a card's white or grey is one bin, anti-aliasing is not.
                    $opaque[] = [$x, $y, ($rgba['red'] >> 5) << 6 | ($rgba['green'] >> 5) << 3 | ($rgba['blue'] >> 5)];
                }
            }
        }

        imagedestroy($image);
        $samples = $clear + count($opaque);

        if ($samples === 0 || $clear / $samples < self::MIN_CLEAR || $opaque === []) {
            return $opaque === [] ? self::NOT_A_LOGO : self::OPAQUE;
        }

        $xs = array_column($opaque, 0);
        $ys = array_column($opaque, 1);
        $box = ((intdiv(max($xs) - min($xs), $step) + 1) * (intdiv(max($ys) - min($ys), $step) + 1));
        $fill = count($opaque) / max(1, $box);
        $bins = array_count_values(array_column($opaque, 2));
        $dominant = max($bins) / count($opaque);

        return $fill >= self::CARD_FILL && $dominant >= self::CARD_DOMINANT ? self::BACKDROP : null;
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
