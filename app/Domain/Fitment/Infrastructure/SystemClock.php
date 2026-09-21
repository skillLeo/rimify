<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Infrastructure;

use App\Domain\Fitment\Contracts\Clock;
use DateTimeImmutable;
use DateTimeZone;

/** Wall-clock time, always UTC. Timestamps are stored UTC and rendered Europe/Berlin at the edges. */
final readonly class SystemClock implements Clock
{
    public function now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new DateTimeZone('UTC'));
    }
}
