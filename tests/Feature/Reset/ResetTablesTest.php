<?php

declare(strict_types=1);

use App\Console\Commands\ResetBaselineCommand;
use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetTables;
use App\Services\Reset\SqlSnapshot;
use App\Services\Reset\TestEnvironment;
use Illuminate\Support\Facades\DB;

/*
 * Every table says whether a reset of the test environment keeps it, puts the delivered content back into it, or
 * empties it — and the baseline in the repository is the one the migrations make today. A new table or a new
 * migration fails here first, not on the preview.
 */

function rtTables(): array
{
    return array_map(
        static fn (object $r): string => (string) $r->t,
        DB::select("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"),
    );
}

it('puts every table of the schema in exactly one group, and names none that is not there', function (): void {
    $tables = rtTables();
    $groups = [...ResetTables::KEPT, ...ResetTables::CONTENT, ...ResetTables::SHOP];

    expect(ResetTables::unclassified($tables))->toBe([])
        ->and(array_diff($groups, $tables))->toBe([])
        ->and(count($groups))->toBe(count(array_unique($groups)));
});

it('never lets a level replace the team, the settings, the Protokoll or the frozen invoice numbers', function (): void {
    foreach (ResetLevel::cases() as $level) {
        expect(array_intersect(ResetTables::replacedBy($level), ['admin_users', 'roles', 'role_permissions', 'settings', 'audit_logs', 'invoice_sequences', 'migrations']))->toBe([]);
    }

    expect(ResetTables::replacedBy(ResetLevel::Demo))->toBe([])
        ->and(ResetTables::replacedBy(ResetLevel::Shop))->not->toContain('pages')
        ->and(ResetTables::replacedBy(ResetLevel::All))->toContain('pages', 'faq_entries', 'nav_items');
});

it('keeps a baseline made from the migrations as they are now, with every table and every trigger', function (): void {
    $path = TestEnvironment::baseline();
    $meta = SqlSnapshot::meta($path);
    $summary = SqlSnapshot::summary($path);

    $migrator = app('migrator');
    $files = array_keys($migrator->getMigrationFiles(array_merge([database_path('migrations')], $migrator->paths())));
    sort($files);
    $recorded = array_values(array_filter((array) $meta['migrations'], 'is_string'));
    sort($recorded);

    $triggers = (int) DB::selectOne('SELECT COUNT(*) AS n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()')->n;

    expect($meta['format'])->toBe(SqlSnapshot::FORMAT)
        ->and($summary)->not->toBeNull()
        // A migration without a new baseline: php artisan rimify:reset-baseline (with the suite's MariaDB in .env).
        ->and($recorded)->toBe($files)
        // The same tables, in whatever order the engine lists them: MariaDB and MySQL sort „review_feedback“ and
        // „reviews“ differently, and the suite runs on both.
        ->and(array_keys($summary['tables']))->toEqualCanonicalizing(rtTables())
        ->and($summary['triggers'])->toBe($triggers);
});

it('holds a delivered shop and nothing else: no catalogue, no car, no order, no demo row, no known password', function (): void {
    $summary = SqlSnapshot::summary(TestEnvironment::baseline());
    $rows = array_map(static fn (array $t): int => $t['rows'], $summary['tables']);

    foreach (ResetTables::SHOP as $table) {
        expect($rows[$table])->toBe(0, "{$table} has rows in the baseline");
    }

    expect($rows['audit_logs'])->toBe(0)
        ->and($rows['admin_users'])->toBe(3)
        ->and($rows['roles'])->toBe(7)
        ->and($rows['pages'])->toBeGreaterThan(0)
        ->and($rows['load_index_table'])->toBeGreaterThan(0);

    $sql = (string) file_get_contents(TestEnvironment::baseline());

    // The three review accounts, opening with a password nobody knows (D-141) — not the development accounts.
    expect($sql)->toContain('verkauf@rimify.test', 'lager@rimify.test', 'admin@rimify.test', ResetBaselineCommand::UNKNOWN_PASSWORD)
        ->and($sql)->not->toContain('super-admin@rimify.test')
        ->and(substr_count($sql, ResetBaselineCommand::UNKNOWN_PASSWORD))->toBe(3)
        // Loadable by any account: no trigger names its definer.
        ->and($sql)->not->toMatch('/DEFINER\s*=/i')
        // No environment's: the row in which a database names its own (R-04.1) is never in the baseline.
        ->and($sql)->not->toContain(TestEnvironment::MARKER);
});
