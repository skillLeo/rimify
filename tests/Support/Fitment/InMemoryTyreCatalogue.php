<?php

declare(strict_types=1);

namespace Tests\Support\Fitment;

use App\Domain\Fitment\Contracts\TyreCatalogue;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;

/**
 * An in-memory tyre catalogue, so `TyreEligibility` can be exercised with no database and no
 * framework booted (R-13).
 *
 * It mirrors the Eloquent implementation's contract exactly — size match by identity, the
 * in-stock filter, cheapest first then by id — rather than the eligibility's expectations, so a
 * test passing here means the rule is right and not merely consistent with a fake written to
 * agree with it.
 */
final class InMemoryTyreCatalogue implements TyreCatalogue
{
    /** @param list<TyreRecord> $tyres */
    public function __construct(private array $tyres = []) {}

    /**
     * @param  list<TyreSize>  $sizes
     * @return list<TyreRecord>
     */
    public function inSizes(array $sizes, bool $inStockOnly = true): array
    {
        if ($sizes === []) {
            return [];
        }

        $keys = array_map(static fn (TyreSize $size): string => $size->key(), $sizes);

        $found = array_values(array_filter(
            $this->tyres,
            static fn (TyreRecord $tyre): bool => in_array($tyre->size()->key(), $keys, true)
                && (! $inStockOnly || $tyre->stockQty > 0),
        ));

        usort(
            $found,
            static fn (TyreRecord $a, TyreRecord $b): int => [$a->priceCents, $a->id] <=> [$b->priceCents, $b->id],
        );

        return $found;
    }
}
