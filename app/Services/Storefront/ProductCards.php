<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\TyreCheck;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Enums\CatalogueStatus;
use App\Support\DemoWheels;
use App\Support\GermanFormat;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The product card, built once and used by the homepage rail, the listing, the comparison tray and
 * the brand pages.
 *
 * Two paths, on purpose. With a vehicle the cards come from `ListingQuery`, which asks the fitment
 * engine what is legally permitted on that car; without one they come from the catalogue, and the
 * card carries no fitment line at all. A card that says `Passend` without naming a vehicle is the
 * exact failure this product exists to avoid — so when there is no vehicle, there is no claim.
 */
final readonly class ProductCards
{
    public function __construct(
        private ListingQuery $listing,
        private FitmentResolver $resolver,
        private VehicleRepository $vehicles,
    ) {}

    /**
     * Cards for a chosen vehicle: only wheels a published document permits on that exact variant.
     *
     * `missing`: what of the car the page's answers wait for (`bodyForm`, `driveAxle`), so the listing can ask
     * for it by name the moment the car is chosen (the operator's last prompt §1.1). `owed`: the fields of the car's
     * papers its tyres wait for (`8.1`, `8.2`, `T` — D-286), asked once for every wheel on the page.
     *
     * @param  array<string, mixed>  $filters
     * @return array{cards: list<array<string, mixed>>, total: int, missing: list<string>, owed: list<string>}
     */
    public function forVehicle(int $vehicleId, array $filters = [], int $perPage = 24, int $page = 1): array
    {
        $result = $this->listing->results($vehicleId, $filters, $perPage, $page);

        $modelIds = [];
        $finishIds = [];

        foreach ($result['rows'] as $row) {
            $modelIds[] = (int) ($row['model_id'] ?? 0);
            $finishIds[] = (int) ($row['finish_id'] ?? 0);
        }

        // Two queries for the whole page rather than two per card: the listing query deliberately
        // does not select presentation columns, and fetching them per row would undo the work of
        // making the listing one statement.
        $presentation = $this->presentationFor($modelIds, $finishIds);
        $diameters = $this->diametersFor($modelIds, $finishIds);
        $configIds = $this->listing->configIdsFor($vehicleId, $filters, $modelIds, $finishIds);
        $diameterOf = $this->diameterByConfig($configIds);
        $vehicle = $this->vehicles->find($vehicleId);

        // Every configuration on the page decided in one call, so the engine reads its rows once
        // for the page rather than once per configuration.
        $verdicts = $vehicle === null
            ? []
            : $this->resolver->resolveManyForVehicle($vehicle, array_merge([], ...array_values($configIds)));

        $cards = [];

        foreach ($result['rows'] as $row) {
            $key = (int) ($row['model_id'] ?? 0).':'.(int) ($row['finish_id'] ?? 0);

            $cards[] = $this->fromListingRow(
                $row,
                $presentation,
                $diameters,
                $this->claim($verdicts, $configIds[$key] ?? [], $diameterOf),
            );
        }

        $missing = [];
        $owed = [];

        foreach ($verdicts as $verdict) {
            foreach ($verdict->missingFacts as $fact) {
                $missing[$fact] = true;
            }

            foreach ($verdict->tyre->papersOwed ?? [] as $field) {
                $owed[$field] = true;
            }
        }

        return [
            'cards' => $cards,
            'total' => $result['total'],
            'missing' => array_values(array_intersect(['bodyForm', 'driveAxle'], array_keys($missing))),
            'owed' => array_values(array_intersect(TyreCheck::PAPERS_FIELDS, array_keys($owed))),
        ];
    }

    /**
     * What a card may say about the car: asked of the fitment engine for exactly the configurations
     * the card stands for, and merged toward caution — CONDITIONAL if any of them is, entry if any
     * of them needs it, the union of their Auflagen.
     *
     * The listing's own SQL knew only whether an entry was required, so a wheel whose Auflage was,
     * say, "Nur mit den angegebenen Radschrauben zulässig." was shown as plainly "Passend" in the
     * grid and "Mit Auflagen" on its product page. The engine is the one source of that answer
     * (R-13), and a listing card is no exception.
     *
     * The diameters the permitted configurations come in travel with the claim, so a tile can
     * grey the sizes no document permits on this car (in the same spelling as `diameters`).
     *
     * A size whose wheel is approved and whose tyres are only unconfirmed (finding 103, D-286) is a size the document
     * permits: never greyed as „keine Freigabe“. Where no size sells and such a one exists, the card says the wheel's
     * half and that the tyres are open (`tyresOpen`), as the product page does.
     *
     * @param  array<int, FitmentVerdict>  $verdicts  the engine's verdicts for the page, by configuration id
     * @param  list<int>  $configIds
     * @param  array<int, string>  $diameterOf  configuration id → its diameter, formatted
     * @return array{status: string, requiresEntry: bool, notesOnly: bool, conditions: list<string>, conditionsVary: bool, diametersFitting: list<string>, tyresOpen: bool, wheelConditional: bool}
     */
    private function claim(array $verdicts, array $configIds, array $diameterOf = []): array
    {
        $status = null;
        $requiresEntry = false;
        // Only what holds for every permitted rim size and every tyre size of this wheel: a tile cannot say which
        // size the customer will pick, and one blended list would set one size's „no snow chains“ beside another's
        // „fine-link chains“ (ConditionGroups). The rest is on the product page, per size — and the tile says so.
        $conditions = null;
        $vary = false;
        $key = static fn (Condition $c): string => $c->code."\u{0}".$c->sentenceDe();
        $fitting = [];
        // Every conditional size's Auflagen all Hinweise (#23, D-104): the tile may say „Freigegeben“.
        $allNotes = true;

        $open = false;
        $openConditional = false;

        foreach ($configIds as $configId) {
            $verdict = $verdicts[$configId] ?? null;

            // The wheel approved, its tyres not yet confirmed: no claim to sell, and no „keine Freigabe“ on its size.
            if ($verdict !== null && $verdict->tyreUnconfirmed()) {
                $open = true;
                // Merged toward caution, as the rest of the claim: one size approved with Auflagen and the card says so.
                $openConditional = $openConditional || $verdict->wheelStatus === VerdictStatus::Conditional;

                if (isset($diameterOf[$configId])) {
                    $fitting[$diameterOf[$configId]] = true;
                }

                continue;
            }

            // No verdict (no vehicle, or not asked about) is no claim — never a default yes.
            if ($verdict === null || ! $verdict->isSellable()) {
                continue;
            }

            $status = ($status === VerdictStatus::Conditional || $verdict->status === VerdictStatus::Conditional)
                ? VerdictStatus::Conditional
                : VerdictStatus::Permitted;
            $requiresEntry = $requiresEntry || $verdict->requiresEntry;
            $allNotes = $allNotes && ($verdict->status !== VerdictStatus::Conditional || $verdict->notesOnly());
            $groups = $verdict->conditionGroups();
            $vary = $vary || $groups->differBySize() || $groups->entryDiffers();

            if ($conditions === null) {
                $conditions = $groups->combination;
            } else {
                $mine = array_map($key, $groups->combination);
                $vary = $vary || count($mine) !== count($conditions) || array_diff($mine, array_map($key, $conditions)) !== [];
                $conditions = array_values(array_filter($conditions, static fn (Condition $c): bool => in_array($key($c), $mine, true)));
            }

            if (isset($diameterOf[$configId])) {
                $fitting[$diameterOf[$configId]] = true;
            }
        }

        $diametersFitting = array_keys($fitting);
        usort($diametersFitting, static fn (string $a, string $b): int => (float) str_replace(',', '.', $a) <=> (float) str_replace(',', '.', $b));

        // The listing and the engine disagree about this card. It makes no positive claim — save the wheel's own half,
        // where the document approves it and only the tyres are open.
        if ($status === null) {
            return [
                'status' => VerdictStatus::Unknown->value, 'requiresEntry' => false, 'notesOnly' => false, 'conditions' => [], 'conditionsVary' => false,
                'diametersFitting' => $open ? $diametersFitting : [], 'tyresOpen' => $open, 'wheelConditional' => $openConditional,
            ];
        }

        $conditions ??= [];

        // Merged across configurations, "Keine Eintragung erforderlich." from one of them would
        // contradict the entry another one needs.
        if ($requiresEntry) {
            $conditions = array_filter($conditions, static fn (Condition $c): bool => $c->code !== 'NO_ENTRY_REQUIRED');
        }

        return [
            'status' => $status->value,
            'requiresEntry' => $requiresEntry,
            // Every Auflage of every size a Hinweis (#23, D-104): „Freigegeben“, quietly „mit Hinweisen“.
            'notesOnly' => $status === VerdictStatus::Conditional && ! $requiresEntry && $allNotes,
            'conditions' => array_values(array_map(
                static fn (Condition $c): string => $c->sentenceDe(),
                $conditions,
            )),
            // Further Auflagen depend on the rim or tyre size: the tile says so and points to the product page.
            'conditionsVary' => $vary,
            'diametersFitting' => $diametersFitting,
            'tyresOpen' => false,
            'wheelConditional' => false,
        ];
    }

    /**
     * Each configuration's diameter, formatted the way the card lists its sizes, for every
     * configuration a page of cards stands for — one query for the page.
     *
     * @param  array<string, list<int>>  $configIdsByCard
     * @return array<int, string>
     */
    private function diameterByConfig(array $configIdsByCard): array
    {
        $ids = array_values(array_unique(array_merge([], ...array_values($configIdsByCard))));

        if ($ids === []) {
            return [];
        }

        $out = [];

        foreach (DB::table('wheel_configs')->whereIn('id', $ids)->get(['id', 'diameter_in']) as $row) {
            $out[(int) $row->id] = GermanFormat::trimmedDecimal((string) $row->diameter_in, 1);
        }

        return $out;
    }

    /**
     * Cards with no vehicle in play: the whole published catalogue, one card per model and finish,
     * showing its cheapest configuration. No fitment claim is made anywhere on these.
     *
     * Options, all optional and all real queries: `order` — `price` (cheapest first, the default),
     * `newest` (the model's creation date), `coverage` (the number of document rows behind the
     * model) or `bestselling` (paid orders that hold the model — BestSellers — then coverage);
     * `maxPriceCents` — only models whose cheapest configuration is at or under it; `modelIds` —
     * only these models, in the order given; `withImageOnly` — only finishes with a cut-out (the
     * homepage's shop window while the demo set is incomplete). Finishes with a photograph come
     * first in every order: a drawing is a fallback, never the front row.
     *
     * `filters` — the listing's facets without a car (the client's #30, D-118): Marke, Zoll, Breite, ET and Farbe
     * narrow the configurations a card stands for, so its price is the cheapest that matches.
     *
     * @param  int|null  $limit  null for the whole range
     * @param  array{order?: string, maxPriceCents?: int|null, modelIds?: list<int>, withImageOnly?: bool, filters?: array<string, mixed>}  $options
     * @return list<array<string, mixed>>
     */
    public function catalogue(?int $limit = 24, ?string $brand = null, array $options = []): array
    {
        $order = $options['order'] ?? 'price';
        $filters = $options['filters'] ?? [];
        $maxPriceCents = $options['maxPriceCents'] ?? null;
        $modelIds = $options['modelIds'] ?? null;
        $withImageOnly = ($options['withImageOnly'] ?? false) === true;

        if ($modelIds === []) {
            return [];
        }

        $rows = DB::table('wheel_configs as wc')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->join('wheel_finishes as wf', 'wf.id', '=', 'wc.wheel_finish_id')
            ->join('brands as br', 'br.id', '=', 'wm.brand_id')
            ->whereNull('wc.deleted_at')
            ->whereNull('wm.deleted_at')
            ->where('wm.status', CatalogueStatus::Published->value)
            ->when($brand !== null, fn ($q) => $q->where('br.slug', $brand))
            ->when($modelIds !== null, fn ($q) => $q->whereIn('wm.id', $modelIds))
            ->when($withImageOnly, fn ($q) => $q->whereNotNull('wf.image_manifest'))
            ->tap(fn ($q) => self::applyFilters($q, $filters))
            ->groupBy(
                'wm.id', 'wm.name', 'wm.slug', 'wm.spoke_count', 'wm.rating', 'wm.rating_count', 'wm.created_at',
                'wm.is_demo', 'br.name', 'wf.id', 'wf.name_de', 'wf.art_finish', 'wf.image_manifest',
            )
            ->when($maxPriceCents !== null, fn ($q) => $q->havingRaw('MIN(wc.price_cents) <= ?', [(int) $maxPriceCents]))
            ->when($modelIds !== null, fn ($q) => $q->orderByRaw(
                'FIELD(wm.id, '.implode(', ', array_fill(0, count($modelIds), '?')).')',
                $modelIds,
            ))
            ->orderByRaw('(wf.image_manifest IS NOT NULL) DESC')
            ->when($order === 'newest', fn ($q) => $q->orderBy('wm.created_at', 'desc'))
            // What has sold, then — while nothing has, and among equals — the most approvals (#5, D-110).
            ->when($order === 'bestselling', fn ($q) => $q->orderByRaw(...BestSellers::orderSql()))
            ->when($order === 'coverage' || $order === 'bestselling', fn ($q) => $q->orderByRaw(
                '(SELECT COUNT(*) FROM fitments f JOIN wheel_configs c ON c.id = f.wheel_config_id WHERE c.wheel_model_id = wm.id) DESC',
            ))
            ->orderByRaw('MIN(wc.price_cents) ASC')
            ->orderBy('wm.id')
            ->orderBy('wf.id')
            ->when($limit !== null, fn ($q) => $q->limit((int) $limit))
            ->get([
                'wm.id as model_id',
                'wm.name as model_name',
                'wm.slug as model_slug',
                'wm.spoke_count',
                'wm.rating',
                'wm.rating_count',
                'wm.is_demo',
                'br.name as brand_name',
                'wf.id as finish_id',
                'wf.name_de as finish_name',
                'wf.art_finish',
                'wf.image_manifest',
                DB::raw('MIN(wc.price_cents) as from_price_cents'),
                DB::raw('MAX(wc.stock_qty) as best_stock_qty'),
                DB::raw('GROUP_CONCAT(DISTINCT wc.diameter_in ORDER BY wc.diameter_in) as diameters'),
            ]);

        $cards = [];

        foreach ($rows as $row) {
            $cards[] = $this->card(
                modelId: (int) $row->model_id,
                modelName: (string) $row->model_name,
                modelSlug: (string) $row->model_slug,
                brandName: (string) $row->brand_name,
                finishId: (int) $row->finish_id,
                finishName: (string) $row->finish_name,
                artFinish: (string) $row->art_finish,
                spokeCount: (int) $row->spoke_count,
                rating: $row->rating === null ? null : (float) $row->rating,
                ratingCount: (int) $row->rating_count,
                fromPriceCents: (int) $row->from_price_cents,
                stockQty: (int) $row->best_stock_qty,
                diameters: $this->diameters(is_string($row->diameters) ? $row->diameters : ''),
                fitment: null,
                image: $this->manifest($row->image_manifest),
                isDemo: (bool) $row->is_demo,
            );
        }

        return $cards;
    }

    /**
     * The facets of the catalogue without a car (the client's #30, D-118), as ListingQuery::facets() gives them with
     * one: every option with the number of cards it would show, counted with the OTHER filters applied and not its own,
     * zero kept so the page can disable rather than hide. ohne_eintragung is a statement about a car and is not
     * offered without one.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, list<array{value: string, count: int}>>
     */
    public function catalogueFacets(array $filters = []): array
    {
        $facets = [];

        foreach (self::CATALOGUE_FACETS as $facet => $column) {
            $others = $filters;
            unset($others[$facet]);

            $query = DB::table('wheel_configs as wc')
                ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
                ->join('wheel_finishes as wf', 'wf.id', '=', 'wc.wheel_finish_id')
                ->join('brands as br', 'br.id', '=', 'wm.brand_id')
                ->whereNull('wc.deleted_at')
                ->whereNull('wm.deleted_at')
                ->where('wm.status', CatalogueStatus::Published->value);

            self::applyFilters($query, $others);

            $facets[$facet] = $query
                ->groupBy($column)
                ->orderBy($column)
                ->selectRaw($column.' AS v, COUNT(DISTINCT wm.id, wf.id) AS c')
                ->get()
                ->map(static fn (object $row): array => ['value' => (string) $row->v, 'count' => (int) $row->c])
                ->values()
                ->all();
        }

        return $facets;
    }

    /** The catalogue's facets and the column each reads — a match of constants, so no query string reaches the SQL (R-14). */
    private const CATALOGUE_FACETS = [
        'marke' => 'br.name',
        'zoll' => 'wc.diameter_in',
        'breite' => 'wc.width_in',
        'et' => 'wc.et_mm',
        'farbe' => 'wf.name_de',
    ];

    /**
     * The facets' WHERE, every value bound: only the known facets, only non-empty values.
     *
     * @param  array<string, mixed>  $filters
     */
    private static function applyFilters(Builder $query, array $filters): void
    {
        foreach (self::CATALOGUE_FACETS as $facet => $column) {
            $value = $filters[$facet] ?? null;
            $values = array_values(array_filter(is_array($value) ? $value : [$value], static fn (mixed $v): bool => is_scalar($v) && (string) $v !== ''));

            if ($values !== []) {
                $query->whereIn($column, array_map('strval', $values));
            }
        }
    }

    /**
     * A listing row carries the fitment facts the catalogue path cannot know: the engine's claim
     * about this card's configurations on the chosen car.
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, array{art_finish: string, spoke_count: int, rating: float|null, rating_count: int, image: array<string, mixed>|null, is_demo: bool}>  $presentation
     * @param  array<string, list<string>>  $diameters
     * @param  array{status: string, requiresEntry: bool, notesOnly: bool, conditions: list<string>, diametersFitting: list<string>}  $claim
     * @return array<string, mixed>
     */
    private function fromListingRow(array $row, array $presentation, array $diameters, array $claim): array
    {
        $modelId = (int) ($row['model_id'] ?? 0);
        $finishId = (int) ($row['finish_id'] ?? 0);
        $key = $modelId.':'.$finishId;

        $look = $presentation[$key] ?? [
            'art_finish' => 'graphite', 'spoke_count' => 5, 'rating' => null, 'rating_count' => 0, 'image' => null, 'is_demo' => false,
        ];

        $diametersFitting = $claim['diametersFitting'];
        unset($claim['diametersFitting']);

        return $this->card(
            modelId: $modelId,
            modelName: (string) ($row['model_name'] ?? ''),
            modelSlug: (string) ($row['model_slug'] ?? ''),
            brandName: (string) ($row['brand_name'] ?? ''),
            finishId: $finishId,
            finishName: (string) ($row['finish_name'] ?? ''),
            artFinish: $look['art_finish'],
            spokeCount: $look['spoke_count'],
            rating: $look['rating'],
            ratingCount: $look['rating_count'],
            fromPriceCents: (int) ($row['from_price_cents'] ?? 0),
            stockQty: (int) ($row['best_stock_qty'] ?? 0),
            diameters: $diameters[$key] ?? [],
            fitment: $claim,
            image: $look['image'],
            isDemo: $look['is_demo'],
            diametersFitting: $diametersFitting,
        );
    }

    /**
     * @param  list<string>  $diameters
     * @param  array<string, mixed>|null  $fitment
     * @param  array<string, mixed>|null  $image
     * @param  list<string>|null  $diametersFitting  the sizes a document permits on the vehicle; null without one
     * @return array<string, mixed>
     */
    private function card(
        int $modelId,
        string $modelName,
        string $modelSlug,
        string $brandName,
        int $finishId,
        string $finishName,
        string $artFinish,
        int $spokeCount,
        ?float $rating,
        int $ratingCount,
        int $fromPriceCents,
        int $stockQty,
        array $diameters,
        ?array $fitment,
        ?array $image,
        bool $isDemo,
        ?array $diametersFitting = null,
    ): array {
        return [
            'modelId' => $modelId,
            'modelName' => $modelName,
            'slug' => $modelSlug,
            'brandName' => $brandName,
            'finishId' => $finishId,
            'finishName' => $finishName,
            // The key the compare store and the compare page agree on.
            'compareKey' => $modelId.':'.$finishId,
            // The two arguments wheelSVG() takes. Without them every card draws the same wheel.
            'art' => ['finish' => $artFinish, 'spokes' => $spokeCount],
            // This finish's own cut-out as `Picture` reads it, or null: a card without a
            // photograph draws the outline and never borrows another finish's picture.
            'image' => $image,
            // A seeded demonstration row. The page says so, once; the card carries the fact.
            'isDemo' => $isDemo,
            'rating' => $rating,
            'ratingCount' => $ratingCount,
            'ratingLabel' => $rating === null ? null : GermanFormat::rating($rating, $ratingCount),
            'fromPriceCents' => $fromPriceCents,
            'fromPrice' => GermanFormat::money($fromPriceCents),
            'inStock' => $stockQty > 0,
            'stockQty' => $stockQty,
            'diameters' => $diameters,
            // With a vehicle: the subset of `diameters` a document permits on it, same spelling.
            // Null without a vehicle — no size is claimed to fit anything.
            'diametersFitting' => $diametersFitting,
            'fitment' => $fitment,
        ];
    }

    /**
     * Presentation columns the listing query does not select, for a whole page of cards at once.
     *
     * @param  list<int>  $modelIds
     * @param  list<int>  $finishIds
     * @return array<string, array{art_finish: string, spoke_count: int, rating: float|null, rating_count: int, image: array<string, mixed>|null, is_demo: bool}>
     */
    private function presentationFor(array $modelIds, array $finishIds): array
    {
        if ($modelIds === []) {
            return [];
        }

        $rows = DB::table('wheel_models as wm')
            ->join('wheel_finishes as wf', 'wf.wheel_model_id', '=', 'wm.id')
            ->whereIn('wm.id', $modelIds)
            ->whereIn('wf.id', $finishIds)
            ->get(['wm.id as model_id', 'wf.id as finish_id', 'wm.spoke_count', 'wm.rating', 'wm.rating_count', 'wm.is_demo', 'wf.art_finish', 'wf.image_manifest']);

        $out = [];

        foreach ($rows as $row) {
            $out[$row->model_id.':'.$row->finish_id] = [
                'art_finish' => is_string($row->art_finish) ? $row->art_finish : 'graphite',
                'spoke_count' => (int) $row->spoke_count,
                'rating' => $row->rating === null ? null : (float) $row->rating,
                'rating_count' => (int) $row->rating_count,
                'image' => $this->manifest($row->image_manifest),
                'is_demo' => (bool) $row->is_demo,
            ];
        }

        return $out;
    }

    /**
     * The stored manifest as an array, or null when there is none or it is not one `Picture`
     * could render. A malformed manifest fails closed to the drawing rather than to a broken
     * image (CLAUDE.md §2).
     *
     * @return array<string, mixed>|null
     */
    private function manifest(mixed $stored): ?array
    {
        $decoded = is_string($stored) ? json_decode($stored, true) : $stored;

        return DemoWheels::wellFormed($decoded) ? $decoded : null;
    }

    /**
     * @param  list<int>  $modelIds
     * @param  list<int>  $finishIds
     * @return array<string, list<string>>
     */
    private function diametersFor(array $modelIds, array $finishIds): array
    {
        if ($modelIds === []) {
            return [];
        }

        $rows = DB::table('wheel_configs')
            ->whereIn('wheel_model_id', $modelIds)
            ->whereIn('wheel_finish_id', $finishIds)
            ->whereNull('deleted_at')
            ->distinct()
            ->orderBy('diameter_in')
            ->get(['wheel_model_id', 'wheel_finish_id', 'diameter_in']);

        $out = [];

        foreach ($rows as $row) {
            $out[$row->wheel_model_id.':'.$row->wheel_finish_id][] =
                GermanFormat::trimmedDecimal((string) $row->diameter_in, 1);
        }

        return $out;
    }

    /** @return list<string> */
    private function diameters(string $concatenated): array
    {
        if ($concatenated === '') {
            return [];
        }

        $out = [];

        foreach (explode(',', $concatenated) as $value) {
            $out[] = GermanFormat::trimmedDecimal($value, 1);
        }

        return $out;
    }
}
