<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Support\GermanFormat;
use Illuminate\Support\Facades\File;

/**
 * The demo catalogue's pictures (the review release §2): honest placeholders, never a photograph.
 *
 * One drawing per finish, generated when the catalogue is seeded: the brand's colour as the ground,
 * a wheel silhouette in the finish's colour with the model's own spoke count, the model and its size
 * range printed on it, and the words „Platzhalterbild · kein Produktfoto“. It reads as a placeholder at a
 * glance — which is the point: nobody may take it for a product photograph (§5 UWG). Nothing is
 * scraped, nothing is downloaded, and the drawing is the same on every run.
 *
 * Written as SVG — one file per frame, the square and the 4:3 — in the manifest shape the Picture
 * component reads (`fallback: svg`, no other formats).
 */
final class DemoPlaceholders
{
    public const SQUARE = 1080;

    public const WIDE_HEIGHT = 810;

    private const FONT = 'Archivo, Arial, Helvetica, sans-serif';

    /** The directory the drawings are written to, absolute. */
    public static function dir(): string
    {
        $path = (string) config('rimify.demo.placeholders_dir', 'storage/app/public/demo/placeholders');

        return preg_match('~^([a-zA-Z]:[\\\\/]|/)~', $path) === 1 ? $path : base_path($path);
    }

    /** The URL every placeholder manifest's `base` starts with. */
    public static function publicBase(): string
    {
        return rtrim((string) config('rimify.demo.placeholders_base', '/storage/demo/placeholders'), '/');
    }

    /**
     * Draw one finish and return its manifest.
     *
     * @param  list<float>  $diameters  the model's rim diameters, in inches
     * @return array<string, mixed>
     */
    public function draw(string $slug, string $brand, string $model, string $brandHex, string $finishHex, int $spokes, array $diameters): array
    {
        File::ensureDirectoryExists(self::dir());

        $label = $model.' · '.self::sizes($diameters);
        $square = $slug.'-'.self::SQUARE.'.svg';
        $wide = $slug.'-4x3-'.self::SQUARE.'.svg';

        File::put(self::dir().DIRECTORY_SEPARATOR.$square, self::svg(self::SQUARE, self::SQUARE, 540, 510, 330, $brand, $label, $brandHex, $finishHex, $spokes));
        File::put(self::dir().DIRECTORY_SEPARATOR.$wide, self::svg(self::SQUARE, self::WIDE_HEIGHT, 540, 380, 250, $brand, $label, $brandHex, $finishHex, $spokes));

        $frame = static fn (string $name, int $height): array => [
            'name' => $name,
            'base' => self::publicBase().'/'.$name,
            'width' => self::SQUARE,
            'height' => $height,
            'widths' => [self::SQUARE],
            'fallback' => 'svg',
            'formats' => [],
            // The ground, until the drawing has painted.
            'placeholder' => 'data:image/svg+xml,'.rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="'.$brandHex.'"/></svg>'),
        ];

        return $frame($slug, self::SQUARE) + [
            'wide' => $frame($slug.'-4x3', self::WIDE_HEIGHT),
            // Says what it is, to every reader of the manifest: a drawing, not a photograph.
            'kind' => 'placeholder',
        ];
    }

    /**
     * `18–19 Zoll`, `19 Zoll`.
     *
     * @param  list<float>  $diameters
     */
    private static function sizes(array $diameters): string
    {
        if ($diameters === []) {
            return 'Größe folgt';
        }

        $low = min($diameters);
        $high = max($diameters);
        $inch = static fn (float $d): string => GermanFormat::decimal($d, fmod($d, 1.0) === 0.0 ? 0 : 1);

        return ($low === $high ? $inch($low) : $inch($low).GermanFormat::ENDASH.$inch($high)).' Zoll';
    }

    private static function svg(int $w, int $h, int $cx, int $cy, int $r, string $brand, string $label, string $ground, string $metal, int $spokes): string
    {
        $e = static fn (string $s): string => htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $spokeWidth = match (true) {
            $spokes <= 5 => 0.19,
            $spokes <= 7 => 0.15,
            $spokes <= 10 => 0.1,
            default => 0.05,
        } * $r;
        $hub = 0.24 * $r;
        $lines = '';

        for ($i = 0; $i < $spokes; $i++) {
            $a = deg2rad(-90 + 360 / $spokes * $i);
            [$x1, $y1] = [round($hub * cos($a), 1), round($hub * sin($a), 1)];
            [$x2, $y2] = [round(0.86 * $r * cos($a), 1), round(0.86 * $r * sin($a), 1)];
            $lines .= "<line x1=\"{$x1}\" y1=\"{$y1}\" x2=\"{$x2}\" y2=\"{$y2}\"/>";
        }

        $bolts = '';

        for ($i = 0; $i < 5; $i++) {
            $a = deg2rad(-90 + 72 * $i);
            $bolts .= '<circle cx="'.round(0.14 * $r * cos($a), 1).'" cy="'.round(0.14 * $r * sin($a), 1).'" r="'.round(0.028 * $r, 1).'"/>';
        }

        $outline = round($spokeWidth + 8, 1);
        $spoke = round($spokeWidth, 1);
        $rim = round(0.12 * $r, 1);
        $rimOuter = round($rim + 8, 1);
        $bottom = $h - 120;

        return <<<SVG
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$w} {$h}" width="{$w}" height="{$h}" role="img" aria-label="{$e('Platzhalterbild: '.$brand.' '.$label)}">
            <rect width="{$w}" height="{$h}" fill="{$ground}"/>
            <text x="72" y="112" font-family="{$e(self::FONT)}" font-size="40" font-weight="700" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.92">{$e(mb_strtoupper($brand))}</text>
            <g transform="translate({$cx} {$cy})" stroke-linecap="round">
            <circle r="{$r}" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="{$rimOuter}"/>
            <circle r="{$r}" fill="none" stroke="{$metal}" stroke-width="{$rim}"/>
            <g stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="{$outline}">{$lines}</g>
            <g stroke="{$metal}" stroke-width="{$spoke}">{$lines}</g>
            <circle r="{$hub}" fill="{$metal}" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="4"/>
            <g fill="{$ground}">{$bolts}</g>
            <circle r="{$e((string) round(0.07 * $r, 1))}" fill="{$ground}"/>
            </g>
            <text x="72" y="{$bottom}" font-family="{$e(self::FONT)}" font-size="52" font-weight="600" fill="#FFFFFF">{$e($label)}</text>
            <text x="72" y="{$e((string) ($bottom + 52))}" font-family="{$e(self::FONT)}" font-size="36" fill="#FFFFFF" fill-opacity="0.82">Platzhalterbild · kein Produktfoto</text>
            </svg>
            SVG;
    }
}
