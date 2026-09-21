<?php

declare(strict_types=1);

namespace Tests\Support\Fitment;

use App\Domain\Fitment\Contracts\Clock;
use DateTimeImmutable;

/** A clock that does not move, so a verdict can be asserted byte for byte. */
final readonly class FixedClock implements Clock
{
    public function __construct(private string $at = '2026-09-21T14:22:31+00:00') {}

    public function now(): DateTimeImmutable
    {
        return new DateTimeImmutable($this->at);
    }
}
