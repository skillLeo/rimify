<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoGuard;
use App\Services\Demo\DemoTables;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Shows the Systemzustand's red state on demand: one job on a queue no worker listens to, waiting
 * since 23 hours ago. `demo:purge` takes it away with the rest of the demo set.
 */
final class DemoBreakQueue extends Command
{
    protected $signature = 'demo:break-queue';

    protected $description = 'Leave one job waiting on a queue nobody works, to show a stuck queue';

    public function handle(): int
    {
        $refusal = DemoGuard::refusal();

        if ($refusal !== null) {
            $this->error($refusal);

            return self::FAILURE;
        }

        $since = now()->subHours(23)->getTimestamp();

        DB::table('jobs')->insert([
            'queue' => DemoTables::QUEUE,
            'payload' => json_encode([
                'uuid' => (string) Str::uuid(),
                'displayName' => 'Demo: eine Aufgabe, die niemand abholt',
                'job' => 'Illuminate\\Queue\\CallQueuedHandler@call',
                'maxTries' => 1,
                'data' => ['commandName' => 'demo', 'command' => ''],
            ], JSON_THROW_ON_ERROR),
            'attempts' => 0,
            'reserved_at' => null,
            'available_at' => $since,
            'created_at' => $since,
        ]);

        $this->info('One job waits on the demo queue since 23 hours ago. demo:purge removes it.');

        return self::SUCCESS;
    }
}
