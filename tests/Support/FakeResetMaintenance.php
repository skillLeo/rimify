<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Services\Reset\ResetMaintenance;

/**
 * The maintenance switch of a reset, counted instead of thrown: parallel tests share one storage directory, and a real
 * `artisan down` would answer every other test's request with a 503.
 */
final class FakeResetMaintenance extends ResetMaintenance
{
    public int $ons = 0;

    public bool $down = false;

    public function on(): void
    {
        $this->ons++;
        $this->down = true;
    }

    public function off(): void
    {
        $this->down = false;
    }

    public function active(): bool
    {
        return $this->down;
    }
}
