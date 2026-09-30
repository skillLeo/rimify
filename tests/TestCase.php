<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\ParallelTesting;

abstract class TestCase extends BaseTestCase
{
    // Declared here rather than in tests/Pest.php so that migrateFreshUsing() below can override
    // the trait's version — a trait applied by Pest on the generated class would win over us.
    use RefreshDatabase;

    /**
     * Parallel processes share the disk, not the database: each gets its own directories for what the demo seeders
     * draw and `demo:purge` removes. One shared directory let a process's purge meet another's seed half-way — the
     * directory the purge had just removed was there again (DemoCataloguePurgeTest in the full run of 01.10.2026).
     */
    protected function setUp(): void
    {
        parent::setUp();

        $token = ParallelTesting::token();

        if ($token !== false) {
            config([
                'rimify.demo.wheels_dir' => config('rimify.demo.wheels_dir').'-'.$token,
                'rimify.demo.placeholders_dir' => config('rimify.demo.placeholders_dir').'-'.$token,
            ]);
        }
    }

    /**
     * Feature tests run against a real MySQL 8.4 database (docs/decisions.md D-009).
     *
     * RIMIFY_MIGRATION_SLICE lets one bounded context be migrated and tested on its own
     * (e.g. "fitment", "commerce") while other slices are still being written. Unset, every
     * registered migration path runs — which is what `composer verify` does.
     *
     * @return array<string, mixed>
     */
    protected function migrateFreshUsing(): array
    {
        $options = [
            '--drop-views' => $this->shouldDropViews(),
            '--drop-types' => $this->shouldDropTypes(),
            '--seed' => $this->shouldSeed(),
        ];

        $slice = getenv('RIMIFY_MIGRATION_SLICE');

        if (is_string($slice) && $slice !== '') {
            $options['--path'] = array_merge(
                ['database/migrations'],
                array_map(
                    static fn (string $name): string => 'database/migrations/'.trim($name),
                    explode(',', $slice),
                ),
            );
        }

        return $options;
    }
}
