<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoTables;
use Database\Seeders\ApprovalSeeder;
use Illuminate\Console\Command;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

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

        // Documents by their own mark, whatever they stand on (decision 6, the operator's brief of 15.10.2026, D-239):
        // the catalogue's count leaves out an example document with a row on a real wheel — the one that could put an
        // invented verdict on a real order.
        $documents = DB::table('approval_documents')
            ->where(static fn (Builder $q) => $q->where('is_demo', true)->orWhere('issuer', ApprovalSeeder::ISSUER))
            ->count();

        if ($documents > ($found['approval_documents'] ?? 0)) {
            $found['approval_documents'] = $documents;
        }

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
