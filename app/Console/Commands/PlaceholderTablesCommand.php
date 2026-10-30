<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\PlaceholderTables;
use Illuminate\Console\Command;

/**
 * `demo:placeholder-tables` — the walkthrough's placeholder document gets ABE 55255's example table, marked
 * as the demo seed's (PlaceholderTables). The golden-record walkthrough runs it once its document exists;
 * ApprovalSeeder runs the same step. With `--pdf`, the walkthrough's own placeholder PDF goes back where a
 * released placeholder expects it, where this server's disk lacks it (PlaceholderTables::restoreFile). Never in
 * the live shop.
 */
class PlaceholderTablesCommand extends Command
{
    protected $signature = 'demo:placeholder-tables {--pdf= : the walkthrough\'s placeholder PDF, put back where its document expects it}';

    protected $description = 'Give the walkthrough\'s placeholder Gutachten the example table of tyre load at speed, marked as demo-seeded';

    public function handle(): int
    {
        $seeded = PlaceholderTables::seed();

        $this->info($seeded === 0 ? 'Nichts zu tun.' : "{$seeded} Platzhalter-Gutachten mit Beispieltabelle versehen.");

        $pdf = $this->option('pdf');

        if (is_string($pdf) && $pdf !== '') {
            if (! is_file($pdf)) {
                $this->error("Keine Datei unter {$pdf}.");

                return self::FAILURE;
            }

            $restored = PlaceholderTables::restoreFile((string) file_get_contents($pdf));
            $this->info($restored === 0 ? 'Kein Platzhalter-PDF fehlte.' : "{$restored} Platzhalter-PDF wieder abgelegt.");
        }

        return self::SUCCESS;
    }
}
