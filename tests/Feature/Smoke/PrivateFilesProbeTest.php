<?php

declare(strict_types=1);

use App\Services\Smoke\PrivateFilesProbe;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

/*
 * What rimify:smoke asserts about the files that must never leave the server (the operator's brief of 05.10.2026,
 * §2.2): a canary in storage/app/private, one in the reset folder, the newest safety copy and the log, each asked for
 * over HTTP by its path under the project — 403 or 404, never 200 — and the canaries gone again whatever the answer.
 */

beforeEach(function (): void {
    $this->resetDir = storage_path('framework/testing/resets-probe-'.getmypid());
    config(['rimify.reset.dir' => $this->resetDir]);
    File::ensureDirectoryExists($this->resetDir.DIRECTORY_SEPARATOR.'20261004-175904-shop');
    File::put($this->resetDir.DIRECTORY_SEPARATOR.'20261004-175904-shop'.DIRECTORY_SEPARATOR.'snapshot.sql.gz', 'x');
});

afterEach(function (): void {
    File::deleteDirectory($this->resetDir);
});

it('asks for the canaries, the newest safety copy and the log, and passes on 403 and 404 alone', function (): void {
    Http::fake(['*' => Http::response('', 403)]);

    $results = app(PrivateFilesProbe::class)->run('https://shop.test/');
    $paths = array_column($results, 'path');

    expect(PrivateFilesProbe::faults($results))->toBe([])
        ->and($paths)->toContain('/'.str_replace('\\', '/', ltrim(str_replace(base_path(), '', $this->resetDir), '\\/')).'/20261004-175904-shop/snapshot.sql.gz')
        ->and(collect($paths)->filter(fn (string $p): bool => str_contains($p, '/smoke-'))->count())->toBe(2)
        ->and(glob(storage_path('app/private').DIRECTORY_SEPARATOR.'smoke-*'))->toBe([])
        ->and(glob($this->resetDir.DIRECTORY_SEPARATOR.'smoke-*'))->toBe([]);

    Http::assertSent(fn (Request $request): bool => str_starts_with($request->url(), 'https://shop.test/storage/'));
});

it('fails on any other answer, a safety copy that downloads first of all, and still removes its canaries', function (): void {
    Http::fake([
        '*/snapshot.sql.gz' => Http::response('SQL', 200),
        '*' => Http::response('', 404),
    ]);

    $results = app(PrivateFilesProbe::class)->run('https://shop.test');

    expect(PrivateFilesProbe::faults($results))->toHaveCount(1)
        ->and(PrivateFilesProbe::faults($results)[0])->toContain('snapshot.sql.gz antwortet HTTP 200')
        ->and(glob(storage_path('app/private').DIRECTORY_SEPARATOR.'smoke-*'))->toBe([]);
});
