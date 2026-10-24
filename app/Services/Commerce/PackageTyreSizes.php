<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Domain\Fitment\Data\TyreSize;
use App\Models\OrderLine;
use App\Models\TyreVariant;

/**
 * The tyre size a Komplettrad was sold with, per line: a line that carries its own tyre is read by it — each axle of a set
 * per axle (D-105, D-335) by its own, never by the other axle's —, and an older package by the tyre line beside its wheel
 * line in the same group. The order then says that size's Auflagen with the wheel, and no other size's
 * (ConditionGroups::toArray()).
 */
final class PackageTyreSizes
{
    /**
     * @param  iterable<OrderLine>  $lines
     * @return array{lines: array<int, string>, groups: array<int, string>, axles: array<int, array<string, string>>} line id or package group => TyreSize::key(); a set per axle's package => axle => key
     */
    public static function of(iterable $lines): array
    {
        $byLine = [];
        $byGroup = [];
        $byAxle = [];

        foreach ($lines as $line) {
            $package = $line->getAttribute('package_group');
            $tyre = $line->getAttribute('tyre_variant_id');
            $axle = $line->getAttribute('axle');

            if ($tyre !== null) {
                $byLine[(int) $line->getKey()] = (int) $tyre;

                if ($package !== null) {
                    $byGroup[(int) $package] = (int) $tyre;

                    if ($axle === 'FRONT' || $axle === 'REAR') {
                        $byAxle[(int) $package][$axle] = (int) $tyre;
                    }
                }
            }
        }

        if ($byLine === []) {
            return ['lines' => [], 'groups' => [], 'axles' => []];
        }

        $sizes = TyreVariant::withTrashed()->whereIn('id', array_values(array_unique($byLine)))->get(['id', 'width_mm', 'aspect', 'diameter_in'])->keyBy('id');
        $key = static function (int $id) use ($sizes): ?string {
            $tyre = $sizes->get($id);

            return $tyre instanceof TyreVariant ? TyreSize::keyOf((int) $tyre->width_mm, (int) $tyre->aspect, (float) $tyre->diameter_in) : null;
        };
        $keys = static fn (array $ids): array => array_filter(array_map($key, $ids), static fn (?string $k): bool => $k !== null);

        return [
            'lines' => $keys($byLine),
            'groups' => $keys($byGroup),
            'axles' => array_map($keys, $byAxle),
        ];
    }

    /**
     * The other axle's size on a set per axle (D-335): the papers are the set's, so a line says the Abnahme or Eintragung
     * the other axle's size needs as much as its own (ConditionGroups::entryForSet()). Null on every other line — and
     * where the other axle's tyre is no longer on record, which leaves the line its own size's answer.
     *
     * @param  array{lines: array<int, string>, groups: array<int, string>, axles: array<int, array<string, string>>}  $sizes
     */
    public static function partner(OrderLine $line, array $sizes): ?string
    {
        $package = $line->getAttribute('package_group');
        $other = match ($line->getAttribute('axle')) {
            'FRONT' => 'REAR',
            'REAR' => 'FRONT',
            default => null,
        };

        return $package === null || $other === null ? null : ($sizes['axles'][(int) $package][$other] ?? null);
    }

    /** @param  array{lines: array<int, string>, groups: array<int, string>, axles: array<int, array<string, string>>}  $sizes */
    public static function for(OrderLine $line, array $sizes): ?string
    {
        $own = $sizes['lines'][(int) $line->getKey()] ?? null;

        if ($own !== null) {
            return $own;
        }

        $package = $line->getAttribute('package_group');

        return $package === null ? null : ($sizes['groups'][(int) $package] ?? null);
    }

    /**
     * The axle a line of a set per axle stands on, as the customer reads its Auflagen under it — `Vorderachse`,
     * `Hinterachse` (D-335); null on every other line.
     */
    public static function axle(OrderLine $line): ?string
    {
        return match ($line->getAttribute('axle')) {
            'FRONT' => 'Vorderachse',
            'REAR' => 'Hinterachse',
            default => null,
        };
    }
}
