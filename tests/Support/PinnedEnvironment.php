<?php

declare(strict_types=1);

namespace Tests\Support;

use RuntimeException;

/**
 * The test run's environment, pinned (D-180). Every variable the application reads is listed in tests/env.php with
 * the value a test sees — null for unset, the config's own default — and applied before Laravel boots: by
 * tests/bootstrap.php in every process, and by Tests\CreatesApplication in a parallel run's main process, which boots
 * the application once per worker before PHPUnit loads the bootstrap. Nothing else gets in: .env.testing (empty) keeps
 * Laravel from loading a developer's .env, every pin wins over the shell, and the run is refused while the shell sets a
 * variable the application reads that the list does not name.
 *
 * Why: RIMIFY_RESET_ERLAUBT=true in one machine's .env made three tests pass there that CI failed for a day, and
 * twenty green rounds on that machine could not see it (D-179). The fix was one flag; this closes the class.
 */
final class PinnedEnvironment
{
    /**
     * The one choice a machine makes: which database server the run uses — CI starts its own, `composer test:mysql`
     * points at MySQL 8.4. It says so with these names, which the application never reads, so no .env can stand in for
     * them; each maps onto its DB_* pin. A DB_* the shell sets is refused (see dbConflicts()).
     */
    public const MACHINE = [
        'TEST_DB_HOST' => 'DB_HOST',
        'TEST_DB_PORT' => 'DB_PORT',
        'TEST_DB_DATABASE' => 'DB_DATABASE',
        'TEST_DB_USERNAME' => 'DB_USERNAME',
        'TEST_DB_PASSWORD' => 'DB_PASSWORD',
    ];

    /**
     * The committed list's fingerprint: the SHA-256 of tests/env.php, line ends as LF, in a file beside it. The list is
     * the one file whose job is to make the suite honest, and a tool that rewrites it — the look-back flips a pin, runs,
     * and puts it back — can die in between: the machine went down mid-flip once, and the next run there would have read
     * a poisoned pin and reported green. A run on a list that is not the committed one is refused (changedPins()).
     */
    public const FINGERPRINT = 'tests/env.sha256';

    /**
     * Said by the one run that changes pins on purpose, the look-back (D-180) — `TEST_LOOKBACK=1` — and by nothing else:
     * with it the fingerprint is not asked for. A name the application never reads, as the TEST_DB_* are.
     */
    public const LOOKBACK = 'TEST_LOOKBACK';

    /** Files that replace what the pins decide: a cached config skips the environment altogether. */
    public const CACHES = ['bootstrap/cache/config.php', 'bootstrap/cache/routes-v7.php', 'bootstrap/cache/events.php'];

    /** Where the run's own reads are: the application (env(), getenv(), Env::get(), $_SERVER, $_ENV) and the test harness. */
    private const OWN = ['app', 'bootstrap', 'routes', 'database', 'resources/views', 'tests'];

    /** The list itself and this class name variables without reading them. */
    private const NOT_READS = ['tests/env.php', 'tests/Support/PinnedEnvironment.php'];

    /**
     * Read by the framework and never pinned: the parallel runner sets the first three for its workers, PHP and a
     * request fill the rest. Pinning one would unset what makes the run work.
     */
    private const RUNNER = ['TEST_TOKEN', 'LARAVEL_PARALLEL_TESTING', 'LARAVEL_INVOKABLE_CLOSURE', 'PHP_SELF', 'SCRIPT_NAME', 'SCRIPT_FILENAME', 'DOCUMENT_ROOT', 'PATH_TRANSLATED'];

    private const RUNNER_PREFIXES = ['HTTP_', 'REQUEST_', 'REMOTE_'];

    private static bool $applied = false;

