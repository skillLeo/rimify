<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

/*
 * secrets:scan on a throwaway repository (docs/dev/SECRETS.md): the working tree, a commit's staged
 * lines and the whole history each find a planted key, name the file and the line, and never print
 * the key. The key is assembled at run time; this file holds none.
 */

beforeEach(function (): void {
    $this->repo = storage_path('framework/testing/secrets-'.bin2hex(random_bytes(4)));
    File::ensureDirectoryExists($this->repo);
    $this->key = 'sk_'.'live_'.'Zx9Yw8Vu7Ts6Rq5Po4Nm3Lk2';

    scanGit($this->repo, ['init', '-q']);
    File::put($this->repo.'/README.md', "RIMIFY\n");
});

afterEach(function (): void {
    File::deleteDirectory($this->repo);
});

/** @param  list<string>  $arguments */
function scanGit(string $repo, array $arguments): void
{
    Process::path($repo)->run(['git', '-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'core.hooksPath=/dev/null', ...$arguments])->throw();
}

it('finds a key in the working tree, names file and line, and prints only its last four characters', function (): void {
    File::put($this->repo.'/config.php', "<?php\n\nreturn ['secret' => '{$this->key}'];\n");

    $this->artisan('secrets:scan', ['--repo' => $this->repo])
        ->expectsOutputToContain('config.php:3  Stripe live secret key  sk_live_…3Lk2')
        ->doesntExpectOutputToContain($this->key)
        ->expectsOutputToContain('roll it at its provider')
        ->assertFailed();
})->skip(fn (): bool => ! scanHasGit(), 'git is not installed');

it('refuses the commit that would add a key, and lets a clean one through', function (): void {
    File::put($this->repo.'/.env.production', "STRIPE_SECRET={$this->key}\n");
    scanGit($this->repo, ['add', '.env.production']);

    $this->artisan('secrets:scan', ['--staged' => true, '--repo' => $this->repo])
        ->expectsOutputToContain('.env.production:1  Stripe live secret key  sk_live_…3Lk2')
        ->assertFailed();

    scanGit($this->repo, ['rm', '-q', '--cached', '.env.production']);
    scanGit($this->repo, ['add', 'README.md']);

    $this->artisan('secrets:scan', ['--staged' => true, '--repo' => $this->repo])->expectsOutputToContain('No credential found')->assertSuccessful();
})->skip(fn (): bool => ! scanHasGit(), 'git is not installed');

it('finds a key the history still holds after a later commit took it out', function (): void {
    File::put($this->repo.'/keys.txt', "live: {$this->key}\n");
    scanGit($this->repo, ['add', '.']);
    scanGit($this->repo, ['commit', '-q', '-m', 'add']);
    File::put($this->repo.'/keys.txt', "live: in the admin\n");
    scanGit($this->repo, ['commit', '-q', '-am', 'remove']);

    // The working tree is clean now; the history is not.
    $this->artisan('secrets:scan', ['--repo' => $this->repo])->assertSuccessful();
    $this->artisan('secrets:scan', ['--history' => true, '--repo' => $this->repo])
        ->expectsOutputToContain('keys.txt:1  Stripe live secret key  sk_live_…3Lk2')
        ->expectsOutputToContain('2 commits')
        ->assertFailed();
})->skip(fn (): bool => ! scanHasGit(), 'git is not installed');

it('finds nothing in this repository', function (): void {
    $this->artisan('secrets:scan')->expectsOutputToContain('No credential found')->assertSuccessful();
})->skip(fn (): bool => ! scanHasGit(), 'git is not installed');

function scanHasGit(): bool
{
    return Process::run(['git', '--version'])->successful();
}
