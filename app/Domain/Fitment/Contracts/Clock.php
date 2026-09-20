<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Contracts;

use DateTimeImmutable;

/**
 * Time as a dependency, so `computedAt` on a snapshot is deterministic in a test. A verdict that
 * stamps itself from `now()` cannot be asserted byte for byte, and this object's whole job is to
 * be reproducible.
 */
interface Clock
{
    public function now(): DateTimeImmutable;
}
