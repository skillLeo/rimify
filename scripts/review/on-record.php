<?php

/*
 * Writes docs/review/ON-RECORD.md — R-17's ledger as the table the operator reads — from the ledger and the scan
 * (Tests\Support\OnRecordTable). Run after changing tests/Support/on-record-ledger.php or a sentence it lists:
 *
 *     php scripts/review/on-record.php
 */

declare(strict_types=1);

use Tests\Support\OnRecord;
use Tests\Support\OnRecordTable;

$root = dirname(__DIR__, 2);

require $root.'/vendor/autoload.php';

/** @var array<string, array{0: string, 1: string}> $ledger */
$ledger = require $root.'/tests/Support/on-record-ledger.php';

file_put_contents($root.'/'.OnRecordTable::FILE, OnRecordTable::render($ledger, OnRecord::claims($root)));

echo 'written '.OnRecordTable::FILE.PHP_EOL;
