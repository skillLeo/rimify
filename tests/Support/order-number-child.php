<?php

declare(strict_types=1);
use App\Services\Commerce\OrderNumbers;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

/*
 * One checkout's number draw, for OrderNumberTest's parallel run (his admin item 18, D-354): boots the app against the
 * database its environment names, draws one number inside a transaction as OrderWriter does, and prints it. Started
 * fifty times at once; never run against a database that holds orders.
 */

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo DB::transaction(static fn (): string => OrderNumbers::next());
