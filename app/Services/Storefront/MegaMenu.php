<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Enums\CatalogueStatus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * What the Felgen menu opens onto: the brands with stock, the sizes in the range with their counts,
 * the makes the selector knows, and four wheels from the front of the catalogue. Every entry links
 * to a real listing, and a brand or size with nothing behind it is not listed — a menu that leads
 * to an empty page reads as a broken site.
 *
 * Cached: it changes when the catalogue changes and at no other time.
 */
final readonly class MegaMenu
{
    private const CACHE_KEY = 'chrome.mega';

    private const TTL = 300;

    /*
     * The tree is the only dependency. The menu deliberately does not take ProductCards: that
     * service carries the fitment engine, and the shell must render on every route and in every
     * environment — including one where the engine's reference tables are not seeded.
     */
    public function __construct(private VehicleTree $tree) {}

    /**
     * @return array{
     *     brands: list<array{label: string, href: string}>,
     *     sizes: list<array{label: string, count: int, href: string}>,
     *     makes: list<array{label: string, href: string}>,
     *     popular: list<array{label: string, sub: string, href: string}>
     * }
     */
    public function share(): array
    {
        /** @var array{brands: list<array{label: string, href: string}>, sizes: list<array{label: string, count: int, href: string}>, makes: list<array{label: string, href: string}>, popular: list<array{label: string, sub: string, href: string}>} $menu */
        $menu = Cache::remember(self::CACHE_KEY, self::TTL, fn (): array => [
            'brands' => $this->brands(),
            'sizes' => $this->sizes(),
            'makes' => array_map(
                static fn (array $make): array => ['label' => $make['make'], 'href' => '/felgen-suchen?marke='.rawurlencode($make['make'])],
                $this->tree->makes(),
            ),
            'popular' => $this->popular(),
        ]);

        return $menu;
    }

    /**
     * Four published models from the front of the catalogue — the same order the listing opens
     * with, so the menu never names a wheel the listing would not show first.
     *
     * @return list<array{label: string, sub: string, href: string}>
     */
    private function popular(): array
    {
        $rows = DB::table('wheel_models as wm')
            ->join('brands as br', 'br.id', '=', 'wm.brand_id')
            ->join('wheel_configs as wc', 'wc.wheel_model_id', '=', 'wm.id')
            ->whereNull('wm.deleted_at')
            ->whereNull('wc.deleted_at')
            ->where('wm.status', CatalogueStatus::Published->value)
            ->groupBy('wm.id', 'wm.name', 'wm.slug', 'br.name')
            ->orderByRaw('MIN(wc.price_cents) ASC')
            ->orderBy('wm.id')
            ->limit(4)
            ->get(['wm.name', 'wm.slug', 'br.name as brand']);

        $out = [];

        foreach ($rows as $row) {
            $out[] = [
                'label' => (string) $row->name,
                'sub' => (string) $row->brand,
                'href' => '/felgen/'.rawurlencode((string) $row->slug),
            ];
        }

        return $out;
    }

    /** @return list<array{label: string, href: string}> */
    private function brands(): array
    {
        $rows = DB::table('brands as br')
            ->join('wheel_models as wm', 'wm.brand_id', '=', 'br.id')
            ->join('wheel_configs as wc', 'wc.wheel_model_id', '=', 'wm.id')
            ->whereNull('br.deleted_at')
            ->whereNull('wm.deleted_at')
            ->whereNull('wc.deleted_at')
            ->where('wm.status', 'published')
            ->where('wc.stock_qty', '>', 0)
            ->groupBy('br.id', 'br.name')
            ->orderBy('br.sort_order')
            ->get(['br.name']);

        $out = [];

        foreach ($rows as $row) {
            $out[] = ['label' => (string) $row->name, 'href' => '/felgen?marke='.rawurlencode((string) $row->name)];
        }

        return $out;
    }

    /** @return list<array{label: string, count: int, href: string}> */
    private function sizes(): array
    {
        $rows = DB::table('wheel_configs as wc')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->whereNull('wc.deleted_at')
            ->whereNull('wm.deleted_at')
            ->where('wm.status', 'published')
            ->groupBy('wc.diameter_in')
            ->orderBy('wc.diameter_in')
            ->get(['wc.diameter_in', DB::raw('COUNT(DISTINCT wm.id) as models')]);

        $out = [];

        foreach ($rows as $row) {
            $inch = rtrim(rtrim((string) $row->diameter_in, '0'), '.');
            $out[] = [
                'label' => str_replace('.', ',', $inch).' Zoll',
                'count' => (int) $row->models,
                'href' => '/felgen?zoll='.rawurlencode($inch),
            ];
        }

        return $out;
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
