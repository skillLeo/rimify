<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Controller;
use App\Models\CatalogueGapEvent;
use App\Models\WheelModel;
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
    public function __construct(
        private readonly ProductCards $cards,
        private readonly VehicleTree $tree,
        private readonly ListingQuery $listing,
        private readonly FitmentResolver $resolver,
        private readonly RecentlyViewed $recentlyViewed,
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

        foreach ($wheel->configs as $config) {
            $verdict = $vehicleId === null ? null : $this->verdictFor($vehicleId, $config->id);

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
                'centreBore' => GermanFormat::millimetres((float) $config->centre_bore_mm),
                'priceCents' => (int) $config->price_cents,
                'price' => GermanFormat::money((int) $config->price_cents),
                'stockQty' => (int) $config->stock_qty,
                'inStock' => $config->stock_qty > 0,
                'kbaNumber' => $config->kba_number,
                'weightG' => $config->weight_g === null ? null : (int) $config->weight_g,
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
        ]);
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
    private function verdictFor(int $vehicleId, int $wheelConfigId): array
    {
        $verdict = $this->resolver->resolve($vehicleId, $wheelConfigId);

        return [
            'status' => $verdict->status->value,
            'label' => $verdict->status->labelDe(),
            'sellable' => $verdict->isSellable(),
            'requiresEntry' => $verdict->requiresEntry,
            'entryNoteDe' => $verdict->entryNoteDe,
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
            'tyreSizes' => array_map(
                static fn (TyreSize $size): string => $size->labelDe(),
                $verdict->front->sizes,
            ),
        ];
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
