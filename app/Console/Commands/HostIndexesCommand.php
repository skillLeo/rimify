<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Admin\AuditTrail;
use App\Services\Reset\HostIndexes;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * `rimify:host-indizes` — the plain `wdbi_` indexes the preview's host adds on its own (HostIndexes, D-476, D-477): named,
 * and with `--entfernen` removed. Every release runs it before its migrations (deploy/remote.sh), so a migration never
 * meets an index it did not make; each one removed is written to the log and the Protokoll with its columns, so it can be
 * put back by hand if ever wanted.
 */
final class HostIndexesCommand extends Command
{
    protected $signature = 'rimify:host-indizes {--entfernen : remove them, not only name them}';

    protected $description = 'Name — and with --entfernen remove — the plain wdbi_ indexes the host added on its own';

    public function handle(): int
    {
        $db = DB::connection();
        $found = $this->option('entfernen') ? HostIndexes::remove($db) : HostIndexes::in($db);

        if ($found === []) {
            $this->info('Keine Indizes des Hosts (wdbi_…) in dieser Datenbank.');

            return self::SUCCESS;
        }

        foreach ($found as $index) {
            $this->line(sprintf('%s.%s (%s)', $index['table'], $index['name'], implode(', ', $index['columns'])));
        }

        if (! $this->option('entfernen')) {
            $this->info(count($found).' Index'.(count($found) === 1 ? '' : 'e').' des Hosts. Mit --entfernen werden sie entfernt.');

            return self::SUCCESS;
        }

        Log::warning('Indizes des Hosts entfernt', ['indexes' => $found]);
        AuditTrail::system('System', 'schema.host_indexes_removed', ['count' => count($found), 'indexes' => $found]);
        $this->info(count($found).' Index'.(count($found) === 1 ? '' : 'e').' des Hosts entfernt.');

        return self::SUCCESS;
    }
}
