<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The slow query log (docs/launch/GO-LIVE.md, the first hour): every statement that takes at least
 * `rimify.slow_query_ms` is written to `storage/logs/slow-queries-<day>.log` with its time and the page
 * or command that ran it. The shared host keeps no database slow log a tenant can read, so the
 * application keeps its own.
 *
 * The statement is logged with its placeholders, never its values: a value can be an e-mail address
 * or a name, and a log is not where customer data goes.
 */
final class SlowQueries
{
    public static function listen(): void
    {
        if ((float) config('rimify.slow_query_ms', 500) <= 0) {
            return;
        }

        DB::listen(static function (QueryExecuted $query): void {
            // Read at each statement, not once at boot: switched off (0) in the running app, it writes nothing more —
            // a test that spies on the log says so for itself (the look-back of D-180, D-232).
            $threshold = (float) config('rimify.slow_query_ms', 500);

            if ($threshold <= 0 || $query->time < $threshold) {
                return;
            }

            Log::channel('slow_queries')->warning('Langsame Abfrage', [
                'ms' => (int) round($query->time),
                'sql' => $query->sql,
                'connection' => $query->connectionName,
                'where' => app()->runningInConsole() ? 'console' : request()->method().' /'.ltrim(request()->path(), '/'),
            ]);
        });
    }
}
