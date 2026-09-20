<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\VehicleTree;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The homepage. It sets the visual language every other page inherits, so nothing on it is a
 * placeholder: the bestseller rail is four real catalogue rows, the make grid is the real vehicle
 * tree, and the brand cards are the brands that actually have stock behind them.
 */
class StartseiteController extends Controller
{
    public function __construct(
        private readonly ProductCards $cards,
        private readonly VehicleTree $tree,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Startseite/Index', [
            'bestsellers' => $this->cards->catalogue(limit: 8),
            'makes' => $this->tree->makes(),
            'brands' => $this->brands(),
            // The month is part of the heading — "Bestseller aus Mai 2026" — so it is computed
            // here rather than written into a translation string that would go stale.
            'month' => $this->currentMonthDe(),
        ]);
    }

    /**
     * Brands with at least one published, in-stock configuration.
     *
     * A brand card leading to an empty listing is worse than no brand card: the customer reads it
     * as the site being broken rather than as the range being smaller than they hoped.
     *
     * @return list<array<string, mixed>>
     */
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
            ->groupBy('br.id', 'br.name', 'br.slug')
            ->orderBy('br.sort_order')
            ->limit(4)
            ->get(['br.name', 'br.slug', DB::raw('MIN(wm.spoke_count) as spokes')]);

        $brands = [];

        foreach ($rows as $row) {
            $brands[] = [
                'name' => (string) $row->name,
                'slug' => (string) $row->slug,
                'spokes' => (int) $row->spokes,
            ];
        }

        return $brands;
    }

    private function currentMonthDe(): string
    {
        $months = [
            1 => 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
        ];

        $now = now();

        return $months[(int) $now->format('n')].' '.$now->format('Y');
    }
}
