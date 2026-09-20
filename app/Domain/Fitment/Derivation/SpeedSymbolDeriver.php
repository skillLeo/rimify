<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Derivation;

use InvalidArgumentException;

/**
 * Derives the minimum speed symbol a vehicle's tyres must carry: the first symbol rated at or
 * above the vehicle's top speed.
 *
 * Null or non-positive input returns NULL (R-03). A vehicle faster than every rated symbol
 * resolves to the open-ended top symbol, `(Y)`, which is a real rating rather than a guess.
 *
 * `$marginSteps` raises the answer above the legal minimum by that many steps of the table. It is
 * a commercial policy, configured in `config/rimify.php`, never a value hidden in the reference
 * data — at its default of 0 this class reproduces the legal minimum exactly. It can only ever
 * raise the requirement; there is no permissive direction.
 */
final readonly class SpeedSymbolDeriver
{
    public function __construct(
        private IndexTables $tables,
        private int $marginSteps = 0,
    ) {
        if ($marginSteps < 0) {
            throw new InvalidArgumentException(
                "A speed-symbol margin may not be negative, got [{$marginSteps}]: the derivation is a "
                .'floor, so a margin can only make it stricter.'
            );
        }
    }

    public function forTopSpeed(?int $maxSpeedKmh): ?SpeedSymbol
    {
        if ($maxSpeedKmh === null || $maxSpeedKmh <= 0) {
            return null;
        }

        foreach ($this->tables->speedSymbols as $position => $symbol) {
            if ($symbol->covers($maxSpeedKmh)) {
                return $this->applyMargin($position);
            }
        }

        return null;
    }

    /**
     * The integer rank of a symbol a document printed, or null if it is not one we know.
     *
     * Null rather than 0 on purpose: a rank of zero would compare as "no requirement at all" and
     * let every tyre through, which is the permissive failure this whole design exists to avoid.
     */
    public function rankOf(?string $symbol): ?int
    {
        return $this->tables->speedSymbol($symbol)?->rank;
    }

    /** Walking off the top of the table clamps at the highest symbol, never wraps or returns null. */
    private function applyMargin(int $position): SpeedSymbol
    {
        $symbols = $this->tables->speedSymbols;
        $target = min($position + $this->marginSteps, count($symbols) - 1);

        return $symbols[$target];
    }
}
