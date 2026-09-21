<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Derivation;

use InvalidArgumentException;

/**
 * A speed symbol, its integer rank and the speed it is rated for.
 *
 * The rank exists because the symbols are NOT in alphabetical order: H (210 km/h) sits between
 * U (200) and V (240). Comparing the letters is code that reads correct and is wrong, and it is
 * wrong in the permissive direction — a 210 km/h car would be sold a 200 km/h tyre.
 *
 * There is deliberately no way to compare two of these by symbol. `rank` is the only ordering.
 */
final readonly class SpeedSymbol
{
    public function __construct(
        public string $symbol,
        public int $rank,
        /** NULL means "above 300 km/h" — the (Y) case. It is not "unknown". */
        public ?int $maxKmh = null,
    ) {
        if ($symbol === '') {
            throw new InvalidArgumentException('A speed symbol cannot be empty.');
        }

        if ($rank <= 0) {
            throw new InvalidArgumentException("A speed rank must be positive, got [{$rank}].");
        }

        if ($maxKmh !== null && $maxKmh <= 0) {
            throw new InvalidArgumentException("A speed rating must be positive, got [{$maxKmh}].");
        }
    }

    public function isAtLeast(self $other): bool
    {
        return $this->rank >= $other->rank;
    }

    public function stricterOf(?self $other): self
    {
        if ($other === null) {
            return $this;
        }

        return $other->rank > $this->rank ? $other : $this;
    }

    public function covers(int $kmh): bool
    {
        return $this->maxKmh === null || $this->maxKmh >= $kmh;
    }

    public function __toString(): string
    {
        return $this->symbol;
    }
}
