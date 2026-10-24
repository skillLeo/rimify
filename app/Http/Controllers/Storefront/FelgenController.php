<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\MixedOffer;
use App\Domain\Fitment\Tyres\MixedPair;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionGroups;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Enums\ApprovalKind;
use App\Enums\CatalogueStatus;
use App\Enums\TyreSeason;
use App\Http\Controllers\Controller;
use App\Models\BalanceWeightColour;
use App\Models\Brand;
use App\Models\CatalogueGapEvent;
use App\Models\Review;
use App\Models\TyreVariant;
use App\Models\VerdictTally;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Commerce\KomplettradPricer;
use App\Services\Storage\DocumentFiles;
use App\Services\Storefront\Basket;
use App\Services\Storefront\FitmentDetail;
use App\Services\Storefront\HomeStats;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\ProductJsonLd;
use App\Services\Storefront\RecentlyViewed;
use App\Services\Storefront\VehicleTree;
use App\Support\GermanFormat;
use App\Support\LinePrice;
use App\Support\Money;
use App\Support\Shipping;
use App\Support\ShopPath;
use App\Support\WheelTitle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The selector, the listing and the product page.
 *
 * All three are the same idea at three resolutions: what is legally permitted on THIS car. The
 * listing without a vehicle is deliberately a weaker page than the listing with one, and it says
 * so rather than pretending the whole catalogue fits every car.
 */
class FelgenController extends Controller
{
    /** What one click on `Als Komplettrad in den Warenkorb` adds: a set of four. */
    private const SET_OF = 4;

    /** The Komplettrad of a size marked „Nicht verfügbar“ (D-304): not the refusals that offer the rim alone. */
    public const RIM_NOT_AVAILABLE = 'RIM_NOT_AVAILABLE';

    public const RIM_NOT_AVAILABLE_SENTENCE = 'Diese Größe ist zurzeit nicht verfügbar, auch nicht als Komplettrad.';

