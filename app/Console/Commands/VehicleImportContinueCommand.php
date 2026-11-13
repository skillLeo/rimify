<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\VehicleImport;
use App\Services\Admin\Vehicles\Import\ImportUpload;
use App\Services\Admin\Vehicles\Import\VehicleImportWork;
use App\Services\Admin\Vehicles\VehicleImporter;
use Illuminate\Console\Command;

/**
 * The server's work on vehicle files, from the scheduler (D-462): every run that is being read, checked or imported gets
 * its next part, so a file goes on with its page closed — where the host runs the scheduler's cron line (GO-LIVE §6).
 * Without it the runs go on whenever their page asks how far they are. Scheduled every minute (routes/console.php); a
 * run another process works on is left to it.
 */
final class VehicleImportContinueCommand extends Command
{
    protected $signature = 'fahrzeuge:import-weiter {--sekunden=50 : how long this run of the command works at most} {--run= : only this run}';

    protected $description = 'Continue the vehicle imports being read, checked or imported';

    public function handle(VehicleImportWork $work): int
    {
        // A file whose parts stopped coming a day ago is not coming: the run says so, and its part of a file goes.
        VehicleImport::query()->where('status', VehicleImport::UPLOADING)->where('updated_at', '<', now()->subDay())->each(static function (VehicleImport $import): void {
            ImportUpload::forget($import);
            $import->forceFill(['status' => VehicleImport::FAILED, 'error' => 'Das Hochladen dieser Datei wurde nicht abgeschlossen. Lad sie bitte noch einmal hoch.', 'stored_as' => null])->save();
        });

        $until = microtime(true) + max(1, (int) $this->option('sekunden'));
        $only = $this->option('run');

        $ids = VehicleImport::query()
            ->whereIn('status', VehicleImport::WORKING)
            ->when(is_numeric($only), static fn ($query) => $query->whereKey((int) $only))
            ->orderBy('id')
            ->pluck('id');

        foreach ($ids as $id) {
            $left = $until - microtime(true);

            if ($left <= 0) {
                break;
            }

            $work->advance((int) $id, $left);
            $run = VehicleImport::query()->find($id);
            $this->line(sprintf('#%d %s', $id, $run === null ? 'gone' : $run->status));
        }

        // What imports prepared and no run at work needs any more — the rest an import's own sweep had no time for (D-472).
        $cleared = 0;

        while (microtime(true) < $until && ($batch = VehicleImporter::clearStage()) > 0) {
            $cleared += $batch;
        }

        if ($cleared > 0) {
            $this->line(sprintf('work table: %d rows cleared', $cleared));
        }

        return self::SUCCESS;
    }
}
