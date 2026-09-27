<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoTables;
use Illuminate\Console\Command;

/**
 * Fails when this database holds a single demo row (R-12: production holds none). Run by the deploy
 * before the migrations and daily in production (routes/console.php). A database from before the
 * demo columns holds none by definition.
 */
final class DemoAssertClean extends Command
{
    protected $signature = 'demo:assert-clean';

    protected $description = 'Fail if this database holds any demo data';

    public function handle(): int
    {
        $found = array_filter(DemoTables::counts());

        if ($found === [] && DemoTables::set() === null) {
            $this->info('No demo data.');

            return self::SUCCESS;
        }

        $this->error('Demo data found in '.app()->environment().':');
        $this->table(['Table', 'Demo rows'], array_map(static fn (string $t, int $n): array => [$t, $n], array_keys($found), $found));

        if (DemoTables::set() !== null) {
            $this->error('The demo anchor setting is present.');
        }

        $this->line('Remove it with `php artisan demo:purge` and find how it got here.');

        return self::FAILURE;
    }
}
