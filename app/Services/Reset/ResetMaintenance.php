<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Illuminate\Support\Facades\Artisan;

/**
 * The few seconds a reset of the test environment replaces tables in: every other request gets the maintenance
 * page (errors::503, as a deploy shows it), so nobody reads a table that is being made again. The request running
 * the reset is past the gate already and finishes. Its own class so a test can stand in for it: parallel tests share
 * one storage directory, and one test's maintenance would answer every other test's request with a 503.
 */
class ResetMaintenance
{
    public function on(): void
    {
        Artisan::call('down', ['--render' => 'errors::503', '--retry' => 15]);
    }

    public function off(): void
    {
        Artisan::call('up');
    }

    public function active(): bool
    {
        return app()->isDownForMaintenance();
    }
}
