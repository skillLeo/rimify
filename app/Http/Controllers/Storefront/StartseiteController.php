<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Http\Controllers\Controller;
use App\Models\Fitment;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storefront\CalculatorPrefill;
use App\Services\Storefront\FitmentCount;
use App\Services\Storefront\HomeStats;
use App\Services\Storefront\MegaMenu;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\RecentlyViewed;
use App\Services\Storefront\VehicleTree;
use App\Support\BrandLogos;
use App\Support\DemoWheels;
use App\Support\DevicePage;
use App\Support\GermanFormat;
use Illuminate\Database\Eloquent\Builder;
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
    /**
     * The three tabs of the row, each a real query. The first orders by coverage — the number of
     * approvals (fitment rows) a model has — so it is labelled for what it counts: there is no
     * sales or view data behind a "Beliebt". The `beliebt` query key stays, because links carry it.
     */
    /*
     * Every tab shows up to eight wheels, photographed or drawn: the catalogue orders photographed
     * finishes first. (It once showed photographed finishes only; with one photographed model left
     * that made a row of one tile, and nothing to compare.)
     */
    private const TABS = [
        'beliebt' => ['label' => 'Meiste Freigaben', 'options' => ['order' => 'coverage']],
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
        private readonly CalculatorPrefill $calculatorPrefill,
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
            // The same service /felgenrechner reads: the teaser and the full tool start on one size.
            'calculator' => ['prefill' => $vehicleId === null ? null : $this->calculatorPrefill->forVehicle($vehicleId)],
            'partners' => [
                'enabled' => config('rimify.features.partners') === true,
                'demo' => app()->environment(['local', 'staging', 'testing']),
            ],
            'guides' => $this->guides(),
            'faq' => $this->faqPreview(),
            // Seeded demonstration rows are on the page: it says so (OVERHAUL.md §2), and the
            // flag leaves with the rows before launch.
            'demo' => WheelModel::query()->where('is_demo', true)->exists(),
        ]);
    }

    /**
     * The wheel the hero shows, chosen by the admin (`settings.hero_product_id`); until one is
     * chosen, the first published model.
     *
     * The picture is the photographed finish's own cut-out (its manifest, with `anchors`, `bare`
     * and `stamp` passed through when they are well-formed). A model with no photograph at all is
     * drawn as line art, and the page then names no product (`symbolic`): no stand-in photograph
     * is ever shown in its place (ACCURACY.md D1, D10).
     *
     * `facts` are one configuration's values, formatted here (R-10) and nowhere else. Which one is
     * `heroConfig()`'s choice: a photograph proves the size its stamp names, never the bolt pattern.
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

        // The model's photographed finishes, each with its cut-out; a malformed one counts as none.
        $manifests = [];

        foreach (WheelFinish::query()->where('wheel_model_id', $model->id)->whereNotNull('image_manifest')->orderBy('id')->get() as $pictured) {
            $raw = $pictured->image_manifest;

            if (DemoWheels::wellFormed($raw)) {
                $manifests[(int) $pictured->id] = DemoWheels::withoutMalformedExtras($raw);
            }
        }

        [$config, $kba] = $this->heroConfig((int) $model->id, $manifests);

        if ($config === null) {
            return null;
        }

        $finish = WheelFinish::query()->find($config->wheel_finish_id);
        $manifest = $manifests[(int) $config->wheel_finish_id] ?? null;

        return [
            'slug' => (string) $model->slug,
            'name' => (string) $model->name,
            'brand' => (string) $model->brand->name,
            'finish' => $finish === null ? '' : (string) $finish->name_de,
            'fromPriceCents' => (int) $config->price_cents,
            'fromPrice' => GermanFormat::money((int) $config->price_cents),
            'imageManifest' => $manifest,
            // The configuration's own numbers; the client draws the outline's bolt holes from them.
            'config' => [
                'widthIn' => (float) $config->width_in,
                'diameterIn' => (float) $config->diameter_in,
                'etMm' => (int) $config->et_mm,
                'boltHoles' => (int) $config->bolt_holes,
                'boltCircleMm' => (float) $config->bolt_circle_mm,
                'centreBoreMm' => (float) $config->centre_bore_mm,
            ],
            // No photograph of this product: the hero draws the outline and names no product.
            'symbolic' => $manifest === null,
            'facts' => $this->heroFacts($config, $kba),
        ];
    }

    /**
     * The configuration whose values the hero states (ACCURACY.md §3.0).
     *
     * A cut-out that carries the approval number read off the wheel (`stamp`, e.g. KBA 53810)
     * proves the size that number approves — not the bolt pattern, which the same ABE covers in
     * several executions. So among the photographed finish's configurations with exactly that KBA
     * number: the one with the most fitments a customer can see, then the cheapest, then the
     * lowest id; and the number is stated. Otherwise the cheapest configuration of a photographed
     * finish (of the whole model when none is photographed), and no KBA number: the photograph's
     * stamp is never put next to a configuration it does not belong to.
     *
     * @param  array<int, array<string, mixed>>  $manifests  finish id → its cut-out
     * @return array{0: WheelConfig|null, 1: string|null}
     */
    private function heroConfig(int $modelId, array $manifests): array
    {
        $stamps = [];

        foreach ($manifests as $finishId => $manifest) {
            if (isset($manifest['stamp']) && is_string($manifest['stamp']) && $manifest['stamp'] !== '') {
                $stamps[$finishId] = $manifest['stamp'];
            }
        }

        if ($stamps !== []) {
            $stamped = WheelConfig::query()
                ->where('wheel_model_id', $modelId)
                ->where(function (Builder $any) use ($stamps): void {
                    foreach ($stamps as $finishId => $stamp) {
                        $any->orWhere(fn (Builder $one) => $one->where('wheel_finish_id', $finishId)->where('kba_number', $stamp));
                    }
                })
                ->withCount(['fitments as published_fitments' => self::visibleFitments(...)])
                ->orderByDesc('published_fitments')
                ->orderBy('price_cents')
                ->orderBy('id')
                ->first();

            if ($stamped !== null) {
                return [$stamped, $stamps[(int) $stamped->wheel_finish_id]];
            }
        }

        $cheapest = WheelConfig::query()
            ->where('wheel_model_id', $modelId)
            ->when($manifests !== [], fn ($q) => $q->whereIn('wheel_finish_id', array_keys($manifests)))
            ->orderBy('price_cents')
            ->orderBy('id')
            ->first();

        return [$cheapest, null];
    }

    /**
     * The rows a customer could be shown, for counting how many cars a stamped configuration fits.
     *
     * @param  Builder<Fitment>  $fitments
     * @return Builder<Fitment>
     */
    private static function visibleFitments(Builder $fitments): Builder
    {
        return $fitments->visibleToCustomers();
    }

    /**
     * The hero's facts, each one formatted once, here (ACCURACY.md §4): the explainer and both
     * hero documents print these strings and never build a value themselves. `kba` only when the
     * photographed stamp belongs to this configuration; `maxLoad` only when it is verified.
     *
     * @return array{width: string, diameter: string, et: string, boltPattern: string, centreBore: string, kba: string|null, maxLoad: string|null, specLine: string}
     */
    private function heroFacts(WheelConfig $config, ?string $kba): array
    {
        $boltPattern = GermanFormat::boltPattern((int) $config->bolt_holes, (float) $config->bolt_circle_mm);
        $centreBore = GermanFormat::millimetres((float) $config->centre_bore_mm);
        $maxLoad = $config->max_load_kg === null ? null : GermanFormat::kilograms((int) $config->max_load_kg);

        $line = [
            GermanFormat::rimSize((float) $config->width_in, (float) $config->diameter_in),
            GermanFormat::offset((int) $config->et_mm),
            'LK'.GermanFormat::NBSP.$boltPattern,
            'MLB'.GermanFormat::NBSP.$centreBore,
        ];

        if ($maxLoad !== null) {
            $line[] = 'Traglast'.GermanFormat::NBSP.$maxLoad;
        }

        return [
            'width' => GermanFormat::rimWidth((float) $config->width_in),
            'diameter' => GermanFormat::trimmedDecimal((float) $config->diameter_in, 1),
            'et' => GermanFormat::offset((int) $config->et_mm),
            'boltPattern' => $boltPattern,
            'centreBore' => $centreBore,
            'kba' => $kba,
            'maxLoad' => $maxLoad,
            // Plain spaces around the separators: the line wraps between values, never inside one.
            'specLine' => implode(' '.GermanFormat::MIDDOT.' ', $line),
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

        $options = self::TABS[$tab]['options'];

        return [
            'title' => 'Felgen mit den meisten Freigaben',
            'tabs' => $tabs,
            'active' => $tab,
            'cards' => $this->cards->catalogue(limit: 8, options: $options),
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

        return $cards;
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
     * empty listing reads as a broken site, so a brand without stock is not a tile. A brand row
     * without a wheel — a researched manufacturer waiting for its catalogue — is not one either:
     * the gate below is the only thing that decides, and it is unchanged.
     *
     * `logo` is the processed one-colour mask and `logoAspect` its own width / height, both from
     * BrandLogos: either the file is there and could be measured, or both are null and the wall
     * sets the name instead (home-brands.md §4.2).
     *
     * @return list<array{name: string, slug: string, logo: string|null, logoAspect: float|null, count: int, href: string}>
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
            $slug = (string) $row->slug;
            $logo = BrandLogos::resolve($slug, is_string($row->logo_path) ? $row->logo_path : null);

            $out[] = [
                'name' => (string) $row->name,
                'slug' => $slug,
                'logo' => $logo === null ? null : $logo['url'],
                'logoAspect' => $logo === null ? null : $logo['aspect'],
                'count' => (int) $row->models,
                'href' => '/felgen?marke='.rawurlencode($slug),
            ];
        }

        return $out;
    }

    /**
     * The tyre whose EU label the Kompletträder band shows: the first in-stock tyre carrying a
     * complete label that is verified against its EPREL entry. No verified label data, no label —
     * never a drawn one, and never values typed in from memory (ACCURACY.md D7).
     *
     * @return array<string, mixed>|null
     */
    private function featuredTyre(): ?array
    {
        $row = DB::table('tyre_variants as t')
            ->join('brands as br', 'br.id', '=', 't.brand_id')
            ->whereNull('t.deleted_at')
            ->where('t.stock_qty', '>', 0)
            ->whereNotNull('t.eprel_id')
            ->where('t.eprel_id', '<>', '')
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
