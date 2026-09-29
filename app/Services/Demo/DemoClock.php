<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Domain\Fitment\Contracts\Clock;
use DateTimeImmutable;

/**
 * The resolver's clock while demo orders are written: set to the moment each order was placed, so
 * its snapshot says it was computed at the sale — and says the same on every run.
 */
final class DemoClock implements Clock
{
    public function __construct(private DateTimeImmutable $at) {}

    public function set(DateTimeImmutable $at): void
    {
        $this->at = $at;
    }

    public function now(): DateTimeImmutable
    {
        return $this->at;
    }
}
