<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    // Declared here rather than in tests/Pest.php so that migrateFreshUsing() below can override
    // the trait's version — a trait applied by Pest on the generated class would win over us.
    use RefreshDatabase;

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
