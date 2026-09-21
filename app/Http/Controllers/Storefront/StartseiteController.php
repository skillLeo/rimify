<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Storefront\FitmentCount;
use App\Services\Storefront\HomeStats;
use App\Services\Storefront\MegaMenu;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\RecentlyViewed;
use App\Services\Storefront\VehicleTree;
use App\Support\DevicePage;
use App\Support\GermanFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The homepage. One job: from "I want new wheels" to "these are the wheels that are legal on my
 * car" in under ten seconds, and trust in the answer. Everything on it is data — the hero wheel's
 * values, the counts, the tiles, the tyre label — or it is not on it.
 */
class StartseiteController extends Controller
{
    /** The three tabs of the popular row, each a real query. */
    private const TABS = [
        'beliebt' => ['label' => 'Beliebt', 'options' => ['order' => 'coverage']],
        'neu' => ['label' => 'Neu', 'options' => ['order' => 'newest']],
        'bis200' => ['label' => 'Bis 200 €', 'options' => ['order' => 'price', 'maxPriceCents' => 20_000]],
    ];

    public function __construct(
        private readonly ProductCards $cards,
        private readonly VehicleTree $tree,
        private readonly MegaMenu $mega,
        private readonly HomeStats $stats,
        private readonly RecentlyViewed $recentlyViewed,
        private readonly FitmentCount $count,
        private readonly VehicleResolver $resolver,
        private readonly ListingQuery $listing,
    ) {}

    public function index(Request $request): Response
    {
        $vehicleId = $this->vehicleId($request);
        $tab = $request->string('beliebt')->toString();
        $tab = array_key_exists($tab, self::TABS) ? $tab : 'beliebt';
        $blocks = $this->blocks();

        $vehicle = $vehicleId === null ? null : $this->resolver->find($vehicleId);

        return Inertia::render(DevicePage::resolve('Startseite', $request), [
            'hero' => [
                'title' => (string) ($blocks['hero']['headline'] ?? 'Felgen, die an dein Auto dürfen.'),
                'subline' => (string) ($blocks['hero']['sub'] ?? ''),
                // The phone document's shorter sentence; the desktop one stays the fallback.
                'sublineMobile' => (string) ($blocks['hero']['sub_mobile'] ?? $blocks['hero']['sub'] ?? ''),
                'product' => $this->heroProduct(),
                'stats' => $this->stats->counts(),
            ],
            'selector' => ['makes' => $this->tree->makes()],
            // F1 for the chosen vehicle, in the first paint rather than one round trip later.
            'fitmentCount' => $vehicle === null ? null : $this->count->forVehicle($vehicle),
            'promises' => $this->promises($blocks),
            'popular' => $this->popular($vehicleId, $tab),
            'recentlyViewed' => $this->cards->catalogue(
                limit: 12,
                options: ['modelIds' => $this->recentlyViewed->ids($request->session())],
            ),
            'sizes' => $this->sizes($vehicleId),
            'brands' => $this->brands(),
            'komplettrad' => ['tyre' => $this->featuredTyre()],
            'calculator' => ['prefill' => $vehicleId === null ? null : $this->prefill($vehicleId)],
            'partners' => [
                'enabled' => config('rimify.features.partners') === true,
                'demo' => app()->environment(['local', 'staging', 'testing']),
            ],
            'guides' => $this->guides(),
            'faq' => $this->faqPreview(),
        ]);
    }

