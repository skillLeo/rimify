<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The homepage's hero pictures, preloaded by the desktop document before the bundle asks for them (app.blade.php; the
 * operator's brief of 05.10.2026, §5). The photograph the stage shows — the brand's, else the product's, as HomeHero's
 * `source` — in its shadowless `bare` frame, else the square one; and its second wheel's `bare` frame where it has one.
 * Both stand in the first screen, and the later of the two to paint is the page's LCP: unpreloaded, the second wheel,
 * fetched last, made it 4,7 s on a throttled phone network (measured 05.10.2026). Before this, the preload read the
 * product alone — nothing with the catalogue empty, the wrong file when the brand's photograph is another wheel.
 *
 * The phone document gets none: its frame stands below the first screen (861 px down on a 390 × 844 phone) and is
 * fetched lazily and last (HeroFrame.vue), so the headline paints first. `SIZES` is the pictures' own `sizes`
 * (HERO_SIZES_DESKTOP in calloutSlots.ts; calloutSlots.test.ts holds the two equal).
 */
final class HeroPreload
{
    public const SIZES = '(min-width: 1280px) 500px, (min-width: 1024px) 33vw, (min-width: 768px) 373px, calc(67vw - 27px)';

    private const TYPES = ['avif' => 'image/avif', 'webp' => 'image/webp', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'svg' => 'image/svg+xml'];

    /**
     * @param  array<string, mixed>  $page  the Inertia page as the document receives it
     * @return list<array{srcset: string, type: string, sizes: string}>
     */
    public static function links(array $page): array
    {
        if (($page['component'] ?? null) !== 'Startseite/Desktop') {
            return [];
        }

        $hero = $page['props']['hero'] ?? null;
        $source = is_array($hero) ? ($hero['photo'] ?? $hero['product'] ?? null) : null;

        if (! is_array($source)) {
            return [];
        }

        $manifest = $source['imageManifest'] ?? null;
        $pictures = [
            is_array($manifest) && is_array($manifest['bare'] ?? null) ? $manifest['bare'] : $manifest,
            // The second wheel stands only on its own `bare` frame (companionScene in calloutSlots.ts).
            $source['companion']['imageManifest']['bare'] ?? null,
        ];
        $links = [];

        foreach ($pictures as $picture) {
            $link = is_array($picture) ? self::link($picture) : null;

            if ($link !== null) {
                $links[] = $link;
            }
        }

        return $links;
    }

    /**
     * @param  array<mixed>  $picture  an image manifest (Picture.vue's ImageManifest)
     * @return array{srcset: string, type: string, sizes: string}|null
     */
    private static function link(array $picture): ?array
    {
        $base = $picture['base'] ?? null;
        $widths = $picture['widths'] ?? null;

        if (! is_string($base) || ! is_array($widths) || $widths === []) {
            return null;
        }

        // The best format the picture offers (Picture.vue's `formats`, AVIF first by default); a drawing with none offers
        // its fallback (`svg`).
        $formats = $picture['formats'] ?? null;
        $format = is_array($formats) ? (string) ($formats[0] ?? ($picture['fallback'] ?? 'jpg')) : 'avif';
        $type = self::TYPES[$format] ?? null;

        if ($type === null) {
            return null;
        }

        return [
            'srcset' => implode(', ', array_map(static fn (mixed $w): string => $base.'-'.(int) $w.'.'.$format.' '.(int) $w.'w', $widths)),
            'type' => $type,
            'sizes' => self::SIZES,
        ];
    }
}
