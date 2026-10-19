<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Contracts;

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;

interface TyreCatalogue
{
    /**
     * Tyres in the given sizes — only the ones the shop sells now (TyreRecord::$sellable), unless `$sellableOnly` is
     * false: then also the rest, for a check that must see them to refuse them.
     *
     * @param  list<TyreSize>  $sizes
     * @return list<TyreRecord>
     */
    public function inSizes(array $sizes, bool $sellableOnly = true): array;
}