    /**
     * The wheel the hero shows, chosen by the admin (`settings.hero_product_id`); until one is
     * chosen, the first published model. Its callout values are the cheapest configuration's own.
     *
     * @return array<string, mixed>|null
     */
    private function heroProduct(): ?array
    {
        $chosen = Setting::get('hero_product_id');

        $model = WheelModel::query()
            ->with(['brand'])
            ->where('status', CatalogueStatus::Published->value)
            ->when(is_int($chosen) || is_numeric($chosen), fn ($q) => $q->where('id', (int) $chosen))
            ->orderBy('id')
            ->first();

        if ($model === null) {
            return null;
        }

        $config = WheelConfig::query()
            ->where('wheel_model_id', $model->id)
            ->orderBy('price_cents')
            ->orderBy('id')
            ->first();

        if ($config === null) {
            return null;
        }

        $finish = DB::table('wheel_finishes')->where('id', $config->wheel_finish_id)->value('name_de');

        return [
            'slug' => (string) $model->slug,
            'name' => (string) $model->name,
            'brand' => (string) $model->brand->name,
            'finish' => is_string($finish) ? $finish : '',
            'fromPriceCents' => (int) $config->price_cents,
            'fromPrice' => GermanFormat::money((int) $config->price_cents),
            // The cut-out manifest the page renders (resources/js/images/<image>.json), until the
            // admin uploads a per-product cut-out.
            'image' => 'hero-wheel',
            // The configuration's own numbers, for the callouts and the calculator.
            'config' => [
                'widthIn' => (float) $config->width_in,
                'diameterIn' => (float) $config->diameter_in,
                'etMm' => (int) $config->et_mm,
                'boltHoles' => (int) $config->bolt_holes,
                'boltCircleMm' => (float) $config->bolt_circle_mm,
                'centreBoreMm' => (float) $config->centre_bore_mm,
            ],
            // A free-licence photograph stands in for the supplier's packshot; the values are the
            // product's own, and the page says the picture is not (docs/phase0/ASSET-REQUEST.md).
            'symbolic' => true,
            'spec' => [
                // Width × diameter without the ET: the ET has its own callout.
                ['label' => 'Breite × Durchmesser', 'value' => GermanFormat::trimmedDecimal((float) $config->width_in, 2).' J × '.GermanFormat::trimmedDecimal((float) $config->diameter_in, 1)],
                ['label' => 'Lochkreis', 'value' => GermanFormat::boltPattern((int) $config->bolt_holes, (float) $config->bolt_circle_mm)],
                ['label' => 'Mittenlochbohrung', 'value' => GermanFormat::millimetres((float) $config->centre_bore_mm)],
                ['label' => 'Einpresstiefe', 'value' => 'ET '.(int) $config->et_mm],
            ],
        ];
    }

    /**
     * @param  array<string, array<string, mixed>>  $blocks
     * @return list<array{title: string, text: string, icon: string}>
     */
    private function promises(array $blocks): array
    {
        $items = $blocks['promise_row']['items'] ?? [];
        $out = [];

        foreach (is_array($items) ? $items : [] as $item) {
            if (! is_array($item) || ! isset($item['title'], $item['text'])) {
                continue;
            }

            $out[] = [
                'title' => (string) $item['title'],
                'text' => (string) $item['text'],
                'icon' => (string) ($item['icon'] ?? 'check'),
            ];
        }

        return $out;
    }

    /**
     * Eight tiles. With a vehicle the row is a compliance answer for that car and the tabs give
     * way to the count; without one it is the catalogue in one of three real orders.
     *
     * @return array<string, mixed>
     */
    private function popular(?int $vehicleId, string $tab): array
    {
        $tabs = [];

        foreach (self::TABS as $key => $definition) {
            $tabs[] = ['key' => $key, 'label' => $definition['label']];
        }

        if ($vehicleId !== null) {
            // The car's own answer, then the tab's order or filter applied to it: the listing
            // decides which cards exist, the tab only arranges them (R-13).
            $result = $this->cards->forVehicle($vehicleId, [], 24, 1);

            return [
                'title' => null,
                'tabs' => $tabs,
                'active' => $tab,
                'cards' => array_slice($this->arrange($result['cards'], $tab), 0, 8),
                'total' => $result['total'],
            ];
        }

        return [
            'title' => 'Beliebte Felgen',
            'tabs' => $tabs,
            'active' => $tab,
            'cards' => $this->cards->catalogue(limit: 8, options: self::TABS[$tab]['options']),
            'total' => null,
        ];
    }

