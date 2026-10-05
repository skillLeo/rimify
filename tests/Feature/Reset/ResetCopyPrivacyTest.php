<?php

declare(strict_types=1);

use App\Services\Reset\ResetMaintenance;
use App\Services\Reset\SealedFile;
use App\Services\Reset\SqlSnapshot;
use App\Services\Reset\TestReset;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeResetMaintenance;
use Tests\Support\ResetFixture;

/*
 * A reset's safety copy holds the shop's customers, and on the host it lies under the domain (the operator's brief of
 * 05.10.2026, §2.2): written sealed, never as plain text, in folders only this account reads; a copy from before that
 * day is sealed by the next prune without being lost; and what the command prints is the copy's own size and that it was
 * read back — not a free-space figure the host does not mean.
 */

beforeEach(function (): void {
    $this->resetDir = storage_path('framework/testing/resets-'.(ParallelTesting::token() ?: '0').'-'.bin2hex(random_bytes(4)));
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
});

it('writes the safety copy sealed, leaves no plain text behind, and says its size and that it was read back', function (): void {
    ResetFixture::realShop();

    $this->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])
        ->expectsOutputToContain('verschlüsselt, gelesen und geprüft (')
        ->assertSuccessful();

    $folder = File::directories($this->resetDir)[0];
    $copy = $folder.'/'.TestReset::SNAPSHOT;

    expect(SealedFile::isSealed($copy))->toBeTrue()
        ->and(is_file($folder.'/'.TestReset::LEGACY_SNAPSHOT))->toBeFalse()
        ->and(str_contains((string) file_get_contents($copy), 'INSERT INTO'))->toBeFalse()
        ->and(str_contains((string) @gzdecode((string) file_get_contents($copy)), 'INSERT INTO'))->toBeFalse()
        ->and(array_merge(glob($folder.'/*.part') ?: [], glob($folder.'/*.open') ?: [], glob($folder.'/*.sealing') ?: []))->toBe([])
        ->and(SqlSnapshot::summary($copy)['tables'])->toHaveKey('order_line_fitments')
        ->and(ResetFixture::manifest($this->resetDir)['backup']['bytes'])->toBe(filesize($copy));

    // On a host's file system, the folder and everything in it are this account's alone. (Windows has no such modes.)
    if (PHP_OS_FAMILY !== 'Windows') {
        clearstatcache();
        expect(fileperms($this->resetDir) & 0777)->toBe(0700)
            ->and(fileperms($folder) & 0777)->toBe(0700)
            ->and(fileperms($copy) & 0777)->toBe(0600);
    }

    // The sealed copy undoes the reset as a plain one did.
    $this->artisan('rimify:reset', ['--undo' => true, '--force' => true])->assertSuccessful();

    expect(DB::table('brands')->where('slug', 'rimify')->exists())->toBeTrue();
});

it('seals a plain copy from before 05.10.2026 at the next prune, byte for byte, and keeps its undo', function (): void {
    // A copy as the old code wrote it: plain gzip, in a reset's folder, still inside its seven days.
    $folder = $this->resetDir.'/'.CarbonImmutable::now('UTC')->subDay()->format('Ymd-His').'-shop';
    File::ensureDirectoryExists($folder);
    $legacy = $folder.'/'.TestReset::LEGACY_SNAPSHOT;
    $tables = ResetFixture::tables();
    (new SqlSnapshot(DB::connection()))->write($legacy, $tables, ['purpose' => 'alt']);
    file_put_contents($folder.'/manifest.json', json_encode(['op' => 'reset', 'level' => 'shop', 'at' => CarbonImmutable::now('UTC')->subDay()->toIso8601String()]));
    $before = SqlSnapshot::summary($legacy);

    $this->artisan('rimify:reset', ['--prune' => true])->expectsOutputToContain('0 alte Sicherung(en) entfernt, 1 verschlüsselt.')->assertSuccessful();

    $sealed = $folder.'/'.TestReset::SNAPSHOT;

    expect(is_file($legacy))->toBeFalse()
        ->and(SealedFile::isSealed($sealed))->toBeTrue()
        ->and(SqlSnapshot::summary($sealed))->toBe($before)
        ->and(TestReset::snapshotIn($folder))->toBe($sealed);

    // Nothing more to seal the next time.
    $this->artisan('rimify:reset', ['--prune' => true])->expectsOutputToContain('0 verschlüsselt.')->assertSuccessful();
});
