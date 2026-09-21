<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Enums\CatalogueStatus;
use App\Support\GermanFormat;
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
    public function __construct(private ListingQuery $listing) {}

    /**
     * Cards for a chosen vehicle: only wheels a published document permits on that exact variant.
     *
     * @param  array<string, mixed>  $filters
     * @return array{cards: list<array<string, mixed>>, total: int}
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

        $cards = [];

        foreach ($result['rows'] as $row) {
            $cards[] = $this->fromListingRow($row, $presentation, $diameters);
        }

        return ['cards' => $cards, 'total' => $result['total']];
    }

    /**
     * Cards with no vehicle in play: the whole published catalogue, one card per model and finish,
     * showing its cheapest configuration. No fitment claim is made anywhere on these.
     *
     * @return list<array<string, mixed>>
     */
    public function catalogue(int $limit = 24, ?string $brand = null): array
    {
        $rows = DB::table('wheel_configs as wc')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->join('wheel_finishes as wf', 'wf.id', '=', 'wc.wheel_finish_id')
            ->join('brands as br', 'br.id', '=', 'wm.brand_id')
            ->whereNull('wc.deleted_at')
            ->whereNull('wm.deleted_at')
            ->where('wm.status', CatalogueStatus::Published->value)
            ->when($brand !== null, fn ($q) => $q->where('br.slug', $brand))
            ->groupBy(
                'wm.id', 'wm.name', 'wm.slug', 'wm.spoke_count', 'wm.rating', 'wm.rating_count',
                'br.name', 'wf.id', 'wf.name_de', 'wf.art_finish',
            )
            ->orderByRaw('MIN(wc.price_cents) ASC')
            ->limit($limit)
            ->get([
                'wm.id as model_id',
                'wm.name as model_name',
                'wm.slug as model_slug',
                'wm.spoke_count',
                'wm.rating',
                'wm.rating_count',
                'br.name as brand_name',
                'wf.id as finish_id',
                'wf.name_de as finish_name',
                'wf.art_finish',
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
            );
        }

        return $cards;
    }

    /**
     * A listing row carries the fitment facts the catalogue path cannot know — whether ANY of this
     * model's permitted configurations needs entry in the papers.
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, array{art_finish: string, spoke_count: int, rating: float|null, rating_count: int}>  $presentation
     * @param  array<string, list<string>>  $diameters
     * @return array<string, mixed>
     */
    private function fromListingRow(array $row, array $presentation, array $diameters): array
    {
        $modelId = (int) ($row['model_id'] ?? 0);
        $finishId = (int) ($row['finish_id'] ?? 0);
        $key = $modelId.':'.$finishId;

        $look = $presentation[$key] ?? [
            'art_finish' => 'graphite', 'spoke_count' => 5, 'rating' => null, 'rating_count' => 0,
        ];

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
            fitment: [
                // Merged toward caution across this card's configurations: if any permitted
                // configuration needs entry, the card says so rather than promising otherwise.
                'requiresEntry' => (bool) ($row['any_entry_required'] ?? false),
            ],
        );
    }

    /**
     * @param  list<string>  $diameters
     * @param  array<string, mixed>|null  $fitment
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
    ): array {
        return [
            'modelId' => $modelId,
            'modelName' => $modelName,
            'slug' => $modelSlug,
            'brandName' => $brandName,
            'finishId' => $finishId,
            'finishName' => $finishName,
            // The two arguments wheelSVG() takes. Without them every card draws the same wheel.
            'art' => ['finish' => $artFinish, 'spokes' => $spokeCount],
            'rating' => $rating,
            'ratingCount' => $ratingCount,
            'ratingLabel' => $rating === null ? null : GermanFormat::rating($rating, $ratingCount),
            'fromPriceCents' => $fromPriceCents,
            'fromPrice' => GermanFormat::money($fromPriceCents),
            'inStock' => $stockQty > 0,
            'stockQty' => $stockQty,
            'diameters' => $diameters,
            'fitment' => $fitment,
        ];
    }

    /**
     * Presentation columns the listing query does not select, for a whole page of cards at once.
     *
     * @param  list<int>  $modelIds
     * @param  list<int>  $finishIds
     * @return array<string, array{art_finish: string, spoke_count: int, rating: float|null, rating_count: int}>
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
            ->get(['wm.id as model_id', 'wf.id as finish_id', 'wm.spoke_count', 'wm.rating', 'wm.rating_count', 'wf.art_finish']);

        $out = [];

        foreach ($rows as $row) {
            $out[$row->model_id.':'.$row->finish_id] = [
                'art_finish' => is_string($row->art_finish) ? $row->art_finish : 'graphite',
                'spoke_count' => (int) $row->spoke_count,
                'rating' => $row->rating === null ? null : (float) $row->rating,
                'rating_count' => (int) $row->rating_count,
            ];
        }

        return $out;
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