    /**
     * The three orders on a set of cards that the listing already chose: `beliebt` keeps the
     * listing's order, `neu` puts the newest models first, `bis200` keeps the ones from 200 € down.
     *
     * @param  list<array<string, mixed>>  $cards
     * @return list<array<string, mixed>>
     */
    private function arrange(array $cards, string $tab): array
    {
        if ($tab === 'bis200') {
            return array_values(array_filter($cards, static fn (array $card): bool => (int) $card['fromPriceCents'] <= 20_000));
        }

        if ($tab === 'neu') {
            $ids = array_values(array_unique(array_map(static fn (array $card): int => (int) $card['modelId'], $cards)));
            $created = DB::table('wheel_models')->whereIn('id', $ids)->pluck('created_at', 'id');

            usort($cards, static fn (array $a, array $b): int => strcmp(
                (string) ($created[(int) $b['modelId']] ?? ''),
                (string) ($created[(int) $a['modelId']] ?? ''),
            ));
        }

        return array_values($cards);
    }

    /**
     * The size tiles, 16 to 22 Zoll, each with the number of models — the same figures the Felgen
     * panel shows, so the two can never disagree. With a vehicle, `fitting` is how many of them a
     * document permits on that car (the listing's own facet); null without one.
     *
     * @return list<array{inch: int, count: int, fitting: int|null, href: string}>
     */
    private function sizes(?int $vehicleId): array
    {
        $shared = [];

        foreach ($this->mega->share()['sizes'] as $size) {
            $shared[(int) $size['label']] = $size;
        }

        $fitting = [];

        if ($vehicleId !== null) {
            foreach ($this->listing->facets($vehicleId)['zoll'] ?? [] as $option) {
                $fitting[(int) $option['value']] = (int) $option['count'];
            }
        }

        $out = [];

        foreach (range(16, 22) as $inch) {
            $out[] = [
                'inch' => $inch,
                'count' => isset($shared[$inch]) ? (int) $shared[$inch]['count'] : 0,
                'fitting' => $vehicleId === null ? null : ($fitting[$inch] ?? 0),
                'href' => '/felgen?zoll='.$inch,
            ];
        }

        return $out;
    }

    /**
     * Brands with at least one published, in-stock configuration. A brand tile leading to an
     * empty listing reads as a broken site, so a brand without stock is not a tile.
     *
     * @return list<array{name: string, slug: string, logo: string|null, count: int, href: string}>
     */
    private function brands(): array
    {
        $rows = DB::table('brands as br')
            ->join('wheel_models as wm', 'wm.brand_id', '=', 'br.id')
            ->join('wheel_configs as wc', 'wc.wheel_model_id', '=', 'wm.id')
            ->whereNull('br.deleted_at')
            ->whereNull('wm.deleted_at')
            ->whereNull('wc.deleted_at')
            ->where('wm.status', CatalogueStatus::Published->value)
            ->where('wc.stock_qty', '>', 0)
            ->groupBy('br.id', 'br.name', 'br.slug', 'br.logo_path', 'br.sort_order')
            ->orderBy('br.sort_order')
            ->get(['br.name', 'br.slug', 'br.logo_path', DB::raw('COUNT(DISTINCT wm.id) as models')]);

        $out = [];

        foreach ($rows as $row) {
            $out[] = [
                'name' => (string) $row->name,
                'slug' => (string) $row->slug,
                'logo' => is_string($row->logo_path) && $row->logo_path !== '' ? '/storage/'.ltrim($row->logo_path, '/') : null,
                'count' => (int) $row->models,
                'href' => '/felgen?marke='.rawurlencode((string) $row->slug),
            ];
        }

        return $out;
    }

    /**
     * The tyre whose EU label the Kompletträder band shows: the first in-stock tyre carrying a
     * complete label. No label data, no label — never a drawn one.
     *
     * @return array<string, mixed>|null
     */
    private function featuredTyre(): ?array
    {
        $row = DB::table('tyre_variants as t')
            ->join('brands as br', 'br.id', '=', 't.brand_id')
            ->whereNull('t.deleted_at')
            ->where('t.stock_qty', '>', 0)
            ->whereNotNull('t.eu_fuel_class')
            ->whereNotNull('t.eu_wet_grip_class')
            ->whereNotNull('t.eu_noise_db')
            ->whereNotNull('t.eu_noise_class')
            ->orderBy('t.id')
            ->first(['t.name', 'br.name as brand', 't.width_mm', 't.aspect', 't.diameter_in', 't.load_index', 't.speed_symbol', 't.eu_fuel_class', 't.eu_wet_grip_class', 't.eu_noise_db', 't.eu_noise_class', 't.eprel_id']);

        if ($row === null) {
            return null;
        }

        return [
            'title' => $row->brand.' '.$row->name.' '.GermanFormat::tyreSize((int) $row->width_mm, (int) $row->aspect, (float) $row->diameter_in, (int) $row->load_index, (string) $row->speed_symbol),
            'fuel' => (string) $row->eu_fuel_class,
            'wet' => (string) $row->eu_wet_grip_class,
            'noiseDb' => (int) $row->eu_noise_db,
            'noiseClass' => (string) $row->eu_noise_class,
            'eprelId' => is_string($row->eprel_id) && $row->eprel_id !== '' ? $row->eprel_id : null,
        ];
    }