    /**
     * Every variable the run reads, with where: env('KEY') under config/; env, getenv, Env::get, $_SERVER and $_ENV with a
     * literal key in the application's code and the test harness; and — with $vendor — env('KEY') in every installed
     * package's config/, which Laravel merges, and the reads of laravel/framework itself (its cache paths among them).
     *
     * @return array<string, list<string>>
     */
    public static function readKeys(string $root, bool $vendor = true): array
    {
        $keys = [];
        $note = static function (string $key, string $where) use (&$keys): void {
            $keys[$key] ??= [];

            if (! in_array($where, $keys[$key], true)) {
                $keys[$key][] = $where;
            }
        };

        foreach (self::phpFiles($root.'/config') as $file) {
            foreach (self::envKeys((string) file_get_contents($file), false) as $key) {
                $note($key, self::relative($root, $file));
            }
        }

        foreach (self::OWN as $area) {
            foreach (self::phpFiles($root.'/'.$area) as $file) {
                $relative = self::relative($root, $file);

                if (str_starts_with($relative, 'bootstrap/cache/') || in_array($relative, self::NOT_READS, true)) {
                    continue;
                }

                foreach (self::envKeys((string) file_get_contents($file), true) as $key) {
                    $note($key, $relative);
                }
            }
        }

        if ($vendor) {
            foreach (glob($root.'/vendor/*/*/config', GLOB_ONLYDIR) ?: [] as $dir) {
                foreach (self::phpFiles($dir) as $file) {
                    foreach (self::envKeys((string) file_get_contents($file), false) as $key) {
                        $note($key, self::relative($root, $file));
                    }
                }
            }

            foreach (self::phpFiles($root.'/vendor/laravel/framework/src') as $file) {
                foreach (self::envKeys((string) file_get_contents($file), true) as $key) {
                    if (! self::runnerOwned($key)) {
                        $note($key, 'laravel/framework');
                    }
                }
            }
        }

        ksort($keys);

        return $keys;
    }

    /**
     * The variables the shell sets that the application reads and the list does not name: the run is refused while there
     * is one (a value nobody pinned would decide a test). Names compare as the platform does — case-blind on Windows.
     *
     * @param  array<string, string>  $ambient
     * @param  array<string, string|null>  $pins
     * @param  array<string, mixed>  $read
     * @return list<string>
     */
    public static function refusal(array $ambient, array $pins, array $read): array
    {
        $pinned = array_flip(array_map(self::fold(...), array_keys($pins)));
        $readKeys = array_flip(array_map(self::fold(...), array_keys($read)));
        $unpinned = [];

        foreach (array_keys($ambient) as $key) {
            $k = self::fold((string) $key);

            if (isset($readKeys[$k]) && ! isset($pinned[$k])) {
                $unpinned[] = $k;
            }
        }

        sort($unpinned);

        return array_values(array_unique($unpinned));
    }

    /**
     * What each pinned variable will hold in the run: the pin, or — for a DB_* key — the machine's TEST_DB_* when set.
     *
     * @param  array<string, string|null>  $pins
     * @param  array<string, string>  $ambient
     * @return array<string, string|null>
     */
    public static function effective(array $pins, array $ambient): array
    {
        $machine = [];

        foreach (self::MACHINE as $from => $to) {
            $value = self::lookup($ambient, $from);

            if ($value !== null) {
                $machine[$to] = $value;
            }
        }

        $effective = [];

        foreach ($pins as $key => $value) {
            $effective[$key] = array_key_exists($key, $machine) ? $machine[$key] : $value;
        }

        return $effective;
    }

    /**
     * The DB_* variables the shell sets to something other than what the run will use. Refused rather than overridden:
     * a developer who exported DB_PORT=3307 meant MySQL, and a run that quietly used MariaDB instead would report on an
     * engine nobody asked about. A worker inherits its main process's DB_* — equal to the effective value, never refused.
     *
     * @param  array<string, string>  $ambient
     * @param  array<string, string|null>  $effective
     * @return list<string>
     */
    public static function dbConflicts(array $ambient, array $effective): array
    {
        $conflicts = [];

        foreach (self::MACHINE as $from => $to) {
            $shell = self::lookup($ambient, $to);

            if ($shell !== null && $shell !== ($effective[$to] ?? null)) {
                $conflicts[] = "{$to}={$shell} (set {$from} instead)";
            }
        }

        return $conflicts;
    }

    /**
     * The cache files present under $root: each replaces part of what the pins decide.
     *
     * @return list<string>
     */
    public static function caches(string $root): array
    {
        return array_values(array_filter(self::CACHES, static fn (string $file): bool => is_file($root.'/'.$file)));
    }

    /** A file's fingerprint: SHA-256 with line ends as LF, so a checkout that writes CRLF reads the same. */
    public static function fingerprint(string $file): string
    {
        return hash('sha256', str_replace("\r\n", "\n", (string) file_get_contents($file)));
    }

    /**
     * Why the run is refused when the list under $root is not the committed one — null when it is. A missing fingerprint
     * is refused too: nothing then says which list this is.
     */
    public static function changedPins(string $root): ?string
    {
        $recorded = is_file($root.'/'.self::FINGERPRINT) ? trim((string) file_get_contents($root.'/'.self::FINGERPRINT)) : '';
        $actual = self::fingerprint($root.'/tests/env.php');

        if ($recorded === $actual) {
            return null;
        }

        return 'tests/env.php is not the committed list: its fingerprint is '.$actual.', '.self::FINGERPRINT.' '
            .($recorded === '' ? 'is missing or empty' : 'says '.$recorded).'. A run on other pins reports on another '
            .'environment and can read green where the suite is red (D-180). If a tool left the file changed, restore it '
            .'(`git checkout -- tests/env.php`); if the list was changed on purpose, write the new fingerprint into '
            .self::FINGERPRINT.'. Only the look-back runs on changed pins, and says so with '.self::LOOKBACK.'=1.';
    }

