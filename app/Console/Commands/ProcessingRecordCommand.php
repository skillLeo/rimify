<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Legal\ProcessingRecord;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * `rimify:verarbeitung`: writes docs/legal/VERARBEITUNG.md from this installation's configuration (ProcessingRecord,
 * the brief „AFTER CI“, §6) — run where the configuration is the real one, on the server, and the file brought back
 * into the repository. `--stdout` prints it instead.
 */
final class ProcessingRecordCommand extends Command
{
    protected $signature = 'rimify:verarbeitung
        {--path=docs/legal/VERARBEITUNG.md : Where to write it, relative to the project}
        {--stdout : Print it instead of writing it}';

    protected $description = 'Write the record of who processes personal data for the shop, and for how long, from the configuration';

    public function handle(ProcessingRecord $record): int
    {
        $markdown = $record->markdown();

        if ($this->option('stdout')) {
            $this->output->write($markdown);

            return self::SUCCESS;
        }

        $path = base_path((string) $this->option('path'));
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $markdown);
        $this->info('Written to '.$this->option('path').'.');

        return self::SUCCESS;
    }
}
