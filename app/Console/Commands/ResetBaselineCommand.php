<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AdminUser;
use App\Models\Setting;
use App\Services\Reset\BaselineState;
use App\Services\Reset\SchemaFingerprint;
use App\Services\Reset\ScratchDatabase;
use App\Services\Reset\SqlSnapshot;
use App\Services\Reset\TestEnvironment;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Database\Seeders\ReviewAccountsSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * `rimify:reset-baseline`: writes database/baseline/testumgebung.sql — a delivered test environment and nothing
 * else: the schema of every table, the reference tables, the seven standard roles with their rights, the three review
 * accounts (with a password nobody knows: D-141, set it with rimify:admin-passwort), the default settings and the
 * delivered pages, FAQ and menus. No catalogue, no car, no order, no demo row.
 *
 * Built in a database of its own on this machine, never on a host, and written so it reads the same however often it
 * is written: one fixed clock, rows in key order, no AUTO_INCREMENT counters. Run after every migration; the reset
 * refuses a baseline whose migrations are not the database's, and BaselineTest fails first.
 */
final class ResetBaselineCommand extends Command
{
    /** The clock every row of the baseline is written at. */
    public const CLOCK = '2026-10-04 00:00:00';

    /** A bcrypt hash of a random password nobody kept: the review accounts in the baseline open with none. */
    public const UNKNOWN_PASSWORD = '$2y$12$Yiv4awpVqNiHAm4h4mkGWekGL6SqXAYBl3q5VfEOHMyzXYDzS.xFW';

    /** Tables whose rows the baseline leaves out: machinery, and the Protokoll (a delivered shop has none). */
    public const STRUCTURE_ONLY = [
        'audit_logs', 'cache', 'cache_locks', 'failed_jobs', 'job_batches', 'jobs', 'notifications', 'password_reset_tokens',
        'sessions', 'telescope_entries', 'telescope_entries_tags', 'telescope_monitoring',
    ];

    protected $signature = 'rimify:reset-baseline
        {--path= : Where to write it (default: the configured baseline)}
        {--check : Only say whether the baseline holds every migration the code ships (exit 1 when not); writes nothing}';

    protected $description = 'Write the baseline a reset of the test environment starts from (local only)';

    public function handle(): int
    {
        if ($this->option('check')) {
            return $this->check((string) ($this->option('path') ?: TestEnvironment::baseline()));
        }

        if (! app()->environment(['local', 'testing'])) {
            $this->error('The baseline is built on a development machine, never on a host.');

            return self::FAILURE;
        }

        $path = (string) ($this->option('path') ?: TestEnvironment::baseline());
        $default = (string) config('database.default');
        $name = substr((string) config("database.connections.{$default}.database"), 0, 50).'_baseline';
        $scratch = ScratchDatabase::create($name, 'baseline');
        $review = config('rimify.review.enabled');
        $telescope = config('telescope.storage.database.connection');

        // Telescope's migration names its own connection: pointed here, or it would run against the app's database.
        config(['telescope.storage.database.connection' => 'baseline']);

        Carbon::setTestNow(self::CLOCK);
        CarbonImmutable::setTestNow(self::CLOCK);

        try {
            $scratch->db()->statement('SET timestamp = UNIX_TIMESTAMP(?)', [self::CLOCK]);

            if ($this->call('migrate', ['--database' => 'baseline', '--force' => true, '--no-interaction' => true]) !== self::SUCCESS) {
                $this->error('The migrations failed on the scratch database.');

                return self::FAILURE;
            }

            config(['rimify.review.enabled' => true]);

            foreach ([ReferenceDataSeeder::class, AccessSeeder::class, ReviewAccountsSeeder::class, ContentSeeder::class] as $seeder) {
                $this->callSilently('db:seed', ['--database' => 'baseline', '--class' => $seeder, '--force' => true, '--no-interaction' => true]);
            }

            DB::setDefaultConnection('baseline');
            $this->onlyReviewAccounts();
            Setting::set(ReleaseSeed::SETTING, ReleaseSeed::VERSION);
            // The row in which a database names its own environment (R-04.1): a baseline is no environment's, and its
            // settings are never loaded anyway — `settings` is a kept table — so it carries none.
            Setting::query()->whereKey(TestEnvironment::MARKER)->delete();

            $tables = array_map(
                static fn (object $r): string => (string) $r->t,
                $scratch->db()->select("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"),
            );
            $migrations = array_map(static fn (mixed $m): string => (string) $m, $scratch->db()->table('migrations')->orderBy('id')->pluck('migration')->all());
            $last = $scratch->db()->table('migrations')->orderByDesc('batch')->orderByDesc('migration')->first(['migration', 'batch']);

            // Its state, so a restore can refuse a baseline that no longer fits (BaselineState, the brief of 05.10.2026,
            // §2.1): the migrations, the last one, the schema's shape — and which app built it, for whoever reads it.
            $summary = (new SqlSnapshot($scratch->db()))->write($path, $tables, [
                'purpose' => 'Grundstand der Testumgebung (php artisan rimify:reset-baseline)',
                'migrations' => $migrations,
                'last_migration' => ['name' => (string) ($last->migration ?? ''), 'batch' => (int) ($last->batch ?? 0)],
                'schema' => SchemaFingerprint::of($scratch->db()),
                'app' => ['commit' => self::commit(), 'release_seed' => ReleaseSeed::VERSION],
            ], self::STRUCTURE_ONLY, portable: true);

            $rows = array_sum(array_map(static fn (array $t): int => $t['rows'], $summary['tables']));
            $this->info(sprintf('Baseline written to %s: %d tables, %d rows, %d triggers, %d migrations.', $path, count($tables), $rows, $summary['triggers'], count($migrations)));

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        } finally {
            DB::setDefaultConnection($default);
            config(['rimify.review.enabled' => $review, 'telescope.storage.database.connection' => $telescope]);
            Carbon::setTestNow();
            CarbonImmutable::setTestNow();
            $scratch->drop();
        }
    }