    /**
     * apply(), once per process: a parallel run's main process reaches it through Tests\CreatesApplication once per
     * worker and again through tests/bootstrap.php, and the scan behind the refusal costs a moment each time.
     *
     * @param  array<string, string|null>  $pins
     */
    public static function applyOnce(array $pins, string $root): void
    {
        if (self::$applied) {
            return;
        }

        self::apply($pins, $root);
        self::$applied = true;
    }

    /**
     * Refuses a cached config, a list that is not the committed one, an unpinned variable or a DB_* from the shell, then
     * writes every pin where Laravel reads
     * it ($_SERVER first, $_ENV, the process environment) and removes every null from all three.
     *
     * @param  array<string, string|null>  $pins
     */
    public static function apply(array $pins, string $root): void
    {
        $caches = self::caches($root);

        if ($caches !== []) {
            throw new RuntimeException(
                'Cached files replace the pinned environment: '.implode(', ', $caches).'. Run `php artisan optimize:clear` '
                .'first — a cached config skips every variable tests/env.php pins (D-180).'
            );
        }

        /** @var array<string, string> $ambient */
        $ambient = getenv();

        if (self::lookup($ambient, self::LOOKBACK) !== '1') {
            $changed = self::changedPins($root);

            if ($changed !== null) {
                throw new RuntimeException($changed);
            }
        }

        $unpinned = self::refusal($ambient, $pins, self::readKeys($root));

        if ($unpinned !== []) {
            throw new RuntimeException(
                'The shell sets variables the application reads that tests/env.php does not pin: '.implode(', ', $unpinned)
                .'. Pin each in tests/env.php (a value, or null for the config default) or unset it — a value nobody pinned '
                .'would decide a test (D-180).'
            );
        }

        $effective = self::effective($pins, $ambient);
        $conflicts = self::dbConflicts($ambient, $effective);

        if ($conflicts !== []) {
            throw new RuntimeException(
                'The shell sets '.implode(', ', $conflicts).'. A test run takes its database only from TEST_DB_HOST, '
                .'TEST_DB_PORT, TEST_DB_DATABASE, TEST_DB_USERNAME and TEST_DB_PASSWORD, so no .env can point it '
                .'elsewhere (D-180).'
            );
        }

        foreach ($effective as $key => $value) {
            if ($value === null) {
                putenv($key);
                unset($_ENV[$key], $_SERVER[$key]);

                continue;
            }

            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }

    private static function runnerOwned(string $key): bool
    {
        if (in_array($key, self::RUNNER, true)) {
            return true;
        }

        foreach (self::RUNNER_PREFIXES as $prefix) {
            if (str_starts_with($key, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /** @param  array<string, string>  $ambient */
    private static function lookup(array $ambient, string $key): ?string
    {
        foreach ($ambient as $name => $value) {
            if (self::fold((string) $name) === self::fold($key)) {
                return $value;
            }
        }

        return null;
    }

    private static function fold(string $key): string
    {
        return PHP_OS_FAMILY === 'Windows' ? strtoupper($key) : $key;
    }

    /** @return list<string> */
    private static function envKeys(string $source, bool $code): array
    {
        $pattern = $code
            ? "/(?:\\b(?:env|getenv|Env::get|normalizeCachePath)\\(\\s*'([A-Z][A-Z0-9_]*)'|\\\$_(?:SERVER|ENV)\\['([A-Z][A-Z0-9_]*)'\\])/"
            : "/\\benv\\(\\s*'([A-Z][A-Z0-9_]*)'/";
        preg_match_all($pattern, $source, $matches);

        $keys = array_merge($matches[1], $matches[2] ?? []);

        return array_values(array_unique(array_filter($keys, static fn (string $key): bool => $key !== '')));
    }

    /** @return list<string> */
    private static function phpFiles(string $dir): array
    {
        if (! is_dir($dir)) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS));

        foreach ($iterator as $file) {
            if ($file instanceof \SplFileInfo && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        sort($files);

        return $files;
    }

    private static function relative(string $root, string $file): string
    {
        return ltrim(str_replace('\\', '/', substr($file, strlen($root))), '/');
    }
}
