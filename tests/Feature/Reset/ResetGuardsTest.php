<?php

declare(strict_types=1);

use App\Console\Commands\ResetCommand;
use App\Models\AuditLog;
use App\Services\Demo\DemoPurge;
use App\Services\Reset\ResetDisk;
use App\Services\Reset\ResetFiles;
use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetMaintenance;
use App\Services\Reset\ResetOrigin;
use App\Services\Reset\ResetProbe;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\ResetTables;
use App\Services\Reset\SqlSnapshot;
use App\Services\Reset\TestEnvironment;
use App\Services\Reset\TestReset;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\ParallelTesting;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeResetMaintenance;
use Tests\Support\ResetFixture;

/*
 * The guards around Testumgebung zurücksetzen (the reset brief of 05.10.2026, §3; CLAUDE.md R-04.1, R-12.3), each with
 * a test that fails the moment its guard is taken out:
 *
 *  - the append-only guard survives a restore: a restore that brings back a Prüfnachweis taking an UPDATE, or an order
 *    line whose key cascades, fails the reset, puts the copy back and names the check; a database that lost the guard
 *    before is not reset at all;
 *  - production refuses, and writes nothing; the server's flag alone is not enough, a test environment alone is not
 *    enough, the live database refuses, and no caller but the command and the screen reaches the engine;
 *  - a copy the disk has no room for is never begun, and a copy that cannot be written to the end leaves nothing behind.
 */

beforeEach(function (): void {
    $this->resetDir = storage_path('framework/testing/resets-'.(ParallelTesting::token() ?: '0').'-'.bin2hex(random_bytes(4)));
    config(['rimify.reset.dir' => $this->resetDir, 'rimify.reset.allowed' => true]);

    Storage::fake('media_products');
    Storage::fake('docs_public');
    Storage::fake('public');

    $this->maintenance = new FakeResetMaintenance;
    $this->app->instance(ResetMaintenance::class, $this->maintenance);

    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    app()->detectEnvironment(static fn (): string => 'testing');
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
    File::deleteDirectory($this->resetDir);
});

/**
 * The engine with a restore that breaks something once, after it has made the tables again — the way a dump loaded
 * without its DEFINERs can come back (D-050). Putting the copy back never goes through it.
 */
function sabotagedRestore(Closure $sabotage): void
{
    $engine = new class(app(ResetFiles::class), app(ResetMaintenance::class), app(DemoPurge::class), app(ResetProbe::class), app(ResetDisk::class)) extends TestReset
    {
        public ?Closure $sabotage = null;

        protected function replaceTables(array $tables, string $structure, ?string $rows, array $floors = []): void
        {
            parent::replaceTables($tables, $structure, $rows, $floors);

            if ($this->sabotage !== null) {
                ($this->sabotage)();
                $this->sabotage = null;
            }
        }
    };

    $engine->sabotage = $sabotage;
    app()->instance(TestReset::class, $engine);
}

/** A trigger that is still there by name, and refuses nothing: the count of triggers cannot tell. */
function neuterTrigger(string $name, string $table, string $event): void
{
    DB::unprepared('DROP TRIGGER '.$name);
    DB::unprepared("CREATE TRIGGER {$name} BEFORE {$event} ON {$table} FOR EACH ROW SET @rimify_probe_noop = 1");
}

function failedChecks(string $event): array
{
    return array_column(AuditLog::query()->where('description', $event)->latest('id')->firstOrFail()->properties['failures'], 'check');
}

/* ── §3.1 · The triggers and the foreign key, proven after every restore ────────────────────────────── */

it('fails a reset whose restore brings back a Prüfnachweis that takes an UPDATE, puts the copy back and names the check', function (): void {
    $real = ResetFixture::realShop();
    $shop = ResetFixture::counts(ResetTables::SHOP);
    $triggers = ResetFixture::triggers();

    sabotagedRestore(static fn () => neuterTrigger('trg_olf_no_update', 'order_line_fitments', 'UPDATE'));

    // One line says both: put back, and why (each expected text must be a line of its own).
    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])
        ->expectsOutputToContain('wieder genau wie vorher. Grund: Prüfung nach dem Einspielen fehlgeschlagen: Eine Änderung an einem Prüfnachweis wurde nicht abgelehnt')
        ->assertFailed()
        ->run();

    expect(ResetFixture::counts(ResetTables::SHOP))->toBe($shop)
        ->and(ResetFixture::triggers())->toBe($triggers)
        ->and(failedChecks('system.reset_failed'))->toBe(['snapshot_update'])
        ->and(AuditLog::query()->where('description', 'system.reset')->exists())->toBeFalse()
        ->and(TestEnvironment::shopEmptied())->toBeFalse()
        ->and($this->maintenance->down)->toBeFalse()
        // The copy put back is checked too: the guard is whole again.
        ->and(app(ResetProbe::class)->failures())->toBe([])
        ->and(fn () => DB::table('order_line_fitments')->where('order_line_id', $real['line'])->update(['engine_version' => 'x']))
        ->toThrow(QueryException::class, 'append-only');
});

