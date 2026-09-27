<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
     * Demo rows per table, and the demo queue's jobs. A table without the columns yet (a database
     * before the migration) holds none.
     *
     * @return array<string, int>
     */
    public static function counts(): array
    {
        $counts = [];

        foreach (self::TABLES as $table) {
            $counts[$table] = Schema::hasTable($table) && Schema::hasColumn($table, 'is_demo')
                ? DB::table($table)->where('is_demo', true)->count()
                : 0;
        }

        $counts['jobs'] = Schema::hasTable('jobs') ? DB::table('jobs')->where('queue', self::QUEUE)->count() : 0;

        return $counts;
    }

    public static function total(): int
    {
        return array_sum(self::counts());
    }

    /**
     * The total, read at most every 30 seconds: every admin page asks for it (the rail's strip), and
     * ten counts per page view would be a load of their own. A seed and a purge forget it at once.
     */
    public static function cachedTotal(): int
    {
        return (int) Cache::remember(self::CACHE_KEY, 30, static fn (): int => self::total());
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
        if (! Schema::hasTable('settings')) {
            return null;
        }

        $set = Setting::get(self::SETTING);

        return is_array($set) && is_string($set['anchor'] ?? null) && is_numeric($set['scale'] ?? null)
            ? ['anchor' => $set['anchor'], 'scale' => (float) $set['scale']]
            : null;
    }
}
