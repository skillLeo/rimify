<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoTables;
use Illuminate\Console\Command;

/**
 * Removes the demo set: the rows born demo, child first, in one transaction, after one entry in the
 * Protokoll that stays (DemoPurge). Nothing else is touched.
 */
final class DemoPurgeCommand extends Command
{
    protected $signature = 'demo:purge {--force : Do not ask first}';

    protected $description = 'Remove every demo row (and only those), recorded in the Protokoll';

    public function handle(DemoPurge $purge): int
    {
        $counts = DemoTables::counts();

        if (array_sum($counts) === 0 && DemoTables::set() === null) {
            $this->info('No demo data to remove.');

            return self::SUCCESS;
        }

        $this->table(['Table', 'Demo rows'], array_map(static fn (string $t, int $n): array => [$t, $n], array_keys($counts), $counts));

        if (! $this->option('force') && ! $this->confirm(sprintf('Remove these %d demo rows?', array_sum($counts)), true)) {
            $this->line('Nothing removed.');

            return self::SUCCESS;
        }

        $removed = $purge->run(self::operator('demo:purge'));
        $this->info(sprintf('Removed %d demo rows; one entry in the Protokoll says so.', array_sum($removed)));

        return self::SUCCESS;
    }

    /** Who ran it, as the Protokoll names them: the console, and the account it ran under. */
    public static function operator(string $command): string
    {
        $user = get_current_user();

        return $user === '' ? "Konsole ({$command})" : "Konsole ({$command}, {$user})";
    }
}