it('fails a reset whose restore lets an order line cascade past its Prüfnachweis (no error 1451)', function (): void {
    ResetFixture::realShop();
    $shop = ResetFixture::counts(ResetTables::SHOP);
    $key = (string) DB::selectOne("SELECT CONSTRAINT_NAME AS n FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'order_line_fitments' AND REFERENCED_TABLE_NAME = 'order_lines'")->n;

    // Two statements: MariaDB refuses to drop and add a key of the same name in one.
    sabotagedRestore(static function () use ($key): void {
        DB::statement("ALTER TABLE order_line_fitments DROP FOREIGN KEY {$key}");
        DB::statement("ALTER TABLE order_line_fitments ADD CONSTRAINT {$key} FOREIGN KEY (order_line_id) REFERENCES order_lines (id) ON DELETE CASCADE");
    });

    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])
        ->expectsOutputToContain('wieder genau wie vorher. Grund: Prüfung nach dem Einspielen fehlgeschlagen: Das Löschen einer Bestellposition mit Prüfnachweis wurde nicht abgelehnt (erwartet: Fehler 1451, ON DELETE RESTRICT)')
        ->assertFailed()
        ->run();

    expect(ResetFixture::counts(ResetTables::SHOP))->toBe($shop)
        ->and(failedChecks('system.reset_failed'))->toBe(['snapshot_restrict'])
        ->and(DB::selectOne('SELECT DELETE_RULE AS r FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = ?', [$key])->r)->toBe('RESTRICT');
});

it('fails an undo whose restore brings back a Prüfnachweis that can be deleted, and keeps the reset as it was', function (): void {
    ResetFixture::realShop();
    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->assertSuccessful()->run();

    sabotagedRestore(static fn () => neuterTrigger('trg_olf_no_delete', 'order_line_fitments', 'DELETE'));

    test()->artisan('rimify:reset', ['--undo' => true, '--force' => true])->expectsOutputToContain('wieder genau wie vorher')->assertFailed()->run();

    expect(DB::table('wheel_models')->count())->toBe(0)
        ->and(failedChecks('system.reset_failed'))->toBe(['snapshot_delete'])
        ->and(TestEnvironment::shopEmptied())->toBeTrue()
        ->and(app(ResetProbe::class)->failures())->toBe([]);
});

it('does not reset a database whose Protokoll already takes an UPDATE: refused before anything, and recorded', function (): void {
    $shop = ResetFixture::counts(ResetTables::SHOP);
    neuterTrigger('trg_audit_no_update', 'audit_logs', 'UPDATE');

    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])
        ->expectsOutputToContain('Eine Änderung an einem Protokolleintrag wurde nicht abgelehnt')
        ->assertFailed()
        ->run();

    expect(ResetFixture::counts(ResetTables::SHOP))->toBe($shop)
        ->and(failedChecks('system.reset_refused'))->toBe(['audit_update'])
        ->and($this->maintenance->ons)->toBe(0)
        ->and(glob($this->resetDir.'/*', GLOB_ONLYDIR))->toBe([]);
});

it('proves the guard on the rows that are there and on a throwaway order where the shop is empty, and keeps neither', function (): void {
    $orders = DB::table('orders')->count();
    $entries = DB::table('audit_logs')->count();

    expect(app(ResetProbe::class)->failures())->toBe([]);

    // An empty shop, as after a reset: the order tables made again from their own definitions, never deleted (R-12.3).
    $copy = $this->resetDir.'/structure.sql.gz';
    (new SqlSnapshot(DB::connection()))->write($copy, ResetFixture::tables());
    (new SqlSnapshot(DB::connection()))->replace(['order_line_fitments', 'order_lines', 'orders'], $copy, null);

    expect(DB::table('orders')->count())->toBe(0)
        ->and(app(ResetProbe::class)->failures())->toBe([])
        ->and(DB::table('orders')->count())->toBe(0)
        ->and(DB::table('order_line_fitments')->count())->toBe(0)
        ->and(DB::table('audit_logs')->count())->toBe($entries)
        ->and($orders)->toBeGreaterThan(0);
});

/* ── §3.2 · Production refuses — proven, not read off the code ──────────────────────────────────────── */

