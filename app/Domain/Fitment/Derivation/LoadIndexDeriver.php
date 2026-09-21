<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Derivation;

use InvalidArgumentException;

/**
 * Derives the minimum load index an axle's tyres must carry.
 *
 * Permitted axle load ÷ 2 is the mass on each tyre of that axle; the answer is the first index
 * whose capacity reaches it. Front and rear are derived separately, because they routinely differ
 * by two or three steps on the same car.
 *
 * Null or non-positive input returns NULL, never index 0 and never "no requirement". A zero would
 * permit every tyre — a data defect becoming a legal defect, silently, in the permissive
 * direction (R-03).
 *
 * `$marginSteps` raises the answer above the legal minimum by that many table steps. It is
 * commercial policy from `config/rimify.php`, never a value hidden in the reference data; at its
 * default of 0 this class reproduces the legal minimum exactly, and it can only ever tighten.
 */
final readonly class LoadIndexDeriver
{
    public function __construct(
        private IndexTables $tables,
        private int $marginSteps = 0,
    ) {
        if ($marginSteps < 0) {
            throw new InvalidArgumentException(
                "A load-index margin may not be negative, got [{$marginSteps}]: the derivation is a "
                .'floor, so a margin can only make it stricter.'
            );
        }
    }

    public function forAxle(?int $axleLoadKg): ?LoadIndex
    {
        if ($axleLoadKg === null || $axleLoadKg <= 0) {
            return null;
        }

        // Deliberately not integer division: 1231 kg is 615.5 kg per tyre, and truncating that to
        // 615 would accept an index rated for exactly 615 when 615.5 is actually carried.
        $perTyreKg = $axleLoadKg / 2;

        foreach ($this->tables->loadIndices as $position => $entry) {
            if ($entry->capacityKg >= $perTyreKg) {
                return $this->applyMargin($position);
            }
        }

        // Beyond the passenger-car range: we cannot state a legal minimum, so we do not guess.
        return null;
    }

    /** Walking off the top of the table clamps at the highest index, never wraps or returns null. */
    private function applyMargin(int $position): LoadIndex
    {
        $indices = $this->tables->loadIndices;
        $target = min($position + $this->marginSteps, count($indices) - 1);

        return $indices[$target];
    }
}
