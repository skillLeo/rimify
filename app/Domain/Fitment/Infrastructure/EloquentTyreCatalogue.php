<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Infrastructure;

use App\Domain\Fitment\Contracts\TyreCatalogue;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Models\TyreVariant;
use Illuminate\Database\Eloquent\Builder;

/**
 * The engine's tyre catalogue, over `tyre_variants`.
 *
 * One query, every value bound (R-14), cheapest first so the offer a customer sees is stable
 * between renders. Soft-deleted rows never cross this boundary.
 */
final readonly class EloquentTyreCatalogue implements TyreCatalogue
{
    /**
     * @param  list<TyreSize>  $sizes
     * @return list<TyreRecord>
     */
    public function inSizes(array $sizes, bool $inStockOnly = true): array
    {
        if ($sizes === []) {
            return [];
        }

        // One clause per distinct size — the same size listed twice must not be asked twice.
        $distinct = [];

        foreach ($sizes as $size) {
            $distinct[$size->key()] = $size;
        }

        $query = TyreVariant::query()
            ->with('brand')
            ->whereNull('deleted_at')
            // A tuple IN over `(width_mm, aspect, diameter_in)` cannot be bound portably, so the
            // sizes are OR-ed as three bound equalities each; `idx_tyre_lookup` covers it.
            ->where(static function (Builder $sizes) use ($distinct): void {
                foreach ($distinct as $size) {
                    $sizes->orWhere(static function (Builder $one) use ($size): void {
                        $one->where('width_mm', $size->widthMm)
                            ->where('aspect', $size->aspect)
                            ->where('diameter_in', $size->diameterIn);
                    });
                }
            });

        if ($inStockOnly) {
            $query->where('stock_qty', '>', 0);
        }

        return $query
            ->orderBy('price_cents')
            ->orderBy('id')
            ->get()
            ->map(static fn (TyreVariant $tyre): TyreRecord => self::toRecord($tyre))
            ->values()
            ->all();
    }

    public static function toRecord(TyreVariant $tyre): TyreRecord
    {
        return new TyreRecord(
            id: (int) $tyre->id,
            widthMm: (int) $tyre->width_mm,
            aspect: (int) $tyre->aspect,
            diameterIn: (float) $tyre->diameter_in,
            loadIndex: (int) $tyre->load_index,
            speedSymbol: (string) $tyre->speed_symbol,
            speedRank: (int) $tyre->speed_rank,
            priceCents: (int) $tyre->price_cents,
            stockQty: (int) $tyre->stock_qty,
            brandName: $tyre->relationLoaded('brand') ? $tyre->brand?->name : null,
            name: (string) $tyre->name,
            season: (string) $tyre->season,
        );
    }
}
