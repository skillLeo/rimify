<?php

declare(strict_types=1);

use Tests\Support\PinnedEnvironment;

/*
 * The test run's environment is pinned (D-180): every variable the application reads is in tests/env.php, so no
 * machine's .env or shell can decide a test. A developer's RIMIFY_RESET_ERLAUBT=true made three tests pass on one machine
 * that failed in CI for a day (D-179) — this suite fails the day someone adds a variable and forgets to pin it, the one
 * moment the fix is cheap.
 */

function pinnedRoot(): string
{
    return dirname(__DIR__, 2);
}

/** @return array<string, string|null> */
function pinnedList(): array
{
    return require pinnedRoot().'/tests/env.php';
}

it('pins every variable config/ and the application code read, and names any it does not', function (): void {
    $read = PinnedEnvironment::readKeys(pinnedRoot(), vendor: false);
    $missing = array_diff_key($read, pinnedList());

    expect($missing)->toBe([], 'Read by the application, not pinned in tests/env.php: '.implode(', ', array_map(
        static fn (string $key, array $where): string => $key.' ('.implode(', ', $where).')',
        array_keys($missing),
        $missing,
    )));
});

it('pins every variable an installed package\'s config reads, since Laravel merges it', function (): void {
    $missing = array_keys(array_diff_key(PinnedEnvironment::readKeys(pinnedRoot()), pinnedList()));

    expect($missing)->toBe([], 'Read by a package config, not pinned in tests/env.php: '.implode(', ', $missing));
});

it('pins nothing the application no longer reads, so the list stays the list', function (): void {
    $stale = array_keys(array_diff_key(pinnedList(), PinnedEnvironment::readKeys(pinnedRoot())));

    expect($stale)->toBe([], 'Pinned in tests/env.php, read nowhere: '.implode(', ', $stale));
});

it('pins with a string as a .env line carries it, or null for the config default — nothing else', function (): void {
    foreach (pinnedList() as $key => $value) {
        expect($value === null || is_string($value))->toBeTrue("{$key} is pinned to a ".get_debug_type($value));
    }
});

it('runs only on the committed list: its fingerprint stands beside it, and a list a tool left changed is refused', function (): void {
    // The list in the repository is the one its fingerprint names.
    expect(PinnedEnvironment::changedPins(pinnedRoot()))->toBeNull();

    // A copy with one pin flipped — what the look-back left behind when the machine went down mid-run.
    $root = sys_get_temp_dir().'/rimify-pins-'.bin2hex(random_bytes(4));
    mkdir($root.'/tests', 0777, true);
    $list = (string) file_get_contents(pinnedRoot().'/tests/env.php');
    file_put_contents($root.'/tests/env.php', preg_replace("/'RIMIFY_FEATURE_PARTNERS' => null,/", "'RIMIFY_FEATURE_PARTNERS' => 'true',", $list, 1, $flipped));
    copy(pinnedRoot().'/'.PinnedEnvironment::FINGERPRINT, $root.'/'.PinnedEnvironment::FINGERPRINT);

    try {
        expect($flipped)->toBe(1)
            ->and(PinnedEnvironment::changedPins($root))->toContain('is not the committed list')->toContain('git checkout -- tests/env.php')
            ->and(fn () => PinnedEnvironment::apply(require $root.'/tests/env.php', $root))->toThrow(RuntimeException::class, 'is not the committed list');

        // A checkout that writes CRLF is the same list.
        file_put_contents($root.'/tests/env.php', str_replace("\n", "\r\n", str_replace("\r\n", "\n", $list)));
        expect(PinnedEnvironment::changedPins($root))->toBeNull();

        // No fingerprint, no run: nothing then says which list this is.
        unlink($root.'/'.PinnedEnvironment::FINGERPRINT);
        expect(PinnedEnvironment::changedPins($root))->toContain('is missing or empty');
    } finally {
        is_file($root.'/'.PinnedEnvironment::FINGERPRINT) && unlink($root.'/'.PinnedEnvironment::FINGERPRINT);
        unlink($root.'/tests/env.php');
        rmdir($root.'/tests');
        rmdir($root);
    }
});

