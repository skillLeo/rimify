<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

/**
 * Takes the demo set away: exactly the rows born demo (R-12) and the example catalogue they were drawn
 * on (DemoCatalogue), child first, in one transaction — and before any of it goes, one entry in the
 * Protokoll that is not demo and stays: how many rows of which table, the anchor they were seeded on,
 * who ran it and where.
 *
 * Allowed wherever demo rows are found: it removes nothing else, and if demo rows ever reached a
 * database they must not be in, this is how they leave it. Refused as a whole (DemoPurgeRefused) while
 * something real still names the example catalogue — never half a purge.
 *
 * `demo:reanchor` and a release that renews the figures pass `catalogue: false`: they write the figures
 * again at once, on the same example catalogue.
 */
final class DemoPurge
{
    /**
     * @param  string  $operator  who ran it, in words: „Konsole (deploy)“, or the admin's name
     * @return array<string, int> the rows removed, per table
     *
     * @throws DemoPurgeRefused
     */
    public function run(string $operator, ?AdminUser $by = null, bool $catalogue = true): array
    {
        $counts = $catalogue ? DemoTables::counts() : DemoTables::setCounts();
        $set = DemoTables::set();

        if (array_sum($counts) === 0 && $set === null) {
            return $counts;
        }

        if ($catalogue) {
            $reasons = DemoCatalogue::blockers();

            if ($reasons !== []) {
                throw new DemoPurgeRefused($reasons);
            }
        }

        DB::transaction(function () use ($counts, $set, $operator, $by, $catalogue): void {
            $this->record($counts, $set, $operator, $by);

            foreach (DemoTables::TABLES as $table) {
                // The CHECK keeps `is_demo` and `demo_ref` together: every row matched is born demo.
                DB::table($table)->where('is_demo', true)->whereNotNull('demo_ref')->delete();
            }

            DB::table('jobs')->where('queue', DemoTables::QUEUE)->delete();
            Setting::query()->whereKey(DemoTables::SETTING)->delete();

            if ($catalogue) {
                DemoCatalogue::purge();
            }
        });

        DemoTables::forget();

        if ($catalogue) {
            DemoCatalogue::forgetDrawings();
        }

        return $counts;
    }

    /**
     * @param  array<string, int>  $counts
     * @param  array{anchor: string, scale: float}|null  $set
     */
    private function record(array $counts, ?array $set, string $operator, ?AdminUser $by): void
    {
        $logger = activity('admin')
            ->withProperties([
                'tables' => array_filter($counts),
                'total' => array_sum($counts),
                'anchor' => $set['anchor'] ?? null,
                'scale' => $set['scale'] ?? null,
                'operator' => $operator,
                'environment' => (string) app()->environment(),
            ])
            ->tap(static function (AuditLog $entry) use ($by, $operator): void {
                $entry->forceFill([
                    'actor_email' => $by->email ?? $operator,
                    'ip_address' => app()->runningInConsole() ? null : request()->ip(),
                ]);
            });

        if ($by !== null) {
            $logger->causedBy($by);
        }

        $logger->log('demo.purged');
    }
}
