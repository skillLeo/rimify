<?php

declare(strict_types=1);

use App\Support\SlowQueries;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/*
 * The shop's own slow query log (docs/launch/GO-LIVE.md §8): a statement over the threshold is written
 * with its time and where it ran — with its placeholders, never its values.
 */

beforeEach(function (): void {
    $this->dir = storage_path('framework/testing/slow-'.bin2hex(random_bytes(4)));
    File::ensureDirectoryExists($this->dir);
    config(['logging.channels.slow_queries.path' => $this->dir.'/slow-queries.log']);
});

afterEach(function (): void {
    File::deleteDirectory($this->dir);
});

function slowLog(string $dir): string
{
    return implode('', array_map('file_get_contents', glob($dir.'/*.log') ?: []));
}

it('writes a statement over the threshold with its time and place, never its values', function (): void {
    config(['rimify.slow_query_ms' => 0.000001]);
    SlowQueries::listen();

    DB::select('select ? as address', ['kundin@example.com']);

    $log = slowLog($this->dir);

    expect($log)->toContain('Langsame Abfrage')
        ->and($log)->toContain('select ? as address')
        ->and($log)->toContain('"where":"console"')
        ->and($log)->not->toContain('kundin@example.com');
});

it('writes nothing under the threshold, and nothing at all when it is switched off', function (): void {
    config(['rimify.slow_query_ms' => 60_000]);
    SlowQueries::listen();
    config(['rimify.slow_query_ms' => 0]);
    SlowQueries::listen();

    DB::select('select 1');

    expect(slowLog($this->dir))->toBe('');
});
