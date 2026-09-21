<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Contracts;

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;

interface TyreCatalogue
{
    /**
     * Tyres available in the given sizes.
     *
     * @param  list<TyreSize>  $sizes
     * @return list<TyreRecord>
     */
    public function inSizes(array $sizes, bool $inStockOnly = true): array;
}