it('refuses in production with a non-zero exit and writes nothing — not even with the server\'s flag set', function (): void {
    $sums = ResetFixture::checksums();

    app()->detectEnvironment(static fn (): string => 'production');
    config(['rimify.reset.allowed' => true]);

    foreach ([['--level' => 'shop'], ['--level' => 'demo'], ['--level' => 'all'], ['--undo' => true], ['--recover' => true], ['--prune' => true]] as $options) {
        test()->artisan('rimify:reset', $options + ['--force' => true])->expectsOutputToContain('nie im Live-Shop')->assertFailed()->run();
    }

    app()->detectEnvironment(static fn (): string => 'testing');

    expect(ResetFixture::checksums())->toBe($sums)
        ->and(is_dir($this->resetDir))->toBeFalse()
        ->and($this->maintenance->ons)->toBe(0);
});

it('needs the flag and a test environment and a test database: any one of them alone is refused, and writes nothing', function (): void {
    $refused = function (string $words): void {
        $sums = ResetFixture::checksums();
        test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain($words)->assertFailed()->run();
        expect(ResetFixture::checksums())->toBe($sums)->and(is_dir($this->resetDir))->toBeFalse();
    };

    // A test environment without the flag — and a flag that is anything but exactly true.
    foreach ([false, null, 'true', '1', 1] as $flag) {
        config(['rimify.reset.allowed' => $flag]);
        $refused('nicht freigegeben');
    }

    config(['rimify.reset.allowed' => true]);

    // The flag and a test environment, on the live shop's database: the row the migration wrote there says so.
    DB::table('settings')->where('key', TestEnvironment::MARKER)->update(['value' => json_encode('production')]);
    $refused('Datenbank des Live-Shops');

    // A database that does not say which it is: not vouched for.
    DB::table('settings')->where('key', TestEnvironment::MARKER)->delete();
    $refused('nicht vermerkt, zu welcher Umgebung');

    expect($this->maintenance->ons)->toBe(0);
});

it('cannot be reached from other code: the engine refuses any caller but the running command and the screen', function (): void {
    $sums = ResetFixture::checksums();
    $engine = app(TestReset::class);

    $origins = [
        // The command, but not running — made by code, as a seeder or a job would.
        ResetOrigin::console(new ResetCommand),
        // A request that is not one of the screen's two POSTs.
        ResetOrigin::screen(request()),
        ResetOrigin::screen(Request::create('/admin/system/zuruecksetzen', 'POST')),
    ];

    foreach ($origins as $origin) {
        expect(fn () => $engine->reset(ResetLevel::Shop, 'Code', $origin))->toThrow(ResetRefused::class, ResetOrigin::REFUSAL)
            ->and(fn () => $engine->undo('Code', $origin))->toThrow(ResetRefused::class, ResetOrigin::REFUSAL);
    }

    expect(ResetFixture::checksums())->toBe($sums)
        ->and(is_dir($this->resetDir))->toBeFalse()
        ->and($this->maintenance->ons)->toBe(0);
});

/* ── §3.3 · Room for the copy, before a byte of it ──────────────────────────────────────────────────── */

it('refuses before the copy when the disk has no room for it, and begins no copy', function (): void {
    ResetFixture::realShop();
    $shop = ResetFixture::counts(ResetTables::SHOP);

    $this->app->instance(ResetDisk::class, new class extends ResetDisk
    {
        public function free(string $dir): ?float
        {
            return 4096.0;
        }
    });

    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('nicht genug Speicherplatz')->assertFailed()->run();

    expect(ResetFixture::counts(ResetTables::SHOP))->toBe($shop)
        ->and(glob($this->resetDir.'/*', GLOB_ONLYDIR))->toBe([])
        ->and($this->maintenance->ons)->toBe(0);
});

it('refuses where the server does not say how much room there is', function (): void {
    $this->app->instance(ResetDisk::class, new class extends ResetDisk
    {
        public function free(string $dir): ?float
        {
            return null;
        }
    });

    test()->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('wie viel Speicherplatz')->assertFailed()->run();

    expect(glob($this->resetDir.'/*', GLOB_ONLYDIR))->toBe([]);
});

it('leaves nothing behind when a copy cannot be written to its end', function (): void {
    $path = $this->resetDir.'/broken/snapshot.sql.gz';

    expect(fn () => (new SqlSnapshot(DB::connection()))->write($path, ['brands', 'no_such_table']))->toThrow(QueryException::class);

    expect(is_file($path))->toBeFalse()
        ->and(is_file($path.'.part'))->toBeFalse();
});