it('refuses a run while the shell sets a variable the application reads that the list does not name', function (): void {
    $read = ['RIMIFY_NEW_FLAG' => ['config/rimify.php'], 'APP_ENV' => ['config/app.php']];
    $pins = ['APP_ENV' => 'testing'];

    // What the shell sets beyond what the application reads (PATH, TEMP …) is no concern of the list.
    expect(PinnedEnvironment::refusal(['RIMIFY_NEW_FLAG' => 'true', 'APP_ENV' => 'local', 'PATH' => '/usr/bin'], $pins, $read))->toBe(['RIMIFY_NEW_FLAG'])
        ->and(PinnedEnvironment::refusal(['APP_ENV' => 'local'], $pins, $read))->toBe([]);
});

it('lets the machine name only its database, and only by TEST_DB_*; every other pin wins over the shell', function (): void {
    $effective = PinnedEnvironment::effective(
        ['DB_PORT' => '3308', 'DB_PASSWORD' => 'rimify', 'RIMIFY_RESET_ERLAUBT' => 'false', 'STRIPE_MODE' => null],
        ['TEST_DB_PORT' => '3306', 'DB_PASSWORD' => 'from-a-dot-env', 'RIMIFY_RESET_ERLAUBT' => 'true', 'STRIPE_MODE' => 'live'],
    );

    expect($effective)->toBe(['DB_PORT' => '3306', 'DB_PASSWORD' => 'rimify', 'RIMIFY_RESET_ERLAUBT' => 'false', 'STRIPE_MODE' => null]);
});

it('refuses a DB_* from the shell that the run would not use, and lets a worker inherit its main process', function (): void {
    $effective = ['DB_HOST' => '127.0.0.1', 'DB_PORT' => '3308', 'DB_DATABASE' => 'rimify_test'];

    // A developer's DB_PORT=3307 meant MySQL; the run would have used MariaDB. Refused, naming the way to say it.
    expect(PinnedEnvironment::dbConflicts(['DB_PORT' => '3307'], $effective))->toBe(['DB_PORT=3307 (set TEST_DB_PORT instead)'])
        // A worker's shell is its main process after the pins: the same values, nothing to refuse.
        ->and(PinnedEnvironment::dbConflicts(['DB_PORT' => '3308', 'DB_HOST' => '127.0.0.1'], $effective))->toBe([])
        ->and(PinnedEnvironment::dbConflicts(['PATH' => '/usr/bin'], $effective))->toBe([]);
});

it('refuses to run beside a cached config, which would skip every pin', function (): void {
    $root = sys_get_temp_dir().'/pinned-'.bin2hex(random_bytes(4));
    mkdir($root.'/bootstrap/cache', 0777, true);

    try {
        expect(PinnedEnvironment::caches($root))->toBe([]);

        file_put_contents($root.'/bootstrap/cache/config.php', '<?php return [];');

        expect(PinnedEnvironment::caches($root))->toBe(['bootstrap/cache/config.php'])
            ->and(fn () => PinnedEnvironment::apply([], $root))->toThrow(RuntimeException::class, 'bootstrap/cache/config.php');
    } finally {
        @unlink($root.'/bootstrap/cache/config.php');
        @rmdir($root.'/bootstrap/cache');
        @rmdir($root.'/bootstrap');
        @rmdir($root);
    }
});

it('keeps .env.testing without a single variable, so the pins have one home', function (): void {
    $lines = array_filter(
        file(pinnedRoot().'/.env.testing', FILE_IGNORE_NEW_LINES) ?: [],
        static fn (string $line): bool => trim($line) !== '' && ! str_starts_with(ltrim($line), '#'),
    );

    expect(is_file(pinnedRoot().'/.env.testing'))->toBeTrue('without .env.testing Laravel loads the developer\'s .env')
        ->and($lines)->toBe([]);
});

it('runs this very process on the pins, whatever the machine\'s .env says', function (): void {
    foreach (pinnedList() as $key => $value) {
        if (in_array($key, PinnedEnvironment::MACHINE, true)) {
            continue;
        }

        // Laravel reads $_SERVER first, then $_ENV, then the process environment — where Windows may drop an empty
        // value altogether (putenv("X=") can remove X), so an empty pin is '' or absent there, never anything else.
        $process = getenv($key);
        $process = $process === false ? null : $process;

        expect($_SERVER[$key] ?? null)->toBe($value, "{$key} in \$_SERVER")
            ->and($_ENV[$key] ?? null)->toBe($value, "{$key} in \$_ENV")
            ->and($value === '' && PHP_OS_FAMILY === 'Windows' ? in_array($process, ['', null], true) : $process === $value)
            ->toBeTrue("{$key} in the process holds ".var_export($process, true).', pinned '.var_export($value, true));
    }
});
