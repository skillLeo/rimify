<?php

declare(strict_types=1);

namespace App\Services\Commerce\Reviews;

use App\Support\CatalogueVersion;
use Illuminate\Support\Facades\DB;

/**
 * A wheel's rating, as its buyers gave it (D-103): the average and the number of its VISIBLE reviews, written to
 * `wheel_models.rating` / `rating_count` here and nowhere else — the tile, the product page and the comparison read
 * those two columns. A review written, hidden or shown again calls `refresh` for its wheel.
 *
 * The average is rounded to one decimal, half away from zero, in integers: 4,85 reads 4,9, never 4,8 by a float.
 */
final class ReviewSummary
{
    public function refresh(int $wheelModelId): void
    {
        $row = DB::table('reviews')
            ->where('wheel_model_id', $wheelModelId)
            ->whereNull('hidden_at')
            ->selectRaw('COUNT(*) AS n, COALESCE(SUM(rating), 0) AS total')
            ->first();

        $count = (int) ($row->n ?? 0);
        $total = (int) ($row->total ?? 0);

        DB::table('wheel_models')->where('id', $wheelModelId)->update([
            'rating' => $count === 0 ? null : self::oneDecimal($total, $count),
            'rating_count' => $count,
        ]);

        // Past the model: the page that shows the stars is another one now (D-294).
        CatalogueVersion::changed();
    }

    /** `$total / $count` to one decimal, half away from zero, without a float until the end: 97 / 20 → 4.9. */
    public static function oneDecimal(int $total, int $count): float
    {
        return intdiv($total * 20 + $count, $count * 2) / 10;
    }
}
