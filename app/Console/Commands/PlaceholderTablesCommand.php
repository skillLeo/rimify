<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\PlaceholderTables;
use Illuminate\Console\Command;

/**
 * `demo:placeholder-tables` — the walkthrough's placeholder document gets ABE 55255's example table, marked
 * as the demo seed's (PlaceholderTables). The golden-record walkthrough runs it once its document exists;
 * ApprovalSeeder runs the same step. Never in the live shop.
 */
class PlaceholderTablesCommand extends Command
{
    protected $signature = 'demo:placeholder-tables';

    protected $description = 'Give the walkthrough\'s placeholder Gutachten the example table of tyre load at speed, marked as demo-seeded';

    public function handle(): int
    {
        $seeded = PlaceholderTables::seed();

        $this->info($seeded === 0 ? 'Nichts zu tun.' : "{$seeded} Platzhalter-Gutachten mit Beispieltabelle versehen.");

        return self::SUCCESS;
    }
}
