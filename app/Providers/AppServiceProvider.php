<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Database\Connection;
use Illuminate\Database\Events\ConnectionEstablished;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
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
        // Telescope is a dev dependency: never auto-discovered, only registered locally.
        if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
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
        Event::listen(ConnectionEstablished::class, function (ConnectionEstablished $event): void {
            $this->assertStrictMode($event->connection);
        });
    }

    private function assertStrictMode(Connection $connection): void
    {
        if ($connection->getDriverName() !== 'mysql') {
            return;
        }

        $row = $connection->selectOne('SELECT @@SESSION.sql_mode AS sql_mode');
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
