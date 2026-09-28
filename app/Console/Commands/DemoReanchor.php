<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoDashboard;
use App\Services\Demo\DemoGuard;
use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoTables;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Moves the demo set to end today: removed (DemoPurge, recorded) and written again on the new
 * anchor, at the scale it had. Never a shift of timestamps in place — the snapshots and the
 * Protokoll are never updated, demo rows included (R-12).
 */
final class DemoReanchor extends Command
{
    protected $signature = 'demo:reanchor {--anchor= : The new last day, YYYY-MM-DD (Berlin); today by default}';

    protected $description = 'Remove the demo data and write it again, ending on a new day';

    public function handle(DemoPurge $purge): int
    {
        // Checked before anything is removed: a reanchor that cannot write must not only delete.
        $refusal = DemoGuard::refusal();

        if ($refusal !== null) {
            $this->error($refusal);

            return self::FAILURE;
        }

        $anchor = DemoSeed::anchor($this->option('anchor'));

        if ($anchor === null) {
            $this->error('The anchor is a date written YYYY-MM-DD.');

            return self::INVALID;
        }

        $scale = DemoSeed::scaleInPlace();
        $was = DemoTables::set()['anchor'] ?? null;
        $demo = app(DemoDashboard::class);

        // One transaction: a seed that fails puts the old set back, rather than leaving none.
        try {
            DB::transaction(static function () use ($purge, $demo, $anchor, $scale): void {
                // The figures only: they are written again at once, on the same example catalogue.
                $purge->run(DemoPurgeCommand::operator('demo:reanchor'), catalogue: false);
                $demo->seed($anchor, (float) $scale);
            });
        } catch (RuntimeException $e) {
            $this->error($e->getMessage().' The demo data is as it was.');

            return self::FAILURE;
        }

        $this->info(sprintf('Demo data moved from %s to %s at scale %s.', $was ?? 'nothing', $anchor->toDateString(), $scale));

        return self::SUCCESS;
    }
}
