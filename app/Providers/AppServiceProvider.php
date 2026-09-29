<?php

declare(strict_types=1);

namespace App\Providers;

use App\Http\RateLimits\ShopRateLimits;
use App\Listeners\FailedJobAlert;
use App\Payments\StripeKeys;
use App\Services\Content\PageContent;
use App\Support\DatabaseEngine;
use App\Support\SlowQueries;
use App\Support\Ssr\BoundedSsrGateway;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Database\Connection;
use Illuminate\Database\Events\ConnectionEstablished;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Inertia\Ssr\HttpGateway;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The SQL modes without which the fitment engine can fail open (MySQL addendum §7).
     *
     * @var list<string>
     */
    private const REQUIRED_SQL_MODES = [
        'STRICT_TRANS_TABLES',
        'ERROR_FOR_DIVISION_BY_ZERO',
        'NO_ZERO_DATE',
        'NO_ZERO_IN_DATE',
        'NO_ENGINE_SUBSTITUTION',
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        self::enforceNoDebugInProduction($this->app);
        // A Stripe key in .env that does not belong here — a live key outside production, a key of
        // the other mode — is not used at all (docs/dev/SECRETS.md).
        StripeKeys::enforce($this->app);

        // Telescope is a dev dependency: never auto-discovered, only registered locally.
        if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }

        // One per request: a signed preview puts a draft in it, and that draft must never outlive
        // the request that asked for it.
        $this->app->scoped(PageContent::class);

        // Server-side rendering with short, bounded waits: a slow or stopped renderer costs a page
        // half a second at most, never the HTTP client's 10 + 30 seconds (BoundedSsrGateway).
        $this->app->singleton(HttpGateway::class, BoundedSsrGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The shop's rate limits: per visitor first, per address only as a fallback, never at the checkout.
        ShopRateLimits::register();

        // Migrations are grouped by bounded context; ordering stays global by filename.
        $this->loadMigrationsFrom([
            database_path('migrations/fitment'),
            database_path('migrations/commerce'),
            database_path('migrations/vehicle_import'),
            database_path('migrations/integration'),
        ]);

        // Strict mode is a correctness requirement on this project: outside it MySQL silently
        // coerces an unparseable axle load to 0, a zero axle load derives a minimum load index
        // of zero, and that permits every tyre. Fail loudly in every environment instead.
        // Once per connection, never from inside itself: a connection lost during the check reconnects, which
        // announces a new connection — asking again there recursed until PHP ran out of memory (seen when the
        // database went away mid-suite). The running check answers for the reconnected connection: Laravel
        // retries its query there once, and a second loss is an ordinary exception.
        Event::listen(ConnectionEstablished::class, function (ConnectionEstablished $event): void {
            if (self::$checkingStrictMode) {
                return;
            }

            self::$checkingStrictMode = true;

            try {
                $this->assertStrictMode($event->connection);
            } finally {
                self::$checkingStrictMode = false;
            }
        });

        Queue::failing(static function (JobFailed $event): void {
            app(FailedJobAlert::class)->handle($event);
        });

        // The shop's own slow query log (storage/logs/slow-queries-*.log): the host keeps none.
        SlowQueries::listen();
    }

    /** True while the strict-mode check runs: a reconnect inside it is not checked a second time. */
    private static bool $checkingStrictMode = false;

    /** Set when production was started with APP_DEBUG=true: rimify:preflight fails on it. */
    public const DEBUG_WAS_ON = 'rimify.debug_was_on';

    /**
     * Never a stack trace in production: a debug flag left on is switched off here, before anything
     * can render, and remembered so rimify:preflight fails until .env is corrected. Every failure is
     * answered by our own error page either way (bootstrap/app.php); the trace goes to the log only.
     */
    public static function enforceNoDebugInProduction(Application $app): void
    {
        if (! $app->environment('production') || config('app.debug') !== true) {
            return;
        }

        config(['app.debug' => false]);
        $app->instance(self::DEBUG_WAS_ON, true);
        error_log('RIMIFY: APP_DEBUG=true in production was switched off; set APP_DEBUG=false in .env.');
    }

    /**
     * Every MySQL-family connection, whatever Laravel calls its driver: the engine is one the suite has run
     * against (DatabaseEngine, D-052), and it is in strict mode. One query for both.
     */
    private function assertStrictMode(Connection $connection): void
    {
        if (! in_array($connection->getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        $row = $connection->selectOne('SELECT @@SESSION.sql_mode AS sql_mode, VERSION() AS version');
        $refusal = DatabaseEngine::refusal((string) ($row->version ?? ''));

        if ($refusal !== null) {
            throw new RuntimeException(sprintf('Connection [%s]: %s', $connection->getName(), $refusal));
        }

        $modes = array_map('trim', explode(',', (string) ($row->sql_mode ?? '')));

        $missing = array_values(array_diff(self::REQUIRED_SQL_MODES, $modes));

        if ($missing !== []) {
            throw new RuntimeException(sprintf(
                'MySQL connection [%s] is not in strict mode; missing sql_mode flags: %s. '
                .'Without strict mode a bad axle load becomes 0 and permits every tyre.',
                $connection->getName(),
                implode(', ', $missing),
            ));
        }
    }
}
