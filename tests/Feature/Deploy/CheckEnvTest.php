<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

/*
 * deploy/check-env.php, the check a release runs before it takes the site down (the operator's brief of 05.10.2026,
 * §0; GO-LIVE.md §4.4): RIMIFY_RESET_ERLAUBT absent in the live shop — a line there is a defect even with false — and
 * present on a test server, true or false. Run as the host runs it: plain PHP, no autoloader.
 */

beforeEach(function (): void {
    $this->env = storage_path('framework/testing/check-env-'.getmypid().'.env');
});

afterEach(function (): void {
    File::delete($this->env);
});

/** @return array{0: int, 1: string} the exit code and everything it printed */
function checkEnv(string $file, string $target): array
{
    $process = new Process([PHP_BINARY, base_path('deploy/check-env.php'), $file, $target]);
    $process->run();

    return [(int) $process->getExitCode(), $process->getOutput().$process->getErrorOutput()];
}

it('holds a live shop without the line, and refuses one that has it — even with false', function (): void {
    File::put($this->env, "APP_ENV=production\n# RIMIFY_RESET_ERLAUBT=true\n");
    expect(checkEnv($this->env, 'production')[0])->toBe(0);

    foreach (['RIMIFY_RESET_ERLAUBT=true', 'RIMIFY_RESET_ERLAUBT=false', 'RIMIFY_RESET_ERLAUBT="false"', '  RIMIFY_RESET_ERLAUBT = ', 'export RIMIFY_RESET_ERLAUBT=true'] as $line) {
        File::put($this->env, "APP_ENV=production\n{$line}\n");
        [$exit, $output] = checkEnv($this->env, 'production');

        expect($exit)->toBe(1, $line)->and($output)->toContain('steht in der .env des Live-Shops');
    }
});

it('holds a test server with true or false, and refuses one without the line, with it twice or with another value', function (): void {
    foreach (['RIMIFY_RESET_ERLAUBT=true', 'RIMIFY_RESET_ERLAUBT=false', "RIMIFY_RESET_ERLAUBT='true'"] as $line) {
        File::put($this->env, "APP_ENV=staging\n{$line}\n");
        expect(checkEnv($this->env, 'staging')[0])->toBe(0, $line);
    }

    $refusals = [
        "APP_ENV=staging\n" => 'fehlt in der .env dieses Testservers',
        "APP_ENV=staging\n# RIMIFY_RESET_ERLAUBT=true\n" => 'fehlt in der .env dieses Testservers',
        "RIMIFY_RESET_ERLAUBT=true\nRIMIFY_RESET_ERLAUBT=false\n" => 'steht 2-mal',
        "RIMIFY_RESET_ERLAUBT=yes\n" => 'erlaubt sind nur true und false',
    ];

    foreach ($refusals as $content => $words) {
        File::put($this->env, $content);
        [$exit, $output] = checkEnv($this->env, 'staging');

        expect($exit)->toBe(1, $content)->and($output)->toContain($words);
    }
});

it('passes the shipped template for a live shop and makes a new test server decide', function (): void {
    expect(checkEnv(base_path('.env.example'), 'production')[0])->toBe(0)
        ->and(checkEnv(base_path('.env.example'), 'staging')[0])->toBe(1);
});

it('runs in remote.sh before the site is taken down, and production no longer writes the line', function (): void {
    $script = (string) file_get_contents(base_path('deploy/remote.sh'));
    // The commands alone: the header's comments speak of `artisan down` long before any line runs it.
    $commands = array_values(array_filter(preg_split('/\R/', $script) ?: [], static fn (string $l): bool => ! str_starts_with(ltrim($l), '#')));
    $first = static fn (string $needle): int => (int) array_key_first(array_filter($commands, static fn (string $l): bool => str_contains($l, $needle)));

    expect($first('deploy/check-env.php'))->toBeLessThan($first('artisan down'))
        ->and($script)->not->toMatch('/set_env\s+RIMIFY_RESET_ERLAUBT/');
});
