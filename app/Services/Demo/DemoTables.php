<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Models\Setting;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The tables demo rows live in, and how many each holds (R-12: born demo, `is_demo` and `demo_ref`).
 *
 * The order is the purge's: every table before the ones it references, so no delete ever leans on
 * a cascade — MySQL fires no trigger on a cascading delete, and the snapshot rows must go through
 * theirs. Beside the tables: the demo queue's jobs (`demo:break-queue`) and the anchor setting.
 */
final class DemoTables
{
    /** Child first. */
    public const TABLES = [
        'order_line_fitments',
        'order_lines',
        'orders',
        'addresses',
        'customers',
        'verdict_tallies',
        'catalogue_gap_events',
        'audit_logs',
        'admin_users',
    ];

    /** How a table reads in the Protokoll's purge entry. */
    public const LABELS = [
        'order_line_fitments' => 'Prüfnachweise der Bestellpositionen',
        'order_lines' => 'Bestellpositionen',
        'orders' => 'Bestellungen',
        'addresses' => 'Adressen',
        'customers' => 'Kundinnen und Kunden',
        'verdict_tallies' => 'Tageszahlen der Prüfungen',
        'catalogue_gap_events' => 'Nachfrage-Ereignisse',
        'audit_logs' => 'Protokolleinträge',
        'admin_users' => 'Konten des Demo-Teams',
        'jobs' => 'Aufgaben der Demo-Warteschlange',
    ];

    /** The queue `demo:break-queue` stalls. No worker listens to it. */
    public const QUEUE = 'demo';

    /** The setting that records the demo set in place: its anchor day and scale. */
    public const SETTING = 'demo_set';

    private const CACHE_KEY = 'admin.demo_rows';

    /**
     * Demo rows per table, and the demo queue's jobs. The migrations guarantee the columns; no
     * schema lookup is made first (information_schema queries are slow on shared MariaDB, and the
     * rail asks for this on admin pages). A caller that must survive a database without them catches.
     *
     * @return array<string, int>
     */
    public static function counts(): array
    {
        $counts = [];

        foreach (self::TABLES as $table) {
            $counts[$table] = DB::table($table)->where('is_demo', true)->count();
        }

        $counts['jobs'] = DB::table('jobs')->where('queue', self::QUEUE)->count();

        return $counts;
    }

    public static function total(): int
    {
        return array_sum(self::counts());
    }

    /**
     * The total, read at most every five minutes: every admin page asks for it (the rail's strip), and
     * ten counts per page view would be a load of their own. A seed and a purge forget it at once.
     */
    public static function cachedTotal(): int
    {
        return (int) Cache::remember(self::CACHE_KEY, 300, static fn (): int => self::total());
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * The demo set in place, as the seeder recorded it.
     *
     * @return array{anchor: string, scale: float}|null
     */
    public static function set(): ?array
    {
        try {
            $set = Setting::get(self::SETTING);
        } catch (QueryException) {
            // A database before the settings table: no set recorded.
            return null;
        }

        return is_array($set) && is_string($set['anchor'] ?? null) && is_numeric($set['scale'] ?? null)
            ? ['anchor' => $set['anchor'], 'scale' => (float) $set['scale']]
            : null;
    }
}
