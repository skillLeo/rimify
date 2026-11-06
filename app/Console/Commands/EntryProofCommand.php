<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\CombinationCensus;
use App\Services\Admin\Approvals\Entry\DocumentEntryProof;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Reads, writes nothing: whether every paper's entry would write back the rows the shop reads (the Gutachten rework §6), and,
 * with --urteile=file, every verdict the shop gives — car × rim, the Komplettrad and its combinations — into a file, so a
 * copy of a live database can be compared before and after the migration, line by line.
 */
final class EntryProofCommand extends Command
{
    protected $signature = 'rimify:erfassung-pruefen {--urteile= : writes every verdict to this file} {--nur-urteile : leaves out the papers, for a database before the migration}';

    protected $description = 'Read-only: does every paper\'s entry write back the rows the shop reads, and what does the shop answer';

    public function handle(CombinationCensus $census): int
    {
        $failed = 0;

        if (! $this->option('nur-urteile')) {
            if (! Schema::hasTable('document_car_entries')) {
                $this->error('Die Tabellen der Erfassung fehlen: zuerst migrieren, oder --nur-urteile.');

                return self::FAILURE;
            }

            $proof = new DocumentEntryProof(new DocumentEntryWriter);
            $papers = 0;

            foreach (ApprovalDocument::query()->orderBy('id')->cursor() as $document) {
                $papers++;
                $differences = $proof->differences($document);

                if ($differences !== []) {
                    $failed++;
                    $this->error("Gutachten #{$document->id}: ".implode('; ', array_slice($differences, 0, 5)));
                }
            }

            $this->info("{$papers} Gutachten geprüft, {$failed} mit Abweichung.");
        }

        $file = $this->option('urteile');

        if (is_string($file) && $file !== '') {
            $answers = $census->take(new EloquentFitmentRepository);
            file_put_contents($file, json_encode($answers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
            $this->info(count($answers).' Urteile in '.$file.', sha256 '.hash_file('sha256', $file));
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