    /** The amounts the product page offers beside the price, four preselected (#17); each priced by LinePrice. */
    public const AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8];

    public function __construct(
        private readonly ProductCards $cards,
        private readonly VehicleTree $tree,
        private readonly ListingQuery $listing,
        private readonly FitmentResolver $resolver,
        private readonly RecentlyViewed $recentlyViewed,
        private readonly TyreEligibility $eligibility,
        private readonly KomplettradPricer $pricer,
        private readonly SpeedSymbolDeriver $speedSymbol,
        private readonly FitmentDetail $detail,
    ) {}

    /**
     * The vehicle selector: make → model → variant, or the two key numbers. A page that sends the visitor here to choose
     * a car and wants them back names itself in `zurueck` (the compare table): a path of this shop only (ShopPath),
     * carried through every drill step and into the choice, which then returns there instead of opening the listing.
     */
    public function suchen(Request $request): Response
    {
        $make = $request->string('marke')->toString();
        $model = $request->string('modell')->toString();

        return Inertia::render('FelgenSuchen/Index', [
            'makes' => $this->tree->makes(),
            'selectedMake' => $make === '' ? null : $make,
            'selectedModel' => $model === '' ? null : $model,
            'models' => $make === '' ? [] : $this->tree->models($make),
            'variants' => ($make === '' || $model === '') ? [] : $this->tree->variants($make, $model),
            'returnTo' => ShopPath::of($request->query('zurueck')),
        ]);
    }

    /** Cards per listing page. The page's pager derives its page count from the same number. */
    private const PER_PAGE = 24;

    /** The listing's last filters, for the vehicle choice to land on (#27, D-118). */
    public const FILTERS_SESSION = 'listing_filters';

    /**
     * A filter state as an address writes it — `zoll=19.0`, `marke=BORBET`, several values joined by commas — the form
     * the homepage's tiles and the menu use, which filters() reads back as it is. The listing a car is chosen onto
     * (#27) keeps a readable address to save and share (#8), never `zoll%5B0%5D=19.0`. A value that holds a comma
     * itself keeps the list form, so it is never split.
     *
     * @param  array<string, mixed>  $filters  as filters() returns them
     * @return array<string, string|list<string>>
     */
    public static function listingQuery(array $filters): array
    {
        $query = [];

        foreach ($filters as $facet => $value) {
            if ($value === true) {
                $query[$facet] = '1';

                continue;
            }

            $values = array_values(array_map(static fn (mixed $v): string => is_scalar($v) ? (string) $v : '', is_array($value) ? $value : [$value]));
            $query[$facet] = array_filter($values, static fn (string $v): bool => str_contains($v, ',')) === [] ? implode(',', $values) : $values;
        }

        return $query;
    }

    /** The listing. With a vehicle it is a compliance answer; without one it is a catalogue. */
    public function index(Request $request): Response|RedirectResponse
    {
        $vehicleId = $this->vehicleId($request);
        $filters = $this->filters($request);

        // One filter state across the shop (the client's #27, D-118): the listing's last filters are remembered, so
        // choosing a car — on this page, the homepage or the vehicle page — lands on the same selection for that car.
        $request->session()->put(self::FILTERS_SESSION, $filters);

        if ($vehicleId === null) {
            return Inertia::render('Felgen/Index', [
                'hasVehicle' => false,
                // The whole catalogue, narrowed by the same facets a car's listing has (the client's #30, D-118).
                // This page has no pager without a vehicle and states the number of cards it shows as the size
                // of the range, so a cap here hid a product and made "24 Felgen im Sortiment" untrue.
                'cards' => $this->cards->catalogue(limit: null, options: ['filters' => $filters]),
                'total' => null,
                // What the filters narrowed from, said beside what they left (EIGENE-FUNDE 128: „0 von 44 Felgen“).
                'unfiltered' => $filters === [] ? null : count($this->cards->catalogue(limit: null, options: ['filters' => []])),
                'facets' => $this->cards->catalogueFacets($filters),
                // „Ohne Eintragung“ is a statement about a car: without one it is neither offered nor applied.
                'filters' => array_diff_key($filters, ['ohne_eintragung' => true]),
                'demo' => $this->demo(),
                'acceptance' => $this->acceptance(),
            ]);
        }

        $page = max(1, $request->integer('seite', 1));
        $result = $this->cards->forVehicle($vehicleId, $filters, perPage: self::PER_PAGE, page: $page);
        $lastPage = max(1, (int) ceil($result['total'] / self::PER_PAGE));

        // A page past the end is not "no wheels for this car". Rendering it empty told the
        // customer exactly that — with no pager to get back — so it goes to the last real page.
        if ($page > $lastPage) {
            $query = $request->query();
            unset($query['seite']);

            if ($lastPage > 1) {
                $query['seite'] = $lastPage;
            }

            return redirect()->route('felgen.index', $query);
        }

        // An empty listing with no filters applied is a catalogue gap, not a filter mistake — and
        // it is the case that turns a silent lost sale into a ranked shopping list of documents.
        if ($result['total'] === 0 && $filters === []) {
            CatalogueGapEvent::record(
                reasonCode: VerdictReason::NO_DOCUMENT,
                surface: 'plp',
                vehicleId: $vehicleId,
            );
        }

        return Inertia::render('Felgen/Index', [
            'hasVehicle' => true,
            'cards' => $result['cards'],
            'total' => $result['total'],
            'unfiltered' => $filters === [] ? null : $this->cards->forVehicle($vehicleId, [], perPage: 1, page: 1)['total'],
            // Counts carry the OTHER filters but not the facet's own, so "18 Zoll (312)" means
            // "312 results if you add this" rather than a number that only holds in isolation.
            'facets' => $this->listing->facets($vehicleId, $filters),
            'filters' => $filters,
            'page' => $page,
            'demo' => $this->demo(),
            'acceptance' => $this->acceptance(),
            // What of the car the page's answers wait for, asked for by name the moment the car is chosen (§1.1).
            'missing' => $result['missing'],
            // The fields of the car's papers its tyres wait for (D-286): asked once, for every wheel on the page.
            'owed' => $result['owed'],
        ]);
    }

    /**
     * Whether seeded demonstration rows are on the page, so it can say so (OVERHAUL.md §2). The
     * flag leaves with the rows before launch.
     */
    private function demo(): bool
    {
        return WheelModel::query()->where('is_demo', true)->where('status', CatalogueStatus::Published->value)->exists();
    }

    /**
     * Whether the demo wheels on the page are the acceptance set, sold here with the test payment (`rimify:demo
     * --abnahme`, D-185): the listing then says that, as the product page does — never „bestellen kannst du noch nicht“
     * above wheels that can be ordered.
     */
    private function acceptance(): bool
    {
        return WheelModel::query()->onSale()->where('is_demo', true)->exists();
    }

    /**
     * The product page. One model, its finishes, its configurations — only a published one: a draft,
     * an archived model or a demonstration row is not in the shop and answers 404, whoever knows its
     * address (the table itself refuses a published demo row).
     */
    public function show(Request $request, string $model): Response
    {
        $wheel = WheelModel::query()
            ->with(['brand', 'finishes', 'configs'])
            ->where('slug', $model)
            ->where('status', CatalogueStatus::Published->value)
            ->firstOrFail();

        $this->recentlyViewed->record($request->session(), (int) $wheel->id);

        $vehicleId = $this->vehicleId($request);
        $configs = [];
        $anyUnknown = false;

        // Every configuration of the wheel decided in one call: the engine reads the rows once.
        $verdicts = $vehicleId === null
            ? []
            : $this->resolver->resolveMany($vehicleId, $wheel->configs->pluck('id')->map(static fn (mixed $id): int => (int) $id)->values()->all());

        // Every size checked against the chosen car is one Prüfung on the Übersicht's chart:
        // counted by state, nothing else kept.
        VerdictTally::record('pdp', array_map(static fn (FitmentVerdict $verdict): VerdictStatus => $verdict->status, array_values($verdicts)));

        // The Komplettrad's Wuchtgewichte (§4.1, #15): the admin's default colour is the one preselected, and every active
        // colour is offered on the page, each set priced with it; read once for the whole page, and only where an offer
        // could be made at all.
        $colour = $vehicleId === null ? null : BalanceWeightColour::default();
        $colours = $colour === null ? collect() : BalanceWeightColour::query()->active()->orderBy('sort_order')->orderBy('id')->get();

        foreach ($wheel->configs as $config) {
            $verdict = $verdicts[$config->id] ?? null;
            $row = $this->configRow($config, $verdict, $colour, $colours);

            // Not a wheel approved with its tyres unconfirmed (finding 103, D-286): its Gutachten is held, and counting it
            // would rank a document we have on the Übersicht's list of documents to buy.
            if ($verdict?->status === VerdictStatus::Unknown && ! $verdict->tyreUnconfirmed()) {
                $anyUnknown = true;
            }

            $configs[] = $row;
        }

        // A model we hold no document for, on a car the customer has chosen, is the single most
        // useful thing this business can learn: it names a Gutachten worth buying, ranked by how
        // often real customers ask for it.
        if ($anyUnknown && $vehicleId !== null) {
            CatalogueGapEvent::record(
                reasonCode: VerdictReason::NO_DOCUMENT,
                surface: 'pdp',
                vehicleId: $vehicleId,
            );
        }

        return $this->renderProduct($request, $wheel, $configs, $vehicleId, $colours);
    }

    /**
     * One size of a wheel as the product page — and the RIMIFY-Check (#28) — ships it: price, stock and the verdict
     * for the chosen car together, with the Komplettrad and Mischbereifung offers that depend on that verdict.
     *
     * @param  Collection<int, BalanceWeightColour>  $colours
     * @return array<string, mixed>
     */
    private function configRow(WheelConfig $config, ?FitmentVerdict $live, ?BalanceWeightColour $colour, Collection $colours): array
    {
        $verdict = $live === null ? null : $this->verdictFor($live);

        // The hump designation the wheel's own approval prints in its size line ("8½ J x 19
        // H2"). Empty is the same as absent: the details then show no Hump row rather than a
        // blank one, because a record that holds no designation makes no claim about one.
        $hump = is_string($config->hump) ? trim($config->hump) : '';

        return [
            // Price, stock and verdict arrive together in one payload, so selecting a size
            // changes all three in ONE commit. A page where the price updates a frame before
            // the legal answer has, for that frame, told the customer something untrue.
            'verdict' => $verdict,
            'id' => $config->id,
            'finishId' => $config->wheel_finish_id,
            'sku' => $config->sku,
            'diameterIn' => (float) $config->diameter_in,
            'widthIn' => (float) $config->width_in,
            'etMm' => (int) $config->et_mm,
            'sizeLabel' => GermanFormat::wheelSize(
                (float) $config->width_in,
                (float) $config->diameter_in,
                (int) $config->et_mm,
            ),
            'fullLabel' => GermanFormat::wheelLabel(
                (float) $config->width_in,
                (float) $config->diameter_in,
                (int) $config->et_mm,
                (int) $config->bolt_holes,
                (float) $config->bolt_circle_mm,
                (float) $config->centre_bore_mm,
            ),
            'boltPattern' => GermanFormat::boltPattern((int) $config->bolt_holes, (float) $config->bolt_circle_mm),
            // The rim's own bore, and it is labelled as the rim's own on the page: the bore a
            // document states for the chosen car travels inside the verdict instead (§1, R-06).
            'centreBore' => GermanFormat::millimetres((float) $config->centre_bore_mm),
            'hump' => $hump === '' ? null : $hump,
            // `price_cents` is ONE rim (docs/specs/komplettrad.md §9, D-102); the set of four is
            // computed by LinePrice and formatted here, so the page never multiplies cents (R-10).
            'priceCents' => (int) $config->price_cents,
            'price' => $this->rimPrice($config)->format(),
            'priceForFour' => LinePrice::total($this->rimPrice($config), self::SET_OF)->format(),
            // The figure for every amount the page offers, so the browser only picks one (D-102).
            'amounts' => LinePrice::byQuantity($this->rimPrice($config), self::AMOUNTS),
            // Available or not (his admin item 7, D-299): no count, so the amount a customer picks is never capped by one.
            'inStock' => $config->available,
            'kbaNumber' => $config->kba_number,
            'weightG' => $config->weight_g === null ? null : (int) $config->weight_g,
            // The load rating per wheel, from the approval document; null when nobody has
            // verified one, and the page then shows no row (ACCURACY.md D2).
            'maxLoadKg' => $this->maxLoadKg($config->getAttribute('max_load_kg')),
            // The Komplettrad offer travels with the verdict it depends on, for the same
            // reason: a size change swaps the tyres and the legal answer in one commit.
            'komplettrad' => $this->komplettradFor($config, $live, $colour, $colours),
            // Mischbereifung (#20, D-105): only where the released Gutachten prints its pairing table.
            'mischbereifung' => $this->mischbereifungFor($config, $live, $colour, $colours),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $configs
     * @param  Collection<int, BalanceWeightColour>  $colours
     */
    private function renderProduct(Request $request, WheelModel $wheel, array $configs, ?int $vehicleId, Collection $colours): Response
    {
        $finishes = [];

        foreach ($wheel->finishes as $finish) {
            $finishes[] = [
                'id' => $finish->id,
                'name' => $finish->name_de,
                'hex' => $finish->hex,
                'artFinish' => $finish->art_finish,
                // The finish's own studio photograph with its other angles, or null: the page then
                // draws the wheel rather than borrow another finish's picture.
                'image' => $finish->image_manifest,
            ];
        }

        $finishes = $this->openingFinishFirst($finishes, $configs, $request->integer('ausfuehrung'));
        $jsonLd = ProductJsonLd::for($wheel, url('/felgen/'.$wheel->slug));

        return Inertia::render('Produkt/Index', [
            'product' => [
                'modelId' => $wheel->id,
                'slug' => $wheel->slug,
                // What follows the brand in the wheel's name: model and Radtypenbezeichnung, or the title typed (D-298).
                'modelName' => WheelTitle::name($wheel),
                'brandName' => $wheel->brand->name,
                'typeDesignation' => $wheel->type_designation,
                'descriptionDe' => $wheel->description_de,
                'spokes' => $wheel->spoke_count,
                'rating' => $wheel->rating,
                'ratingCount' => $wheel->rating_count,
                'ratingLabel' => $wheel->rating === null
                    ? null
                    : GermanFormat::rating($wheel->rating, $wheel->rating_count),
                // GPSR: the brand's manufacturer as entered in Katalog › Marken, or null (the page then says so).
                'manufacturer' => $wheel->brand->manufacturer(),
                // While it has no reviews, what the page can prove instead (#19, D-103): its documents and the cars.
                'proof' => app(HomeStats::class)->forModel($wheel->id),
            ],
            // The buyers' visible reviews, newest first (D-103); the rating above is computed from them alone.
            'reviews' => Review::query()->visible()->where('wheel_model_id', $wheel->id)->orderByDesc('id')->limit(20)->get()
                ->map(static fn (Review $review): array => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'body' => $review->body,
                    'at' => GermanFormat::date($review->created_at),
                    'reply' => $review->reply,
                ])->all(),
            'finishes' => $finishes,
            'configs' => $configs,
            'hasVehicle' => $vehicleId !== null,
            // A seeded demonstration model: the page shows "Beispielsortiment" rather than "Auf
            // Lager" and says it cannot be ordered yet. The basket stays walkable; the checkout
            // refuses the order on the server (ACCURACY.md D4). The acceptance set's is sold with the test payment,
            // off production, and says that it is demo data (`acceptance`).
            'demo' => $wheel->refusedAsDemo(),
            'acceptance' => (bool) $wheel->is_demo && ! $wheel->refusedAsDemo(),
            // Delivery time and shipping, as Einstellungen › Verkäufer & Versand gives them; null while nothing is.
            'shipping' => Shipping::current()->summary(),
            'komplettradOptions' => $this->komplettradOptions($request, $colours),
        ])->withViewData([
            // For search engines, in the document's head only — never a prop the page carries (ProductJsonLd, D-305).
            'productJsonLd' => $jsonLd === null ? null : ProductJsonLd::encode($jsonLd),
        ]);
    }

    /**
     * The RIMIFY-Check's answer (#28): one size of one wheel for the car the visitor has chosen — the very row the product
     * page ships, built by the same code, so the two pages can never disagree — and what goes with a Komplettrad.
     *
     * @return array{config: array<string, mixed>, komplettradOptions: array<string, mixed>|null}
     */
    public function answerFor(Request $request, WheelConfig $config): array
    {
        $vehicleId = $this->vehicleId($request);
        $live = $vehicleId === null ? null : ($this->resolver->resolveMany($vehicleId, [(int) $config->id])[(int) $config->id] ?? null);

        if ($live !== null) {
            VerdictTally::record('check', [$live->status]);
        }

        $colour = $vehicleId === null ? null : BalanceWeightColour::default();
        $colours = $colour === null ? collect() : BalanceWeightColour::query()->active()->orderBy('sort_order')->orderBy('id')->get();

        return [
            'config' => $this->configRow($config, $live, $colour, $colours),
            'komplettradOptions' => $this->komplettradOptions($request, $colours),
        ];
    }

    /**
     * What goes with a Komplettrad (#15): the Wuchtgewichte colours the admin keeps active, and the RDKS question for a
     * set, priced for the car's make — the basket's own block, so the checkout finds it answered. Null without a car.
     *
     * @param  Collection<int, BalanceWeightColour>  $colours
     * @return array<string, mixed>|null
     */
    private function komplettradOptions(Request $request, Collection $colours): ?array
    {
        return $colours->isEmpty() ? null : [
            'colours' => $colours->map(static fn (BalanceWeightColour $c): array => [
                'id' => (int) $c->id,
                'name' => $c->name_de,
                'swatchHex' => $c->swatch_hex,
                'surchargeCents' => (int) $c->surcharge_cents,
                'surcharge' => GermanFormat::money((int) $c->surcharge_cents, $c->currency),
                'isDefault' => (bool) $c->is_default,
            ])->values()->all(),
            'tpms' => app(Basket::class)->tpmsOffer($request, self::SET_OF),
        ];
    }

    /** One rim's price in its own currency (the shop's, EUR, where a row names none). */
    private function rimPrice(WheelConfig $config): Money
    {
        $currency = $config->getAttribute('currency');

        return Money::fromMinor((int) $config->price_cents, is_string($currency) && $currency !== '' ? $currency : 'EUR');
    }

    /** A positive whole number of kilograms, or null. */
    private function maxLoadKg(mixed $value): ?int
    {
        return is_numeric($value) && (int) $value > 0 ? (int) $value : null;
    }

    /**
     * The Komplettrad offer for one configuration: every tyre the verdict permits as a set of four,
     * priced by the one pricer the basket and the order writer use — or the one sentence saying
     * why there is none, so the page can never show an empty panel (§4.11).
     *
     * Nothing here decides whether a tyre may be fitted. `TyreEligibility` does, and the basket
     * asks it again on every add and on every render (R-13, R-11). What this method adds are the
     * storefront's own two arms — no vehicle, no active weight colour — and the prices.
     *
     * Each tyre carries its set priced with every active Wuchtgewichte colour (#15), so the page shows the figure for
     * the colour picked without adding a surcharge itself; `perWheel` and `forFour` stay the default colour's.
     *
     * @param  Collection<int, BalanceWeightColour>  $colours
     * @return array<string, mixed>
     */
    private function komplettradFor(WheelConfig $config, ?FitmentVerdict $verdict, ?BalanceWeightColour $colour, Collection $colours): array
    {
        // A size not available is not one as a Komplettrad either; the refusals below would offer the rim alone (D-304).
        if (! $config->available) {
            return $this->komplettradRefused(self::RIM_NOT_AVAILABLE, self::RIM_NOT_AVAILABLE_SENTENCE, null);
        }

        // Without a vehicle there is no verdict, so there is no permitted-size list (D-033).
        if ($verdict === null) {
            return $this->komplettradRefused(KomplettradRefusal::NoVehicle->value, KomplettradRefusal::NoVehicle->sentenceDe(), null);
        }

        $offer = $this->eligibility->offerFor($verdict);

        // Where the Gutachten lists its tyre combinations, the Komplettrad is the combination — two wheels per axle in the
        // sizes it names, never four of one size (the operator's decision of 24.10.2026 on the client's item 8, D-335).
        if ($offer->refusal === KomplettradRefusal::AsCombination) {
            return $this->komplettradAsCombinations($config, $verdict, $colour, $colours);
        }

        if ($offer->refusal !== null) {
            return $this->komplettradRefused($offer->refusal->value, $offer->refusal->sentenceDe(), $offer->minimumSentenceDe);
        }

        // No active colour means no Komplettrad can be added at all (§4.1): say so here rather
        // than let the click fail.
        if ($colour === null) {
            return $this->komplettradRefused(Basket::NO_WEIGHT_COLOUR_CODE, Basket::NO_WEIGHT_COLOUR_REFUSAL, $offer->minimumSentenceDe);
        }

        $variants = TyreVariant::query()
            ->with('brand')
            ->whereIn('id', array_map(static fn (TyreRecord $tyre): int => $tyre->id, $offer->tyres))
            ->get()
            ->keyBy('id');

        $tyres = [];
        $priceOpen = false;
        // What the answer is with each tyre (the client's #18): the Auflagen and the Eintragung of the tyre's own size, as
        // the basket line will say them — one size may need the Abnahme where another does not (ABE 55255, X3: A01 with
        // 255/40 R19 alone).
        $groups = $verdict->conditionGroups();

        foreach ($offer->tyres as $record) {
            $variant = $variants->get($record->id);

            // The page sells sets of four, so the engine is asked for exactly that quantity: a
            // tyre with one on the shelf is not offered and then refused at the click.
            if (! $variant instanceof TyreVariant || $this->eligibility->permits($verdict, $record, self::SET_OF) !== null) {
                continue;
            }

            $price = $this->pricer->perWheel($config, $variant, $colour);
            $priceOpen = $priceOpen || ! $price->complete();
            $perWheel = Money::fromMinor($price->knownPerWheelCents(), $price->currency);
            $forFour = LinePrice::total($perWheel, self::SET_OF);

            $tyres[] = [
                'id' => (int) $variant->id,
                'brandName' => (string) $variant->brand?->name,
                'name' => (string) $variant->name,
                'season' => (string) $variant->season,
                'seasonLabel' => TyreSeason::from((string) $variant->season)->longLabelDe(),
                'sizeLabel' => $variant->label(),
                'tyrePriceCents' => (int) $variant->price_cents,
                'tyrePrice' => Money::fromMinor((int) $variant->price_cents, $price->currency)->format(),
                // The known components per wheel; an unconfigured mounting fee is left out and
                // `priceOpen` says so — never a guessed number, never a silent 0,00 € (D-032).
                'perWheelCents' => $perWheel->toMinor(),
                'perWheel' => $perWheel->format(),
                'forFourCents' => $forFour->toMinor(),
                'forFour' => $forFour->format(),
                'prices' => $colours->map(function (BalanceWeightColour $c) use ($config, $variant): array {
                    $price = $this->pricer->perWheel($config, $variant, $c);
                    $perWheel = Money::fromMinor($price->knownPerWheelCents(), $price->currency);

                    return [
                        'colourId' => (int) $c->id,
                        'perWheel' => $perWheel->format(),
                        'forFourCents' => LinePrice::total($perWheel, self::SET_OF)->toMinor(),
                        'forFour' => LinePrice::total($perWheel, self::SET_OF)->format(),
                    ];
                })->values()->all(),
                'label' => Basket::euLabel($variant),
                'isDemo' => $variant->refusedAsDemo(),
                'answer' => $groups->toArray(TyreSize::keyOf((int) $variant->width_mm, (int) $variant->aspect, (float) $variant->diameter_in)),
            ];
        }

        if ($tyres === []) {
            return $this->komplettradRefused(KomplettradRefusal::NoTyreAvailable->value, KomplettradRefusal::NoTyreAvailable->sentenceDe(), $offer->minimumSentenceDe);
        }

        return [
            'refusal' => null,
            'refusalCode' => null,
            'minSentence' => $offer->minimumSentenceDe,
            'priceOpen' => $priceOpen,
            'quantity' => self::SET_OF,
            'tyres' => $tyres,
        ];
    }

    /**
     * Mischbereifung for one configuration (#20, D-105): every front/rear pair the released Gutachten's table permits
     * for this car on this rim, each with the tyre sets that meet both axles — two of each, priced by the one pricer —
     * or the sentence saying why there is none. Null where the document prints no pairing table: the page then says
     * nothing about it, because there is nothing to offer and nothing to explain.
     *
     * Nothing here decides a pair. `TyreEligibility` does, and the basket asks it again on every add and render.
     *
     * Each set carries its price in every Wuchtgewichte colour too, so the card shows what the basket will charge for
     * the colour picked above it (PDP-07).
     *
     * @param  Collection<int, BalanceWeightColour>  $colours
     * @return array<string, mixed>|null
     */
    private function mischbereifungFor(WheelConfig $config, ?FitmentVerdict $verdict, ?BalanceWeightColour $colour, Collection $colours): ?array
    {
        if ($verdict === null) {
            return null;
        }

        $offer = $this->eligibility->mixedOfferFor($verdict);

        // The Gutachten's own list of combinations is the Komplettrad itself, offered in the panel (D-335): nothing beside it.
        if (! $offer->hasTable || $offer->listed) {
            return null;
        }

        $refused = static fn (string $code, string $sentence): array => [
            'refusal' => $sentence,
            'refusalCode' => $code,
            'perAxle' => TyreEligibility::MIXED_PER_AXLE,
            'rules' => $offer->rulesDe,
            'sourcePage' => $offer->sourcePage,
            'rulesPage' => $offer->rulesPage,
            'priceOpen' => false,
            'pairs' => [],
        ];

        if ($offer->refusal !== null) {
            return $refused($offer->refusal->value, $offer->refusal->sentenceDe());
        }

        if ($colour === null) {
            return $refused(Basket::NO_WEIGHT_COLOUR_CODE, Basket::NO_WEIGHT_COLOUR_REFUSAL);
        }

        [$pairs, $priceOpen] = $this->pricedPairs($config, $verdict, $offer, $colour, $colours);

        return [
            'refusal' => null,
            'refusalCode' => null,
            'perAxle' => TyreEligibility::MIXED_PER_AXLE,
            'rules' => $offer->rulesDe,
            'sourcePage' => $offer->sourcePage,
            'rulesPage' => $offer->rulesPage,
            'priceOpen' => $priceOpen,
            'pairs' => $pairs,
        ];
    }

    /**
     * The Komplettrad where the Gutachten lists its tyre combinations (the operator's decision of 24.10.2026 on the
     * client's item 8, D-335): every combination the car's row carries, each as two wheels per axle in the sizes it
     * names — 2 + 2, fixed —, with the sets the shop sells for it and, for each axle, its Auflagen under its name. A
     * combination the shop has no tyre for on one axle says so and has no set: nothing fills the gap, and the rim alone
     * stays buyable. Nothing here decides — the engine offers, and the basket asks it again on the add (R-11, R-13).
     *
     * @param  Collection<int, BalanceWeightColour>  $colours
     * @return array<string, mixed>
     */
    private function komplettradAsCombinations(WheelConfig $config, FitmentVerdict $verdict, ?BalanceWeightColour $colour, Collection $colours): array
    {
        $offer = $this->eligibility->mixedOfferFor($verdict);

        if ($offer->refusal !== null) {
            return $this->komplettradRefused($offer->refusal->value, $offer->refusal->sentenceDe(), null);
        }

        if ($colour === null) {
            return $this->komplettradRefused(Basket::NO_WEIGHT_COLOUR_CODE, Basket::NO_WEIGHT_COLOUR_REFUSAL, null);
        }

        [$combinations, $priceOpen] = $this->pricedPairs($config, $verdict, $offer, $colour, $colours);

        return [
            'refusal' => null,
            'refusalCode' => null,
            'minSentence' => null,
            'priceOpen' => $priceOpen,
            'quantity' => self::SET_OF,
            'tyres' => [],
            'perAxle' => TyreEligibility::MIXED_PER_AXLE,
            // The list's page, where the customer finds „Kombination Nr. 2“ in the PDF.
            'sourcePage' => $offer->sourcePage,
            'combinations' => $combinations,
        ];
    }

    /**
     * The pairs of an offer as the page shows them (#20, D-105; D-335): each with its sets priced two per axle by the one
     * pricer, in every active Wuchtgewichte colour, with each tyre's EU label; why a pair has no set — the axle we have
     * no tyre for, by name —; and its Auflagen for each axle under the axle's name (ConditionGroups, as each size's are
     * under its own, D-199), the Eintragung the set as a whole needs. Nothing here decides a pair.
     *
     * @param  Collection<int, BalanceWeightColour>  $colours
     * @return array{0: list<array<string, mixed>>, 1: bool}
     */
    private function pricedPairs(WheelConfig $config, FitmentVerdict $verdict, MixedOffer $offer, BalanceWeightColour $colour, Collection $colours): array
    {
        $ids = [];

        foreach ($offer->pairs as $pair) {
            foreach ($pair->sets as $set) {
                $ids[] = $set['front']->id;
                $ids[] = $set['rear']->id;
            }
        }

        $variants = TyreVariant::query()->with('brand')->whereIn('id', array_values(array_unique($ids)))->get()->keyBy('id');
        $groups = $verdict->conditionGroups();
        $priceOpen = false;
        $pairs = [];

        foreach ($offer->pairs as $pair) {
            $sets = [];

            foreach ($pair->sets as $set) {
                $front = $variants->get($set['front']->id);
                $rear = $variants->get($set['rear']->id);

                if (! $front instanceof TyreVariant || ! $rear instanceof TyreVariant) {
                    continue;
                }

                $frontPrice = $this->pricer->perWheel($config, $front, $colour);
                $rearPrice = $this->pricer->perWheel($config, $rear, $colour);
                $priceOpen = $priceOpen || ! $frontPrice->complete() || ! $rearPrice->complete();
                $frontWheel = Money::fromMinor($frontPrice->knownPerWheelCents(), $frontPrice->currency);
                $rearWheel = Money::fromMinor($rearPrice->knownPerWheelCents(), $rearPrice->currency);
                $forFour = LinePrice::total($frontWheel, TyreEligibility::MIXED_PER_AXLE)->plus(LinePrice::total($rearWheel, TyreEligibility::MIXED_PER_AXLE));

                $sets[] = [
                    'key' => $front->id.'-'.$rear->id,
                    'frontTyreId' => (int) $front->id,
                    'rearTyreId' => (int) $rear->id,
                    'brandName' => (string) $front->brand?->name,
                    'name' => (string) $front->name,
                    // Two profile types, or two makers, where the document allows it (D-336): the page names each axle's tyre.
                    'rearBrandName' => (string) $rear->brand?->name,
                    'rearName' => (string) $rear->name,
                    'seasonLabel' => TyreSeason::from((string) $front->season)->longLabelDe(),
                    'frontLabel' => $front->label(),
                    'rearLabel' => $rear->label(),
                    'perWheelFront' => $frontWheel->format(),
                    'perWheelRear' => $rearWheel->format(),
                    'forFourCents' => $forFour->toMinor(),
                    'forFour' => $forFour->format(),
                    'prices' => $colours->map(function (BalanceWeightColour $c) use ($config, $front, $rear): array {
                        $frontPrice = $this->pricer->perWheel($config, $front, $c);
                        $rearPrice = $this->pricer->perWheel($config, $rear, $c);
                        $frontWheel = Money::fromMinor($frontPrice->knownPerWheelCents(), $frontPrice->currency);
                        $rearWheel = Money::fromMinor($rearPrice->knownPerWheelCents(), $rearPrice->currency);
                        $forFour = LinePrice::total($frontWheel, TyreEligibility::MIXED_PER_AXLE)->plus(LinePrice::total($rearWheel, TyreEligibility::MIXED_PER_AXLE));

                        return [
                            'colourId' => (int) $c->id,
                            'perWheelFront' => $frontWheel->format(),
                            'perWheelRear' => $rearWheel->format(),
                            'forFourCents' => $forFour->toMinor(),
                            'forFour' => $forFour->format(),
                        ];
                    })->values()->all(),
                    // Each tyre's EU label near its price (Regulation (EU) 2020/740, D-303) — one tyre on both axles, one label.
                    'frontEu' => Basket::euLabel($front),
                    'rearEu' => (int) $rear->id === (int) $front->id ? null : Basket::euLabel($rear),
                    'isDemo' => $front->refusedAsDemo() || $rear->refusedAsDemo(),
                ];
            }

            $pairs[] = [
                'key' => $pair->pairing->key(),
                'number' => $pair->pairing->number,
                'front' => $pair->front->labelDe(),
                'rear' => $pair->rear->labelDe(),
                'sameSize' => $pair->pairing->sameSize(),
                'minSentence' => $pair->minimumSentenceDe(),
                // Why there is no set: the axle we have no tyre for, by name — never another size in its stead (D-335).
                'noSet' => $pair->noSetSentenceDe(),
                'answer' => self::pairAnswer($pair, $groups, $verdict->requiresEntry),
                'sets' => $sets,
            ];
        }

        return [$pairs, $priceOpen];
    }

    /**
     * The Auflagen of a set per axle as ConditionGroups.vue says them (D-335): the combination's once, then each axle
     * under its name with its size's own. One size on both axles is one group, „Vorder- und Hinterachse“, holding all of
     * it — never „Für beide Achsen“ above a second group for the same axles. `entry` is the set's: the Eintragung is
     * needed where either axle's size needs it, for both are fitted.
     *
     * @return array{combination: list<string>, sizes: list<array{size: string, axle: string, conditions: list<string>, entry: bool}>, chosen: null, entry: bool, perAxle: true}
     */
    private static function pairAnswer(MixedPair $pair, ConditionGroups $groups, bool $requiresEntry): array
    {
        $sentences = static fn (array $list): array => array_values(array_map(static fn (Condition $c): string => $c->sentenceDe(), $list));
        $axle = static fn (TyreSize $size, string $name, array $conditions): array => [
            'size' => $size->labelDe(),
            'axle' => $name,
            'conditions' => $sentences($conditions),
            'entry' => $groups->entryFor($size->key(), $requiresEntry),
        ];
        $same = $pair->pairing->sameSize();
        $axles = $same
            ? [$axle($pair->front, 'Vorder- und Hinterachse', $groups->forSize($pair->front->key()))]
            : [$axle($pair->front, 'Vorderachse', $groups->ownFor($pair->front->key())), $axle($pair->rear, 'Hinterachse', $groups->ownFor($pair->rear->key()))];

        return [
            'combination' => $same ? [] : $sentences($groups->combination),
            'sizes' => $axles,
            'chosen' => null,
            'entry' => array_filter($axles, static fn (array $a): bool => $a['entry']) !== [],
            // Said per axle: „Für beide Achsen“, then „Vorderachse · 235/45 R19“ — never „Nur bei …“, both are fitted.
            'perAxle' => true,
        ];
    }

    /**
     * No offer, one sentence, and the code the page picks its route forward from. The code is
     * never rendered (R-15).
     *
     * @return array<string, mixed>
     */
    private function komplettradRefused(string $code, string $sentence, ?string $minSentence): array
    {
        return [
            'refusal' => $sentence,
            'refusalCode' => $code,
            'minSentence' => $minSentence,
            'priceOpen' => false,
            'quantity' => self::SET_OF,
            'tyres' => [],
        ];
    }

    /**
     * The product page opens on its first finish, so the first finish is the one the customer
     * came for: the finish named in the link (a listing card is one model in one finish), or else
     * one that is permitted on their car.
     *
     * Without this, the "Racing Schwarz — Passend für BMW 3er" card opened a page showing
     * Graphite matt, "Nicht freigegeben für BMW 3er" and a disabled basket button: two answers
     * about one wheel, one click apart. The order of the rest is kept (usort is stable).
     *
     * @param  list<array{id: int, name: string, hex: string|null, artFinish: string, image: array<string, mixed>|null}>  $finishes
     * @param  list<array<string, mixed>>  $configs
     * @return list<array{id: int, name: string, hex: string|null, artFinish: string, image: array<string, mixed>|null}>
     */
    private function openingFinishFirst(array $finishes, array $configs, int $requested): array
    {
        $permitted = [];

        foreach ($configs as $config) {
            $verdict = $config['verdict'] ?? null;

            if (is_array($verdict) && ($verdict['sellable'] ?? false) === true) {
                $permitted[(int) $config['finishId']] = true;
            }
        }

        $rank = static fn (array $finish): int => match (true) {
            $finish['id'] === $requested => 0,
            isset($permitted[$finish['id']]) => 1,
            default => 2,
        };

        usort($finishes, static fn (array $a, array $b): int => $rank($a) <=> $rank($b));

        return $finishes;
    }

    private function vehicleId(Request $request): ?int
    {
        $raw = $request->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
    }

    /**
     * One verdict per configuration, computed by the same engine every other surface calls (R-13).
     *
     * `NOT_PERMITTED` and `UNKNOWN` are carried separately and rendered differently. Collapsing
     * them into "no" would tell the customer something false — "we checked and your car cannot
     * have this" when the truth is "we hold no document" — and would cost RIMIFY the one signal
     * that says which Gutachten to buy next.
     *
     * @return array<string, mixed>
     */
    private function verdictFor(FitmentVerdict $verdict): array
    {
        $minimum = $this->minimum($verdict);

        return [
            'status' => $verdict->status->value,
            'label' => $verdict->displayLabelDe(),
            // Every Auflage a Hinweis (#23, D-104): the page says „Freigegeben“, quietly „mit Hinweisen“.
            'notesOnly' => $verdict->notesOnly(),
            'sellable' => $verdict->isSellable(),
            // The rim alone sells while the tyres wait for the papers, where the wheel's approval does not (D-289).
            'rimSellable' => $verdict->forRimAlone() !== null,
            'requiresEntry' => $verdict->requiresEntry,
            'entryNoteDe' => $verdict->entryNoteDe,
            // The document frees the papers from correction (§ 15 FZV, ABE 53841 point 10): its own line (PapersWording).
            'papersExempt' => $verdict->papersExempt(),
            // The Mittenlochbohrung the covering documents state for THIS car, formatted by the
            // one helper (R-10), or null where they state none or disagree. Never the rim's own
            // figure: that arrives beside it as `centreBore` and is labelled as the rim's, so the
            // two claims can never be read as one.
            'centreBore' => $verdict->documentCentreBoreMm === null
                ? null
                : GermanFormat::millimetres($verdict->documentCentreBoreMm),
            'centreBoreSource' => $verdict->centreBoreSource->value,
            // Full German sentences, never codes such as A02 (R-15). Every Auflage once, for counting; what the
            // customer reads is `conditionGroups`.
            'conditions' => array_map(
                static fn (Condition $condition): string => $condition->sentenceDe(),
                $verdict->conditions,
            ),
            // The Auflagen as the document hangs them: the combination's once, each tyre size's with that size —
            // never one list in which a size's „no chains“ stands beside another's „fine-link chains“ (ConditionGroups).
            'conditionGroups' => $verdict->conditionGroups()->toArray(),
            // The same sentences as the customer works through them — Abnahme, work on the car with its
            // millimetres, the bolts and their torque, each tyre size's axle and printed minimum, the document's
            // notes — for a wheel that may go on the car at all (Block D, item 15), and for one approved with its tyres
            // unconfirmed: its own verdict is said in full, Auflagen and all (finding 103, D-286).
            'detail' => $verdict->isSellable() || $verdict->tyreUnconfirmed() ? $this->detail->for($verdict) : null,
            // The reason is a German sentence, because a disabled chip with no explanation reads
            // as a broken control rather than as a fact about the customer's car.
            'reason' => $verdict->reason?->textDe,
            'reasonCode' => $verdict->reason?->code,
            // What of the car the answer waits for — `bodyForm`, `driveAxle` — asked for by name (§1.1, EF-01).
            'missing' => $verdict->missingFacts,
            'document' => $verdict->document === null ? null : [
                'number' => $verdict->document->number,
                'issuer' => $verdict->document->issuer,
                'kind' => $verdict->document->kind,
                // An example document is marked wherever it is shown, and opened through its marked page (D-239).
                'example' => $verdict->document->isDemo,
                // The Gutachten itself, opened at the page the answer stands on.
                'pdf' => self::pdfLink($verdict->document),
                // Every further document the answer rests on, named (the corrections memo §3).
                'others' => array_map(
                    static fn (DocumentRecord $d): string => trim(ApprovalKind::tryFrom($d->kind)?->labelDe().' '.($d->number ?? '')),
                    array_slice($verdict->documents, 1),
                ),
                // What the document itself limits, in sentences: a Nachtrag without its base, the month (§4).
                'notes' => array_values(array_unique(array_merge(...array_map(
                    static fn (DocumentRecord $d): array => $d->notesDe,
                    $verdict->documents === [] ? [$verdict->document] : $verdict->documents,
                )))),
            ],
            'tyreSizes' => $this->sizeLabels($verdict->front),
            // The tyre side of the verdict (§3.4): both axles, the layout, and the minimum four
            // identical tyres must meet — with the source that governed each half (R-06), because
            // a Gutachten that states only a speed symbol must not be credited with the load index.
            'tyreSizesFront' => $this->sizeLabels($verdict->front),
            'tyreSizesRear' => $this->sizeLabels($verdict->rear),
            'tyreLayout' => $verdict->tyreLayout(),
            'minLoadIndex' => $minimum['loadIndex'] ?? null,
            'minSpeedSymbol' => $minimum['speedSymbol'] ?? null,
            'minSource' => $this->either($verdict->front->minSource, $verdict->rear->minSource),
            'minLoadSource' => $minimum['loadSource'] ?? $this->either($verdict->front->minLoadSource, $verdict->rear->minLoadSource),
            'minSpeedSource' => $minimum['speedSource'] ?? $this->either($verdict->front->minSpeedSource, $verdict->rear->minSpeedSource),
            'minSentence' => $this->eligibility->minimumSentenceDe($verdict),
            // The two halves (R-03 as amended): the wheel from the document, the tyres from the car's
            // figures — each with its own word, the tyres with their sentences and the document's limits.
            'wheelStatus' => $verdict->wheelStatus?->value,
            'wheelLabel' => $verdict->wheelStatus?->labelDe(),
            'tyre' => $verdict->tyre === null ? null : [
                'status' => $verdict->tyre->status->value,
                'label' => $verdict->tyre->status === VerdictStatus::Conditional && ! $verdict->tyre->fromVehicleData
                    ? 'Mit deinen Fahrzeugpapieren prüfen'
                    : $verdict->tyre->status->labelDe(),
                'lines' => $verdict->tyre->lines,
                // Always shown: the binding axle and what it asks for, and the document; the sum behind
                // „So haben wir gerechnet“ — open at once where we say no, or where the customer's own
                // figures made the answer stricter (the operator's decision of 29.09.2026).
                'summary' => $verdict->tyre->summary,
                'basis' => $verdict->tyre->basis,
                'open' => $verdict->tyre->status === VerdictStatus::NotPermitted || $verdict->tyre->stricterByPapers,
                'thresholds' => array_map(static fn (array $t): array => [
                    'text' => $t['textDe'],
                    'maxAxleLoad' => GermanFormat::kilograms($t['maxAxleLoadKg']),
                ], $verdict->tyre->thresholds),
                'fromVehicleData' => $verdict->tyre->fromVehicleData,
                // The papers' fields the answer waits for (D-286): the panel points at the form that takes them.
                ...($verdict->tyre->papersOwed === [] ? [] : ['owed' => $verdict->tyre->papersOwed]),
            ],
        ];
    }

    /**
     * The document's PDF, at the page its row cites; null where no file is stored. The URL is where
     * the file IS (DocumentFiles, D-229) — the disk in force, or the server's disk it stayed on after
     * a switch to the bucket — never a link built for a file that is not there: the customer reads the
     * very file the verdict rests on, the one whose hash an order freezes.
     *
     * @return array{url: string, page: int|null}|null
     */
    private static function pdfLink(DocumentRecord $document): ?array
    {
        if ($document->pdfKey === null) {
            return null;
        }

        $url = app(DocumentFiles::class)->locate($document->pdfKey)['url'];

        if ($url === null) {
            return null;
        }

        // An example document opens through the page that marks it (decision 6, D-239): the file itself carries no mark,
        // so the shop never hands out its address bare.
        if ($document->isDemo) {
            return ['url' => route('gutachten.beispiel', ['document' => $document->id, ...($document->sourcePage === null ? [] : ['seite' => $document->sourcePage])]), 'page' => $document->sourcePage];
        }

        return ['url' => $url.($document->sourcePage === null ? '' : '#page='.$document->sourcePage), 'page' => $document->sourcePage];
    }

    /** @return list<string> `245/45 R18` per permitted size on this axle. */
    private function sizeLabels(AxleRequirement $axle): array
    {
        return array_map(static fn (TyreSize $size): string => $size->labelDe(), $axle->sizes);
    }

    /**
     * The minimum four identical tyres must meet, for the payload: the stricter axle for each
     * half, credited to the source that governed THAT half. Null as soon as either axle has no
     * usable minimum or carries a symbol the table does not know — never a partial pair (R-03).
     *
     * Display only. It mirrors what `TyreEligibility::minimumSentenceDe()` says in words, using
     * the engine's own comparator for symbols (H sits between U and V, so letters are never
     * compared); the decision whether a tyre may be sold is made there, never here (R-13).
     *
     * @return array{loadIndex: int, loadSource: string, speedSymbol: string, speedSource: string}|null
     */
    private function minimum(FitmentVerdict $verdict): ?array
    {
        $front = $verdict->front;
        $rear = $verdict->rear;
        $frontRank = $this->speedSymbol->rankOf($front->minSpeedSymbol);
        $rearRank = $this->speedSymbol->rankOf($rear->minSpeedSymbol);

        if ($front->minLoadIndex === null || $rear->minLoadIndex === null
            || $front->minSpeedSymbol === null || $rear->minSpeedSymbol === null
            || $frontRank === null || $rearRank === null) {
            return null;
        }

        return [
            'loadIndex' => max($front->minLoadIndex, $rear->minLoadIndex),
            'loadSource' => $this->stricterSource($front->minLoadIndex, $front->minLoadSource, $rear->minLoadIndex, $rear->minLoadSource),
            'speedSymbol' => $frontRank >= $rearRank ? $front->minSpeedSymbol : $rear->minSpeedSymbol,
            'speedSource' => $this->stricterSource($frontRank, $front->minSpeedSource, $rearRank, $rear->minSpeedSource),
        ];
    }

    /** The source of the stricter half; on a tie the document is credited when either axle wrote it down. */
    private function stricterSource(int $frontOrder, MinSource $frontSource, int $rearOrder, MinSource $rearSource): string
    {
        return match (true) {
            $frontOrder > $rearOrder => $frontSource->value,
            $rearOrder > $frontOrder => $rearSource->value,
            default => $this->either($frontSource, $rearSource),
        };
    }

    /** `DOCUMENT` when either half came from the Gutachten — the combined bit `AxleRequirement::$minSource` carries — then `PAPERS` (D-242). */
    private function either(MinSource $a, MinSource $b): string
    {
        return match (true) {
            $a === MinSource::Document || $b === MinSource::Document => MinSource::Document->value,
            $a === MinSource::Papers || $b === MinSource::Papers => MinSource::Papers->value,
            default => MinSource::Derived->value,
        };
    }

    /**
     * Filter state lives in the query string so a filtered listing can be shared, bookmarked and
     * reached with the back button.
     *
     * @return array<string, mixed>
     */
    private function filters(Request $request): array
    {
        $filters = [];

        foreach (ListingQuery::FACETS as $facet) {
            if (! $request->has($facet)) {
                continue;
            }

            if ($facet === 'ohne_eintragung') {
                if ($request->boolean($facet)) {
                    $filters[$facet] = true;
                }

                continue;
            }

            $value = $request->input($facet);
            $values = array_values(array_filter(
                is_array($value) ? $value : explode(',', (string) $value),
                static fn (mixed $v): bool => is_string($v) && $v !== '',
            ));

            // A size arrives as `19` from the homepage's size tiles and as `19.0` from the listing's own options: both are
            // written as the facets write them (the column's form), so the option shows as chosen and both lead to one
            // filter. A value that is no number is no size, and is dropped (D-118).
            $format = match ($facet) {
                'zoll' => 1,
                'breite' => 2,
                'et' => 0,
                default => null,
            };

            if ($format !== null) {
                $values = array_values(array_unique(array_map(
                    static fn (string $v): string => number_format((float) str_replace(',', '.', $v), $format, '.', ''),
                    array_filter($values, static fn (string $v): bool => is_numeric(str_replace(',', '.', $v))),
                )));
            }

            // A brand arrives by name from the listing's own options and by slug from the homepage's brand wall
            // (/felgen?marke=oz-racing): both mean the brand, and the listing reads its name.
            if ($facet === 'marke' && $values !== []) {
                $names = Brand::query()->whereIn('slug', $values)->pluck('name', 'slug');
                $values = array_values(array_unique(array_map(static fn (string $v): string => (string) ($names[$v] ?? $v), $values)));
            }

            if ($values !== []) {
                $filters[$facet] = $values;
            }
        }

        return $filters;
    }
}
