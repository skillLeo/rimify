<?php

declare(strict_types=1);

use App\Support\BrandLogos;
use Database\Seeders\BrandLogoSeeder;
use Illuminate\Support\Facades\File;
use Tests\Support\PngPixels;

/*
 * The processed logo files themselves (public/images/brands, written by scripts/brand-logo.mjs):
 * one colour, nothing behind the ink, bounds the manifest describes truthfully. A brand without a
 * logo is a decision on the record — `missing` says why — never a gap nobody noticed.
 */

/** Everything an SVG mask must and must not contain. */
function expectOneColourSvg(string $slug, string $svg): void
{
    expect(strlen($svg))->toBeLessThanOrEqual(8 * 1024, "{$slug}: over the 8 KB budget for a mask")
        ->and(preg_match('~<(text|tspan|image|use|style|mask|filter|script|foreignObject|pattern|linearGradient|radialGradient|rect|switch)\b~i', $svg))
        ->toBe(0, "{$slug}: markup that does not belong in a mask")
        ->and(preg_match('~(xlink:)?href\s*=~i', $svg))->toBe(0, "{$slug}: an external reference")
        ->and(preg_match('~\sstyle\s*=~i', $svg))->toBe(0, "{$slug}: an inline style")
        // A path shaped like a rectangle would be the background plate the mask must not have.
        ->and(preg_match('~d="M\s*-?[\d.]+[\s,]+-?[\d.]+\s*[Hh][^A-Za-z]+[Vv][^A-Za-z]+[Hh][^A-Za-z]+[Zz]?\s*"~', $svg))
        ->toBe(0, "{$slug}: a path the size of the whole box");

    preg_match_all('~\b(fill|stroke)\s*=\s*"([^"]*)"~i', $svg, $paints);

    $colours = array_values(array_unique(array_filter(
        array_map(static fn (string $paint): string => mb_strtolower(trim($paint)), $paints[2]),
        static fn (string $paint): bool => $paint !== 'none',
    )));

    expect($colours)->toHaveCount(1, "{$slug}: ".count($colours).' paint colours, a mask has one');
    expect($colours[0])->not->toBeIn(['#fff', '#ffffff', 'white'], "{$slug}: white ink becomes a solid block in a mask");
}

it('accounts for every researched brand: a processed logo, or a recorded reason there is none', function (): void {
    $logos = BrandLogos::manifest();
    $missing = BrandLogos::missing();

    foreach (BrandLogoSeeder::BRANDS as $spec) {
        $slug = $spec['slug'];

        expect(array_key_exists($slug, $logos) || array_key_exists($slug, $missing))
            ->toBeTrue("{$slug}: no processed logo and no recorded reason — run `node scripts/brand-logo.mjs`");

        if (array_key_exists($slug, $missing)) {
            expect(trim($missing[$slug]))->not->toBe('', "{$slug}: recorded as having no logo without saying why");
            expect(array_key_exists($slug, $logos))->toBeFalse("{$slug}: both a logo and a reason there is none");
        }
    }
});

it('ships every processed logo as a one-colour mask on a transparent background', function (): void {
    $logos = BrandLogos::manifest();

    expect($logos)->not->toBeEmpty('no logo has been processed at all');

    foreach ($logos as $slug => $entry) {
        $file = BrandLogos::dir().DIRECTORY_SEPARATOR.$entry['file'];

        expect($file)->toBeFile("{$slug}: in the manifest, not on disk")
            ->and($entry['aspect'])->toBeGreaterThanOrEqual(BrandLogos::MIN_ASPECT)
            ->and($entry['aspect'])->toBeLessThanOrEqual(BrandLogos::MAX_ASPECT)
            // What the page ships is read from the file, so the two have to agree.
            ->and(BrandLogos::aspectOf($file))->toBe($entry['aspect'], "{$slug}: the manifest aspect is not the file's");

        $logo = BrandLogos::resolve($slug, BrandLogos::bundledPath($slug) ?? '');

        expect($logo)->not->toBeNull("{$slug}: the app would refuse its own file")
            ->and(preg_match(BrandLogos::URL_PATTERN, (string) ($logo['url'] ?? '')))->toBe(1);

        if ($entry['format'] === 'svg') {
            expectOneColourSvg($slug, File::get($file));

            continue;
        }

        $png = PngPixels::inspect($file);

        expect(max($png['width'], $png['height']))->toBeGreaterThanOrEqual(960, "{$slug}: too few pixels to stay sharp")
            ->and($png['oneColour'])->toBeTrue("{$slug}: more than one colour under the alpha")
            ->and($png['opaque'])->toBeGreaterThan(0, "{$slug}: nothing is drawn")
            ->and($png['transparentShare'])->toBeGreaterThan(0.1, "{$slug}: almost nothing is transparent — a background?")
            ->and($png['frameTransparentShare'])->toBeGreaterThan(0.25, "{$slug}: its outer frame is opaque — a background plate");
    }
});

it('has a processed logo for MOTEC, the one brand with a catalogue', function (): void {
    expect(BrandLogos::bundledPath('motec'))->toBe('/images/brands/motec.svg');
});
