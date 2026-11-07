<?php

declare(strict_types=1);

namespace Tests\E2eData;

use Tests\TestCase;

/**
 * A run that writes into the database it is pointed at and keeps what it wrote: the development shop's, for the e2e specs
 * that read real papers (e2e/bugs/sweep-support.ts, e2e/bugs/ef-support.ts). The base case's RefreshDatabase would empty
 * that database and roll the run back, so it is switched off here. Never part of the Unit or Feature suites (phpunit.xml):
 * run by its path only (D-427).
 */
abstract class IntoNamedDatabase extends TestCase
{
    public function refreshDatabase(): void
    {
        // What this run writes is its purpose: nothing is emptied and nothing is rolled back.
    }
}
