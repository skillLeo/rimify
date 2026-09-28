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

        return $this->forAxleAt($axleLoadKg, 100);
    }

    /**
     * The first index whose capacity, at `$percent` of it (the document's table of tyre load at speed),
     * carries half the axle: `2 × capacity × percent ≥ 100 × axle load`.
     *
     * In whole numbers only — no division, no float, no rounding anywhere in the decision (the operator's
     * second review of C9, §1). 617,5 kg ÷ 0,95 is exactly 650 in arithmetic and not in IEEE 754, where it
     * comes out a hair above 650 and would demand the next index for a legal tyre. In integers the rear
     * axle of the RS 4 reads 2 × 650 × 95 = 123.500 against 100 × 1.235 = 123.500: equal, so LI 93 passes,
     * on every machine. 1231 kg — 615,5 kg a tyre — still needs more than an index rated for exactly 615.
     *
     * Null beyond the passenger-car table, never a guess.
     */
    public function forAxleAt(int $axleLoadKg, int $percent): ?LoadIndex
    {
        if ($axleLoadKg <= 0 || $percent <= 0 || $percent > 100) {
            return null;
        }

        $needed = 100 * $axleLoadKg;

        foreach ($this->tables->loadIndices as $position => $entry) {
            if (2 * $entry->capacityKg * $percent >= $needed) {
                return $this->applyMargin($position);
            }
        }

        // Beyond the passenger-car range: we cannot state a legal minimum, so we do not guess.
        return null;
    }

    /**
     * The index whose capacity is exactly this many kilograms — how a document's load-index limit is read:
     * every such limit is twice a capacity from the table (T88 → 1.120 kg = 2 × 560 kg). Null otherwise.
     */
    public function indexForCapacity(int $capacityKg): ?LoadIndex
    {
        foreach ($this->tables->loadIndices as $entry) {
            if ($entry->capacityKg === $capacityKg) {
                return $entry;
            }
        }

        return null;
    }

    /** The capacity of one index, in kilograms — null for an index the table does not know. */
    public function capacityOf(int $index): ?int
    {
        return $this->tables->loadIndex($index)?->capacityKg;
    }

    /** Walking off the top of the table clamps at the highest index, never wraps or returns null. */
    private function applyMargin(int $position): LoadIndex
    {
        $indices = $this->tables->loadIndices;
        $target = min($position + $this->marginSteps, count($indices) - 1);

        return $indices[$target];
    }
}
