<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\WheelModel;
use App\Services\Content\PageContent;
use App\Services\Storefront\CalculatorPrefill;
use App\Services\Storefront\FitmentCount;
use App\Services\Storefront\HomeShelf;
use App\Services\Storefront\HomeStats;
use App\Services\Storefront\MegaMenu;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\RecentlyViewed;
use App\Services\Storefront\VehicleTree;
use App\Support\BrandLogos;
use App\Support\DevicePage;
use App\Support\GermanFormat;
use App\Support\HeroPhotos;
use Illuminate\Database\Query\Builder as QueryBuilder;
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
     * The shelf's one heading (the client's #5, the operator's brief „THE 34“): what sold in the last 90 days, by paid
     * order lines (BestSellers) — or, before the first sale, what is newest in the shop. Never a claim the data does not
     * hold: no „Meistgekauft“ without a sale, no „Beliebt“ at all.
     */
    public const BESTSELLING_LABEL = 'Meistgekaufte Felgen';

    public const NEWEST_LABEL = 'Neu im Shop';

    /** Before the first sale, with the team's picks on the shelf (#5, D-353): what they are, never a bestseller claim. */
    public const RECOMMENDED_LABEL = 'Empfohlene Felgen';

    /** Below four wheels on sale the shelf is not shown at all — absent, never an empty row. */
    public const SHELF_MIN = 4;

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
        private readonly PageContent $content,
        private readonly HomeShelf $shelf,
    ) {}

    public function index(Request $request): Response
    {
        $vehicleId = $this->vehicleId($request);
        $blocks = $this->blocks();

        $vehicle = $vehicleId === null ? null : $this->resolver->find($vehicleId);
        $photo = HeroPhotos::resolve(is_string($blocks['hero']['foto'] ?? null) ? $blocks['hero']['foto'] : null);
        // The brand's photograph (PROTECTED.md P1) with the values its document states for the stamped size — the leaders, the
        // caption and the spec line — in every state of the catalogue: no product query, no price, no link (the client's #4, the
        // operator's brief „THE 34“).
        $shown = $photo === null ? null : [
            'brand' => $photo['brand'],
            'name' => $photo['name'],
            'finish' => $photo['finish'],
            'imageManifest' => $photo['imageManifest'],
            'companion' => $photo['companion'],
            'facts' => $this->photoFacts($photo),
        ];

        return Inertia::render(DevicePage::resolve('Startseite', $request), [
            'hero' => [
                'title' => (string) ($blocks['hero']['headline'] ?? 'Felgen, die an dein Auto dürfen.'),
                'subline' => (string) ($blocks['hero']['sub'] ?? ''),
                // The phone document's own sentence (required in the editor). Absent or empty, the
                // phone keeps its short default rather than the desktop's five lines (Mobile.vue).
                'sublineMobile' => trim((string) ($blocks['hero']['sub_mobile'] ?? '')),
                'photo' => $shown,
            ],
            // The counts the story (H4) shows: Gutachten, cars, wheels.
            'stats' => $this->stats->counts(),
            // The numbers section (H8, PROTECTED.md P4) explains the photograph's own wheel with the photograph's own values — the
            // same fixed assets the hero stands on, never a catalogue row: no product changed or archived can take it away (the
            // operator's decision of 09.11.2026, D-444).
            'photoWheel' => $shown,
            'selector' => ['makes' => $this->tree->makes()],
            // F1 for the chosen vehicle, in the first paint rather than one round trip later.
            'fitmentCount' => $vehicle === null ? null : $this->count->forVehicle($vehicle),
            'promises' => $this->promises($blocks),
            'popular' => $this->popular($vehicleId),
            // No wheel on sale at all — a test environment reset to an empty shop: the selector says so.
            'shopEmpty' => ! WheelModel::query()->onSale()->exists(),
            'recentlyViewed' => $this->cards->catalogue(
                limit: 12,
                options: ['modelIds' => $this->recentlyViewed->ids($request->session())],
            ),
            'sizes' => $this->sizes($vehicleId),
            'brands' => $this->brands(),
            // The dark band turns its illustration again, as before #9 (PROTECTED.md P6): the client's reply of 29.10.2026,
            // „Just return the old picture. We currently don't have any good pictures.“ (D-346).
            'komplettrad' => ['tyre' => $this->featuredTyre(), 'wheel' => null],
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
            // Only a demo row on show counts — and none can be (the review release §2).
            'demo' => WheelModel::query()->where('is_demo', true)->where('status', CatalogueStatus::Published->value)->exists(),
        ]);
    }

    /**
     * The hero's values: the photographed wheel's, as its document states them for the size stamped on it — so the KBA
     * number is that stamp's (the client's #4: no product query). Null where the photograph's record names none.
     *
     * @param  array{stamp: string|null, facts: array<string, int|float>|null}  $photo
     * @return array{width: string, diameter: string, et: string, boltPattern: string, centreBore: string, kba: string|null, maxLoad: string|null, specLine: string}|null
     */
    private function photoFacts(array $photo): ?array
    {
        $f = $photo['facts'];

        if ($f === null || ! isset($f['width_in'], $f['diameter_in'], $f['et_mm'], $f['bolt_holes'], $f['bolt_circle_mm'], $f['centre_bore_mm'])) {
            return null;
        }

        return self::facts(
            (float) $f['width_in'],
            (float) $f['diameter_in'],
            (int) $f['et_mm'],
            (int) $f['bolt_holes'],
            (float) $f['bolt_circle_mm'],
            (float) $f['centre_bore_mm'],
            isset($f['max_load_kg']) ? (int) $f['max_load_kg'] : null,
            $photo['stamp'],
        );
    }

    /**
     * One wheel's values, each formatted once, here (ACCURACY.md §4).
     *
     * @return array{width: string, diameter: string, et: string, boltPattern: string, centreBore: string, kba: string|null, maxLoad: string|null, specLine: string}
     */
    private static function facts(float $width, float $diameter, int $et, int $holes, float $circle, float $bore, ?int $maxLoadKg, ?string $kba): array
    {
        $boltPattern = GermanFormat::boltPattern($holes, $circle);
        $centreBore = GermanFormat::millimetres($bore);
        $maxLoad = $maxLoadKg === null ? null : GermanFormat::kilograms($maxLoadKg);

        $line = [
            GermanFormat::rimSize($width, $diameter),
            GermanFormat::offset($et),
            'LK'.GermanFormat::NBSP.$boltPattern,
            'MLB'.GermanFormat::NBSP.$centreBore,
        ];

        if ($maxLoad !== null) {
            $line[] = 'Traglast'.GermanFormat::NBSP.$maxLoad;
        }

        return [
            'width' => GermanFormat::rimWidth($width),
            'diameter' => GermanFormat::trimmedDecimal($diameter, 1),
            'et' => GermanFormat::offset($et),
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
     * The shelf (the client's #5, „please show 8 rims“; D-353): eight rims — what sold in the last 90 days first, then
     * the team's picks (Inhalte › Meistgekaufte Felgen), then the newest (HomeShelf). Its heading says only what is true:
     * „Meistgekaufte Felgen“ once a rim on it sold, „Empfohlene Felgen“ while picks lead it, else „Neu im Shop“. With a
     * vehicle the cards are that car's answer and the order only arranges them (R-13); without one they are the
     * catalogue. Null — no shelf, not an empty one — while fewer than four wheels are on sale.
     *
     * @return array{title: string, ranking: string, cards: list<array<string, mixed>>, total: int|null}|null
     */
    private function popular(?int $vehicleId): ?array
    {
        if (WheelModel::query()->onSale()->count() < self::SHELF_MIN) {
            return null;
        }

        $total = null;

        if ($vehicleId !== null) {
            $result = $this->cards->forVehicle($vehicleId, [], 24, 1);
            $shelf = $this->shelf->arrange($this->newestFirst($result['cards']));
            $total = $result['total'];
        } else {
            $shelf = $this->shelf->catalogue();
        }

        [$ranking, $title] = match (true) {
            in_array(HomeShelf::SOLD, $shelf['sources'], true) => ['meistgekauft', self::BESTSELLING_LABEL],
            in_array(HomeShelf::PICKED, $shelf['sources'], true) => ['empfohlen', self::RECOMMENDED_LABEL],
            default => ['neu', self::NEWEST_LABEL],
        };

        return ['title' => $title, 'ranking' => $ranking, 'cards' => $shelf['cards'], 'total' => $total];
    }

    /**
     * A car's cards, the newest models first — the order the shelf fills from once sales and picks have their places.
     *
     * @param  list<array<string, mixed>>  $cards
     * @return list<array<string, mixed>>
     */
    private function newestFirst(array $cards): array
    {
        $ids = array_values(array_unique(array_map(static fn (array $card): int => (int) $card['modelId'], $cards)));
        $created = DB::table('wheel_models')->whereIn('id', $ids)->pluck('created_at', 'id');

        usort($cards, static fn (array $a, array $b): int => strcmp(
            (string) ($created[(int) $b['modelId']] ?? ''),
            (string) ($created[(int) $a['modelId']] ?? ''),
        ));

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
     * The brand wall: every wheel brand (`brands.is_wheel_brand`) — with its logo, stock or not —
     * and, besides, any brand that has a published model with an in-stock configuration, so a
     * database whose flags were never set lists nothing less. A tyre brand without a wheel is not
     * on the wall.
     *
     * `count` is the number of published models with an in-stock configuration and may be 0.
     * `href` is the listing link only when there is something to list: a brand tile leading to an
     * empty listing reads as a broken site, so a brand without stock is not a link (null), and the
     * wall greys it and says so. The menu, the counters and the search keep their own gate — a
     * published model with stock — and are unchanged.
     *
     * `logo` is the processed one-colour mask and `logoAspect` its own width / height, both from
     * BrandLogos: either the file is there and could be measured, or both are null and the wall
     * sets the name instead (home-brands.md §4.2).
     *
     * @return list<array{name: string, slug: string, logo: string|null, logoAspect: float|null, count: int, href: string|null}>
     */
    private function brands(): array
    {
        // Per brand, its published models that a customer can buy right now.
        $stocked = DB::table('wheel_models as wm')
            ->join('wheel_configs as wc', 'wc.wheel_model_id', '=', 'wm.id')
            ->whereNull('wm.deleted_at')
            ->whereNull('wc.deleted_at')
            ->where('wm.status', CatalogueStatus::Published->value)
            // Available or not, never a count (D-299).
            ->where('wc.available', true)
            ->groupBy('wm.brand_id')
            ->select(['wm.brand_id', DB::raw('COUNT(DISTINCT wm.id) as models')]);

        $rows = DB::table('brands as br')
            ->leftJoinSub($stocked, 'st', 'st.brand_id', '=', 'br.id')
            ->whereNull('br.deleted_at')
            ->where(function (QueryBuilder $listed): void {
                $listed->where('br.is_wheel_brand', true)->orWhereNotNull('st.brand_id');
            })
            ->orderBy('br.sort_order')
            ->orderBy('br.id')
            ->get(['br.name', 'br.slug', 'br.logo_path', DB::raw('COALESCE(st.models, 0) as models')]);

        $out = [];

        foreach ($rows as $row) {
            $slug = (string) $row->slug;
            $logo = BrandLogos::resolve($slug, is_string($row->logo_path) ? $row->logo_path : null);
            $count = (int) $row->models;

            $out[] = [
                'name' => (string) $row->name,
                'slug' => $slug,
                'logo' => $logo === null ? null : $logo['url'],
                'logoAspect' => $logo === null ? null : $logo['aspect'],
                'count' => $count,
                'href' => $count > 0 ? '/felgen?marke='.rawurlencode($slug) : null,
            ];
        }

        return $out;
    }

    /**
     * The tyre whose EU label the Kompletträder band shows: the first available tyre (D-301) carrying a
     * complete label that is verified against its EPREL entry — the snow and ice pictograms answered
     * too (D-302). No verified label data, no label — never a drawn one, and never values typed in
     * from memory (ACCURACY.md D7).
     *
     * @return array<string, mixed>|null
     */
    private function featuredTyre(): ?array
    {
        $row = DB::table('tyre_variants as t')
            ->join('brands as br', 'br.id', '=', 't.brand_id')
            ->whereNull('t.deleted_at')
            ->where('t.available', true)
            ->whereNotNull('t.eprel_id')
            ->where('t.eprel_id', '<>', '')
            ->whereNotNull('t.eu_fuel_class')
            ->whereNotNull('t.eu_wet_grip_class')
            ->whereNotNull('t.eu_noise_db')
            ->whereNotNull('t.eu_noise_class')
            ->whereNotNull('t.eu_snow_grip')
            ->whereNotNull('t.eu_ice_grip')
            ->orderBy('t.id')
            ->first(['t.name', 'br.name as brand', 't.width_mm', 't.aspect', 't.diameter_in', 't.load_index', 't.speed_symbol', 't.eu_fuel_class', 't.eu_wet_grip_class', 't.eu_noise_db', 't.eu_noise_class', 't.eu_snow_grip', 't.eu_ice_grip', 't.eprel_id']);

        if ($row === null) {
            return null;
        }

        return [
            'title' => $row->brand.' '.$row->name.' '.GermanFormat::tyreSize((int) $row->width_mm, (int) $row->aspect, (float) $row->diameter_in, (int) $row->load_index, (string) $row->speed_symbol),
            'fuel' => (string) $row->eu_fuel_class,
            'wet' => (string) $row->eu_wet_grip_class,
            'noiseDb' => (int) $row->eu_noise_db,
            'noiseClass' => (string) $row->eu_noise_class,
            'snowGrip' => (bool) $row->eu_snow_grip,
            'iceGrip' => (bool) $row->eu_ice_grip,
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
     * The homepage's content blocks, keyed by type — the live words, or the draft in a preview.
     *
     * @return array<string, array<string, mixed>>
     */
    private function blocks(): array
    {
        $blocks = [];

        foreach ($this->content->page(Page::HOME_SLUG)['blocks'] ?? [] as $block) {
            $blocks[$block['type']] = $block['data'];
        }

        return $blocks;
    }

    private function vehicleId(Request $request): ?int
    {
        $raw = $request->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
    }
}