    /**
     * `--check`: whether the baseline holds exactly the migrations the code ships — read from the files alone, with no
     * database: the release build asks this to decide whether it must build a new baseline (deploy.yml).
     */
    private function check(string $path): int
    {
        try {
            $recorded = BaselineState::recorded($path)['migrations'];
        } catch (Throwable $e) {
            $this->error('Die Vorlage lässt sich nicht lesen: '.$e->getMessage());

            return self::FAILURE;
        }

        $code = BaselineState::code();

        if ($recorded !== $code) {
            $this->error(sprintf(
                'Die Vorlage passt nicht zum Code: %d Migration(en) fehlen ihr, %d kennt nur sie. Neu bauen: php artisan rimify:reset-baseline',
                count(array_diff($code, $recorded)),
                count(array_diff($recorded, $code)),
            ));

            return self::FAILURE;
        }

        $this->info('Die Vorlage enthält alle '.count($code).' Migrationen des Codes.');

        return self::SUCCESS;
    }

    /** The commit the baseline is built from: the release build's, else the working copy's, else none. */
    private static function commit(): ?string
    {
        $sha = getenv('GITHUB_SHA');

        if (is_string($sha) && $sha !== '') {
            return substr($sha, 0, 8);
        }

        $head = function_exists('shell_exec') ? @shell_exec('git rev-parse --short=8 HEAD 2>'.(PHP_OS_FAMILY === 'Windows' ? 'NUL' : '/dev/null')) : null;

        return is_string($head) && preg_match('/^[0-9a-f]{7,40}$/', trim($head)) === 1 ? trim($head) : null;
    }

    /**
     * The development accounts AccessSeeder makes on a local database go; the review accounts stay, with a password
     * nobody knows and no second factor.
     */
    private function onlyReviewAccounts(): void
    {
        $keep = array_keys(ReviewAccountsSeeder::ACCOUNTS);
        $gone = AdminUser::query()->whereNotIn('email', $keep)->pluck('id')->all();

        DB::table('model_has_roles')->where('model_type', (new AdminUser)->getMorphClass())->whereIn('model_id', $gone)->delete();
        DB::table('admin_users')->whereIn('id', $gone)->delete();
        DB::table('admin_users')->whereIn('email', $keep)->update([
            'password' => self::UNKNOWN_PASSWORD,
            'remember_token' => null,
            'totp_secret' => null,
            'totp_confirmed_at' => null,
        ]);
    }
}
