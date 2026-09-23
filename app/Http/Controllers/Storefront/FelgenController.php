<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Enums\TyreSeason;
use App\Http\Controllers\Controller;
use App\Models\BalanceWeightColour;
use App\Models\CatalogueGapEvent;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Services\Commerce\KomplettradPricer;
use App\Services\Storefront\Basket;
use App\Services\Storefront\ProductCards;
use App\Services\Storefront\RecentlyViewed;
use App\Services\Storefront\VehicleTree;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function __construct(
        private readonly ProductCards $cards,
        private readonly VehicleTree $tree,
        private readonly ListingQuery $listing,
        private readonly FitmentResolver $resolver,
        private readonly RecentlyViewed $recentlyViewed,
        private readonly TyreEligibility $eligibility,
        private readonly KomplettradPricer $pricer,
        private readonly SpeedSymbolDeriver $speedSymbol,
    ) {}

    /** The vehicle selector: make → model → variant, or the two key numbers. */
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
        ]);
    }

    /** Cards per listing page. The page's pager derives its page count from the same number. */
    private const PER_PAGE = 24;

    /** The listing. With a vehicle it is a compliance answer; without one it is a catalogue. */
    public function index(Request $request): Response|RedirectResponse
    {
        $vehicleId = $this->vehicleId($request);
        $filters = $this->filters($request);

        if ($vehicleId === null) {
            return Inertia::render('Felgen/Index', [
                'hasVehicle' => false,
                // The whole catalogue. This page has no pager without a vehicle and states the
                // number of cards it shows as the size of the range, so a cap here hid a product
                // and made "24 Felgen im Sortiment" untrue.
                'cards' => $this->cards->catalogue(limit: null),
                'total' => null,
                'facets' => [],
                'filters' => $filters,
                'demo' => $this->demo(),
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
            // Counts carry the OTHER filters but not the facet's own, so "18 Zoll (312)" means
            // "312 results if you add this" rather than a number that only holds in isolation.
            'facets' => $this->listing->facets($vehicleId, $filters),
            'filters' => $filters,
            'page' => $page,
            'demo' => $this->demo(),
        ]);
    }

    /**
     * Whether seeded demonstration rows are on the page, so it can say so (OVERHAUL.md §2). The
     * flag leaves with the rows before launch.
     */
    private function demo(): bool
    {
        return WheelModel::query()->where('is_demo', true)->exists();
    }

    /** The product page. One model, its finishes, its configurations. */
    public function show(Request $request, string $model): Response
    {
        $wheel = WheelModel::query()
            ->with(['brand', 'finishes', 'configs'])
            ->where('slug', $model)
            ->firstOrFail();

        $this->recentlyViewed->record($request->session(), (int) $wheel->id);

        $vehicleId = $this->vehicleId($request);
        $configs = [];
        $anyUnknown = false;

        // Every configuration of the wheel decided in one call: the engine reads the rows once.
        $verdicts = $vehicleId === null
            ? []
            : $this->resolver->resolveMany($vehicleId, $wheel->configs->pluck('id')->map(static fn (mixed $id): int => (int) $id)->values()->all());

        // Adding a Komplettrad from this page assigns the admin's default Wuchtgewichte colour
        // (§4.1); read once for the whole page, and only where an offer could be made at all.
        $colour = $vehicleId === null ? null : BalanceWeightColour::default();

        foreach ($wheel->configs as $config) {
            $live = $verdicts[$config->id] ?? null;
            $verdict = $live === null ? null : $this->verdictFor($live);

            // The hump designation the wheel's own approval prints in its size line ("8½ J x 19
            // H2"). Empty is the same as absent: the details then show no Hump row rather than a
            // blank one, because a record that holds no designation makes no claim about one.
            $hump = is_string($config->hump) ? trim($config->hump) : '';

            if ($verdict !== null && $verdict['status'] === VerdictStatus::Unknown->value) {
                $anyUnknown = true;
            }

            $configs[] = [
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
                'priceCents' => (int) $config->price_cents,
                'price' => GermanFormat::money((int) $config->price_cents),
                'stockQty' => (int) $config->stock_qty,
                'inStock' => $config->stock_qty > 0,
                'kbaNumber' => $config->kba_number,
                'weightG' => $config->weight_g === null ? null : (int) $config->weight_g,
                // The load rating per wheel, from the approval document; null when nobody has
                // verified one, and the page then shows no row (ACCURACY.md D2).
                'maxLoadKg' => $this->maxLoadKg($config->getAttribute('max_load_kg')),
                // The Komplettrad offer travels with the verdict it depends on, for the same
                // reason: a size change swaps the tyres and the legal answer in one commit.
                'komplettrad' => $this->komplettradFor($config, $live, $colour),
            ];
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

        return Inertia::render('Produkt/Index', [
            'product' => [
                'modelId' => $wheel->id,
                'slug' => $wheel->slug,
                'modelName' => $wheel->name,
                'brandName' => $wheel->brand->name,
                'typeDesignation' => $wheel->type_designation,
                'descriptionDe' => $wheel->description_de,
                'spokes' => $wheel->spoke_count,
                'rating' => $wheel->rating,
                'ratingCount' => $wheel->rating_count,
                'ratingLabel' => $wheel->rating === null
                    ? null
                    : GermanFormat::rating($wheel->rating, $wheel->rating_count),
            ],
            'finishes' => $finishes,
            'configs' => $configs,
            'hasVehicle' => $vehicleId !== null,
            // A seeded demonstration model: the page shows "Beispielbestand" rather than "Auf
            // Lager" and says it cannot be ordered yet. The basket stays walkable; the checkout
            // refuses the order on the server (ACCURACY.md D4).
            'demo' => (bool) $wheel->is_demo,
        ]);
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
     * @return array<string, mixed>
     */
    private function komplettradFor(WheelConfig $config, ?FitmentVerdict $verdict, ?BalanceWeightColour $colour): array
    {
        // Without a vehicle there is no verdict, so there is no permitted-size list (D-033).
        if ($verdict === null) {
            return $this->komplettradRefused(KomplettradRefusal::NoVehicle->value, KomplettradRefusal::NoVehicle->sentenceDe(), null);
        }

        $offer = $this->eligibility->offerFor($verdict);

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

        foreach ($offer->tyres as $record) {
            $variant = $variants->get($record->id);

            // The page sells sets of four, so the engine is asked for exactly that quantity: a
            // tyre with one on the shelf is not offered and then refused at the click.
            if (! $variant instanceof TyreVariant || $this->eligibility->permits($verdict, $record, self::SET_OF) !== null) {
                continue;
            }

            $price = $this->pricer->perWheel($config, $variant, $colour);
            $priceOpen = $priceOpen || ! $price->complete();
            $perWheel = $price->knownPerWheelCents();

            $tyres[] = [
                'id' => (int) $variant->id,
                'brandName' => (string) $variant->brand?->name,
                'name' => (string) $variant->name,
                'season' => (string) $variant->season,
                'seasonLabel' => TyreSeason::from((string) $variant->season)->longLabelDe(),
                'sizeLabel' => $variant->label(),
                'stockQty' => (int) $variant->stock_qty,
                'tyrePriceCents' => (int) $variant->price_cents,
                'tyrePrice' => GermanFormat::money((int) $variant->price_cents, $price->currency),
                // The known components per wheel; an unconfigured mounting fee is left out and
                // `priceOpen` says so — never a guessed number, never a silent 0,00 € (D-032).
                'perWheelCents' => $perWheel,
                'perWheel' => GermanFormat::money($perWheel, $price->currency),
                'forFourCents' => $perWheel * self::SET_OF,
                'forFour' => GermanFormat::money($perWheel * self::SET_OF, $price->currency),
                'label' => Basket::euLabel($variant),
                'isDemo' => (bool) $variant->is_demo,
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
            'label' => $verdict->status->labelDe(),
            'sellable' => $verdict->isSellable(),
            'requiresEntry' => $verdict->requiresEntry,
            'entryNoteDe' => $verdict->entryNoteDe,
            // The Mittenlochbohrung the covering documents state for THIS car, formatted by the
            // one helper (R-10), or null where they state none or disagree. Never the rim's own
            // figure: that arrives beside it as `centreBore` and is labelled as the rim's, so the
            // two claims can never be read as one.
            'centreBore' => $verdict->documentCentreBoreMm === null
                ? null
                : GermanFormat::millimetres($verdict->documentCentreBoreMm),
            'centreBoreSource' => $verdict->centreBoreSource->value,
            // Full German sentences, never codes such as A02 (R-15).
            'conditions' => array_map(
                static fn (Condition $condition): string => $condition->sentenceDe(),
                $verdict->conditions,
            ),
            // The reason is a German sentence, because a disabled chip with no explanation reads
            // as a broken control rather than as a fact about the customer's car.
            'reason' => $verdict->reason?->textDe,
            'reasonCode' => $verdict->reason?->code,
            'document' => $verdict->document === null ? null : [
                'number' => $verdict->document->number,
                'issuer' => $verdict->document->issuer,
                'kind' => $verdict->document->kind,
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
        ];
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

    /** `DOCUMENT` when either half came from the Gutachten — the combined bit `AxleRequirement::$minSource` carries. */
    private function either(MinSource $a, MinSource $b): string
    {
        return ($a === MinSource::Document || $b === MinSource::Document)
            ? MinSource::Document->value
            : MinSource::Derived->value;
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

            if ($values !== []) {
                $filters[$facet] = $values;
            }
        }

        return $filters;
    }
}
