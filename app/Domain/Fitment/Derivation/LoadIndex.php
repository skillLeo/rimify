<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Derivation;

use InvalidArgumentException;

/**
 * A load index and the mass one tyre carrying it may bear.
 *
 * A value object rather than a bare integer, because the two numbers must travel together: a
 * verdict that says "minimum load index 91" is only checkable if 91's capacity is known.
 */
final readonly class LoadIndex
{
    public function __construct(
        public int $index,
        public int $capacityKg,
    ) {
        if ($index <= 0) {
            throw new InvalidArgumentException("A load index must be positive, got [{$index}].");
        }

        if ($capacityKg <= 0) {
            throw new InvalidArgumentException("A load capacity must be positive, got [{$capacityKg}].");
        }
    }

    /** Comparison is by index, which is monotonic in capacity across the whole table. */
    public function isAtLeast(self $other): bool
    {
        return $this->index >= $other->index;
    }

    public function stricterOf(?self $other): self
    {
        if ($other === null) {
            return $this;
        }

        return $other->index > $this->index ? $other : $this;
    }

    public function __toString(): string
    {
        return (string) $this->index;
    }
}
