<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\PlaceholderPdf;
use Illuminate\Console\Command;

/**
 * `demo:placeholder-pdf --pdf=<file>` — the walkthrough's own placeholder PDF goes back where a released placeholder
 * expects it, where this server's disk lacks it (PlaceholderPdf::restoreFile). Never in the live shop. Until D-459 it
 * was `demo:placeholder-tables` and gave the placeholder an example table of tyre load at speed; every document now reads
 * ETRTO's.
 */
class PlaceholderPdfCommand extends Command
{
    protected $signature = 'demo:placeholder-pdf {--pdf= : the walkthrough\'s placeholder PDF, put back where its document expects it}';

    protected $description = 'Put the walkthrough\'s placeholder PDF back where its Gutachten expects it';

    public function handle(): int
    {
        $pdf = $this->option('pdf');

        if (! is_string($pdf) || $pdf === '') {
            $this->error('Gib die Datei mit --pdf=<Pfad> an.');

            return self::FAILURE;
        }

        if (! is_file($pdf)) {
            $this->error("Keine Datei unter {$pdf}.");

            return self::FAILURE;
        }

        $restored = PlaceholderPdf::restoreFile((string) file_get_contents($pdf));
        $this->info($restored === 0 ? 'Kein Platzhalter-PDF fehlte.' : "{$restored} Platzhalter-PDF wieder abgelegt.");

        return self::SUCCESS;
    }
}
