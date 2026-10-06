<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The photographs the homepage hero can stand on (PROTECTED.md P1; the operator's brief of 05.10.2026, §2): brand
 * assets, not product rows. They are the licensed front shots in database/seeders/content/wheel-photos.php that were
 * measured for the hero (an `anchors` entry), cut out by `wheels:process-images` and shipped with every release under
 * `rimify.demo.wheels_dir` — so no reset, no seeder and no empty catalogue can take them away. Which one leads is
 * chosen in Inhalte › Seiten › Startseite › Einstieg (PageSchema, field `foto`); the other front shot of the same wheel
 * stands behind it.
 *
 * The photograph says nothing about a product of the shop: no price, no link, no stock. What it does carry is the wheel's
 * own values as its document states them for the stamped size (`facts`, wheel-photos.php) — the hero's leaders, caption
 * and spec line — so the hero makes no product query and stands complete with an empty catalogue (the client's #4).
 */
final class HeroPhotos
{
    /** The photograph a delivered shop leads with: the client's Borbet DB8GT2 in Schwarz matt. */
    public const DEFAULT = 'borbet-db8gt2-schwarz-matt';

    /**
     * Every front shot measured for the hero, by its slug.
     *
     * @return array<string, array{slug: string, model: string, brand: string, name: string, finish: string, stamp: string|null, facts: array<string, int|float>|null}>
     */
    public static function all(): array
    {
        $out = [];

        foreach (DemoWheels::photos() as $entry) {
            if (! isset($entry['anchors']) || isset($entry['view'])) {
                continue;
            }

            $out[$entry['slug']] = [
                'slug' => $entry['slug'],
                'model' => $entry['model'],
                'brand' => $entry['brand'] ?? '',
                'name' => $entry['name'] ?? '',
                'finish' => $entry['finish'],
                'stamp' => $entry['stamp'] ?? null,
                'facts' => is_array($entry['facts'] ?? null) ? $entry['facts'] : null,
            ];
        }

        return $out;
    }

    /**
     * The choices for the Einstieg's `foto` field: „Borbet DB8GT2 · Schwarz matt, dahinter Bronze matt“.
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        $options = [];

        foreach (self::all() as $slug => $photo) {
            $companion = self::companionOf($slug);
            $options[] = [
                'value' => $slug,
                'label' => trim($photo['brand'].' '.$photo['name']).' · '.$photo['finish'].($companion === null ? '' : ', dahinter '.$companion['finish']),
            ];
        }

        return $options;
    }

    /**
     * The photograph the hero shows for a chosen slug — the default where the choice is empty or names none — with its
     * cut-out and the second wheel behind it. Null only where no photograph of the choice is on the disk: a release
     * that shipped without its images, which `rimify:smoke` reports on the host.
     *
     * @return array{slug: string, model: string, brand: string, name: string, finish: string, stamp: string|null, facts: array<string, int|float>|null, imageManifest: array<string, mixed>, companion: array{finish: string, imageManifest: array<string, mixed>}|null}|null
     */
    public static function resolve(?string $chosen): ?array
    {
        $all = self::all();
        $slug = is_string($chosen) && isset($all[$chosen]) ? $chosen : (isset($all[self::DEFAULT]) ? self::DEFAULT : array_key_first($all));

        if ($slug === null) {
            return null;
        }

        $manifest = self::heroManifest($slug);

        if ($manifest === null) {
            return null;
        }

        $companion = self::companionOf($slug);
        $companionManifest = $companion === null ? null : self::heroManifest($companion['slug']);

        return [
            ...$all[$slug],
            'imageManifest' => $manifest,
            'companion' => $companion === null || $companionManifest === null ? null : ['finish' => $companion['finish'], 'imageManifest' => $companionManifest],
        ];
    }

    /**
     * The other front shot of the same wheel, or null.
     *
     * @return array{slug: string, model: string, brand: string, name: string, finish: string, stamp: string|null, facts: array<string, int|float>|null}|null
     */
    private static function companionOf(string $slug): ?array
    {
        $all = self::all();
        $model = $all[$slug]['model'] ?? null;

        foreach ($all as $other => $photo) {
            if ($other !== $slug && $photo['model'] === $model && $model !== '') {
                return $photo;
            }
        }

        return null;
    }

    /**
     * A cut-out the hero can stand: well-formed, with the shadowless `bare` frame and the wheel anchor it rolls about.
     *
     * @return array<string, mixed>|null
     */
    private static function heroManifest(string $slug): ?array
    {
        $manifest = DemoWheels::manifest($slug);
        $bare = is_array($manifest['bare'] ?? null) ? $manifest['bare'] : null;
        $anchors = is_array($bare['anchors'] ?? null) ? $bare['anchors'] : ($manifest['anchors'] ?? null);

        return $manifest !== null && $bare !== null && is_array($anchors) && is_array($anchors['wheel'] ?? null) ? $manifest : null;
    }
}
