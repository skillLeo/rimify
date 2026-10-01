<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Domain\Fitment\Data\TyreSize;
use App\Models\OrderLine;
use App\Models\TyreVariant;

/**
 * The tyre size a Komplettrad was sold with, per package: its wheel line carries the frozen verdict, its tyre line the
 * tyre. The order then says that size's Auflagen with the wheel, and no other size's (ConditionGroups::toArray()).
 */
final class PackageTyreSizes
{
    /**
     * @param  iterable<OrderLine>  $lines
     * @return array<int, string> package group => TyreSize::key()
     */
    public static function of(iterable $lines): array
    {
        $tyres = [];

        foreach ($lines as $line) {
            $package = $line->getAttribute('package_group');
            $tyre = $line->getAttribute('tyre_variant_id');

            if ($package !== null && $tyre !== null) {
                $tyres[(int) $package] = (int) $tyre;
            }
        }

        if ($tyres === []) {
            return [];
        }

        $sizes = TyreVariant::withTrashed()->whereIn('id', array_values($tyres))->get(['id', 'width_mm', 'aspect', 'diameter_in'])->keyBy('id');
        $out = [];

        foreach ($tyres as $package => $id) {
            $tyre = $sizes->get($id);

            if ($tyre instanceof TyreVariant) {
                $out[$package] = TyreSize::keyOf((int) $tyre->width_mm, (int) $tyre->aspect, (float) $tyre->diameter_in);
            }
        }

        return $out;
    }

    /** @param array<int, string> $sizes */
    public static function for(OrderLine $line, array $sizes): ?string
    {
        $package = $line->getAttribute('package_group');

        return $package === null ? null : ($sizes[(int) $package] ?? null);
    }
}
