<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoTables;
use Illuminate\Console\Command;

/**
 * The last day of the demo set in place, YYYY-MM-DD (Berlin) — what `demo:seed` and `demo:reanchor` recorded. The browser
 * suite reads it to answer its day-bound specs on that day (E2eToday, D-337); a person reads it to know how old the demo
 * figures are. Fails where no demo set is in place.
 */
final class DemoAnchor extends Command
{
    protected $signature = 'demo:anchor';

    protected $description = 'Print the last day of the demo data in place';

    public function handle(): int
    {
        $set = DemoTables::set();

        if ($set === null) {
            $this->error('No demo data is in place.');

            return self::FAILURE;
        }

        $this->line($set['anchor']);

        return self::SUCCESS;
    }
}