    /**
     * The calculator's starting values for the chosen car: the first permitted configuration and
     * its first tyre size from the documents — real data, or nothing.
     *
     * @return array{widthIn: float, diameterIn: float, etMm: int, tyreWidth: int, aspect: int}|null
     */
    private function prefill(int $vehicleId): ?array
    {
        $row = DB::table('fitments as f')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->join('fitment_tyre_sizes as ts', 'ts.fitment_id', '=', 'f.id')
            ->where('f.vehicle_id', $vehicleId)
            ->whereNull('wc.deleted_at')
            ->orderBy('wc.diameter_in')
            ->orderBy('f.id')
            ->first(['wc.width_in', 'wc.diameter_in', 'wc.et_mm', 'ts.width_mm', 'ts.aspect']);

        if ($row === null) {
            return null;
        }

        return [
            'widthIn' => (float) $row->width_in,
            'diameterIn' => (float) $row->diameter_in,
            'etMm' => (int) $row->et_mm,
            'tyreWidth' => (int) $row->width_mm,
            'aspect' => (int) $row->aspect,
        ];
    }

    /**
     * The three guides, from the published pages of kind `guide`.
     *
     * @return list<array{slug: string, title: string, teaser: string, minutes: int}>
     */
    private function guides(): array
    {
        $rows = DB::table('pages as p')
            ->leftJoin('page_blocks as b', function ($join): void {
                $join->on('b.page_id', '=', 'p.id')->where('b.type', '=', 'guide_lead');
            })
            ->where('p.kind', 'guide')
            ->where('p.status', 'published')
            ->orderBy('p.id')
            ->limit(3)
            ->get(['p.slug', 'p.title', 'b.data']);

        $out = [];

        foreach ($rows as $row) {
            $lead = is_string($row->data) ? json_decode($row->data, true) : null;
            $lead = is_array($lead) ? $lead : [];

            $out[] = [
                'slug' => (string) $row->slug,
                'title' => (string) $row->title,
                'teaser' => (string) ($lead['teaser'] ?? ''),
                'minutes' => (int) ($lead['minutes'] ?? 3),
            ];
        }

        return $out;
    }

    /**
     * The five top answers, in the editors' own order — the same rows /faq shows, so the homepage
     * can never promise an answer the FAQ page does not give.
     *
     * @return list<array{id: int, question: string, answer: string}>
     */
    private function faqPreview(): array
    {
        $rows = DB::table('faq_entries')
            ->where('published', true)
            ->orderBy('sort_order')
            ->limit(5)
            ->get(['id', 'question_de', 'answer_de']);

        $out = [];

        foreach ($rows as $row) {
            $out[] = [
                'id' => (int) $row->id,
                'question' => (string) $row->question_de,
                'answer' => (string) $row->answer_de,
            ];
        }

        return $out;
    }

    /**
     * The homepage's content blocks, keyed by type.
     *
     * @return array<string, array<string, mixed>>
     */
    private function blocks(): array
    {
        $rows = DB::table('page_blocks as b')
            ->join('pages as p', 'p.id', '=', 'b.page_id')
            ->where('p.slug', 'startseite')
            ->get(['b.type', 'b.data']);

        $blocks = [];

        foreach ($rows as $row) {
            $data = json_decode((string) $row->data, true);
            $blocks[(string) $row->type] = is_array($data) ? $data : [];
        }

        return $blocks;
    }

    private function vehicleId(Request $request): ?int
    {
        $raw = $request->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
    }
}
