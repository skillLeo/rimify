<?php

declare(strict_types=1);

use App\Services\Reset\BaselineState;
use App\Services\Reset\ResetMaintenance;
use App\Services\Reset\TestEnvironment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeResetMaintenance;
use Tests\Support\ResetFixture;

/*
 * The baseline is tied to the schema (the operator's brief of 05.10.2026, §2.1). A restore brings back the schema that
 * was dumped: run a migration, restore an older baseline, and the database goes back in time while the code moves on.
 * So the baseline records its migrations, its last one and its schema's fingerprint, and a reset refuses — naming both
 * sides, with a non-zero exit and not one row changed — a baseline that does not fit the code or the database.
 */

beforeEach(function (): void {
    $this->resetDir = storage_path('framework/testing/resets-'.(ParallelTesting::token() ?: '0').'-'.bin2hex(random_bytes(4)));
    $this->stale = storage_path('framework/testing/baseline-'.(ParallelTesting::token() ?: '0').'-'.bin2hex(random_bytes(4)).'.sql');
    config(['rimify.reset.dir' => $this->resetDir, 'rimify.reset.allowed' => true]);

    Storage::fake('media_products');
    Storage::fake('docs_public');
    Storage::fake('public');
    $this->app->instance(ResetMaintenance::class, new FakeResetMaintenance);

    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
    File::deleteDirectory($this->resetDir);
    File::delete($this->stale);
});

/**
 * A copy of the repository's baseline with its header changed — the way an older or newer one would read. Always from
 * the repository's file, never from whichever baseline the test has configured by then.
 */
function baselineWith(string $to, Closure $meta): string
{
    $lines = preg_split('/\R/', (string) file_get_contents(base_path('database/baseline/testumgebung.sql'))) ?: [];

    foreach ($lines as $i => $line) {
        if (str_starts_with($line, '--@meta ')) {
            $lines[$i] = '--@meta '.json_encode($meta(json_decode(substr($line, 8), true)), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            break;
        }
    }

    file_put_contents($to, implode("\n", $lines));

    return $to;
}

/** A reset of the shop, as the operator runs it; refused here, so the exit code is what is asked for. */
function resetShop(string $words): void
{
    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain($words)->assertFailed()->run();
}

it('lets a baseline that fits the code and the database be restored', function (): void {
    expect(BaselineState::mismatch(TestEnvironment::baseline(), DB::connection()))->toBeNull()
        ->and(BaselineState::recorded(TestEnvironment::baseline())['last'])->toBe(last(BaselineState::code()));

    $this->artisan('rimify:reset-baseline', ['--check' => true])->expectsOutputToContain('alle '.count(BaselineState::code()).' Migrationen')->assertSuccessful();
});

it('refuses a baseline older than a migration the database has run: a non-zero exit, and not one row changed', function (): void {
    // A migration ran after the baseline was written: a column, and its row in `migrations`.
    DB::statement('ALTER TABLE brands ADD COLUMN probe_after_baseline INT NULL');
    DB::table('migrations')->insert(['migration' => '2099_01_01_000100_probe_after_baseline', 'batch' => 99]);
    $sums = ResetFixture::checksums();

    resetShop('passt nicht zum Stand der Datenbank: Die Vorlage endet mit „'.last(BaselineState::code()).'“, die Datenbank mit „2099_01_01_000100_probe_after_baseline“ (1 Migration fehlt der Vorlage)');

    expect(ResetFixture::checksums())->toBe($sums);
});

it('refuses a database changed outside a migration: the same migrations, another schema', function (): void {
    DB::statement('ALTER TABLE brands ADD COLUMN probe_by_hand INT NULL');
    $sums = ResetFixture::checksums();

    resetShop('Die Datenbank wurde außerhalb einer Migration geändert');

    expect(ResetFixture::checksums())->toBe($sums);
});

it('refuses a baseline the code has outgrown, one from newer code, and one that names no schema — naming both sides', function (): void {
    $code = BaselineState::code();

    $cases = [
        // Older than the code: its last migration is missing.
        [static fn (array $m): array => [...$m, 'migrations' => array_slice($m['migrations'], 0, -1)], 'passt nicht zum Code: Die Vorlage endet mit „'.$code[count($code) - 2].'“, der Code mit „'.last($code).'“ (1 Migration fehlt der Vorlage)'],
        // Newer than the code: a migration this code does not have.
        [static fn (array $m): array => [...$m, 'migrations' => [...$m['migrations'], '2099_01_01_000200_from_a_newer_release']], 'passt nicht zum Code: Die Vorlage endet mit „2099_01_01_000200_from_a_newer_release“, der Code mit „'.last($code).'“ (1 kennt nur die Vorlage)'],
        // From before its state was recorded.
        [static function (array $m): array {
            unset($m['schema']);

            return $m;
        }, 'nennt keinen Fingerabdruck'],
    ];

    foreach ($cases as [$change, $words]) {
        config(['rimify.reset.baseline' => baselineWith($this->stale, $change)]);
        $sums = ResetFixture::checksums();

        resetShop($words);

        expect(ResetFixture::checksums())->toBe($sums);
    }

    // The release build's question, without a database.
    config(['rimify.reset.baseline' => baselineWith($this->stale, $cases[0][0])]);
    $this->artisan('rimify:reset-baseline', ['--check' => true, '--path' => $this->stale])->expectsOutputToContain('1 Migration(en) fehlen ihr')->assertFailed();
});
