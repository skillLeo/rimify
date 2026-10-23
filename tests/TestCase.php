<?php

declare(strict_types=1);

namespace Tests;

use App\Services\Mail\DnsLookup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Routing\Events\RouteMatched;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\ParallelTesting;
use Tests\Support\PinnedEnvironment;

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

        // No test asks the network's DNS (SenderDns): every name answers nothing, unless a test binds records of its own.
        $this->app->instance(DnsLookup::class, new class extends DnsLookup
        {
            public function records(string $host, int $type): array
            {
                return [];
            }
        });

        $token = ParallelTesting::token();

        if ($token !== false) {
            config([
                'rimify.demo.wheels_dir' => config('rimify.demo.wheels_dir').'-'.$token,
                'rimify.demo.placeholders_dir' => config('rimify.demo.placeholders_dir').'-'.$token,
            ]);
        }

        // The admin audit's evidence (docs/review/ADMIN-AUDIT.md): with TEST_ROUTE_LOG naming a file, every route a test
        // reaches is written there — `METHOD uri` — so each row of the inventory names the tests behind it. Off otherwise.
        $routeLog = getenv(PinnedEnvironment::ROUTE_LOG);

        if (is_string($routeLog) && $routeLog !== '') {
            Event::listen(RouteMatched::class, static function (RouteMatched $matched) use ($routeLog): void {
                file_put_contents($routeLog, $matched->request->getMethod().' '.$matched->route->uri()."\n", FILE_APPEND | LOCK_EX);
            });
        }
    }

    /**
     * Feature tests run against a real MySQL 8.4 database (docs/decisions.md D-009), every bounded context migrated.
     * The RIMIFY_MIGRATION_SLICE switch of D-013 is gone (D-180): a shell variable deciding which tables a test sees is
     * the class of bug the pinned environment closes.
     *
     * @return array<string, mixed>
     */
    protected function migrateFreshUsing(): array
    {
        return [
            '--drop-views' => $this->shouldDropViews(),
            '--drop-types' => $this->shouldDropTypes(),
            '--seed' => $this->shouldSeed(),
        ];
    }
}
