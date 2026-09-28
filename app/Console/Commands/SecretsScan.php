<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\Security\SecretScanner;
use Illuminate\Console\Command;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Refuses a credential in the repository (docs/dev/SECRETS.md): live and test payment keys, webhook
 * secrets, AWS keys, private keys and database URLs with a password (SecretScanner).
 *
 *   php artisan secrets:scan              the working tree: every tracked file and every new one git would take
 *   php artisan secrets:scan --staged     the lines this commit adds — what .githooks/pre-commit runs
 *   php artisan secrets:scan --history    every line ever added, in every commit of every branch
 *   php artisan secrets:scan path …       the files or folders named
 *
 * A finding prints its file, its line and the credential masked to its last four characters, and the
 * command fails. It never prints a credential.
 */
final class SecretsScan extends Command
{
    protected $signature = 'secrets:scan
        {paths?* : Files or folders to scan instead of the working tree}
        {--staged : Only the lines the next commit adds (the pre-commit hook)}
        {--history : Every line ever added, in every commit of every branch}
        {--repo= : The repository to read, when it is not this one}';

    protected $description = 'Fail when a credential is in the working tree, the staged diff or the git history';

    /** Longer than this, a file is data, not something a key is typed into. */
    private const MAX_BYTES = 5_000_000;

    /** Never walked when a folder is named: dependencies and build output. */
    private const SKIP_DIRS = ['.git', 'vendor', 'node_modules', 'public/build', 'bootstrap/ssr', 'storage'];

    /** @var list<array{where: string, line: int, what: string, masked: string}> */
    private array $findings = [];

    public function handle(): int
    {
        // One command object can serve several calls in one process (the kernel keeps it).
        $this->findings = [];
        $paths = array_values(array_filter((array) $this->argument('paths'), 'is_string'));

        $scanned = match (true) {
            (bool) $this->option('history') => $this->diff(['log', '-p', '--all', '--no-color', '--no-ext-diff', '--unified=0', '--format=commit %H']),
            (bool) $this->option('staged') => $this->diff(['diff', '--cached', '--no-color', '--no-ext-diff', '--unified=0', '--diff-filter=ACMR']),
            $paths !== [] => $this->files($this->expand($paths)),
            default => $this->files($this->tracked()),
        };

        if ($scanned === null) {
            return self::FAILURE;
        }

        if ($this->findings === []) {
            $this->info(sprintf('No credential found (%s).', $scanned));

            return self::SUCCESS;
        }

        $this->error(sprintf('%d credential%s found (%s):', count($this->findings), count($this->findings) === 1 ? '' : 's', $scanned));

        foreach ($this->findings as $finding) {
            $this->line(sprintf('  %s:%d  %s  %s', $finding['where'], $finding['line'], $finding['what'], $finding['masked']));
        }

        $this->newLine();
        $this->line('What to do: take the credential out of the file — it belongs in .env (git-ignored) or, for a');
        $this->line('live key, only in the admin panel on the production site. Then roll it at its provider: once it');
        $this->line('has been in a file or a commit it counts as known. A key already committed stays in the history');
        $this->line('until the history is rewritten; rolling it is what makes it harmless. See docs/dev/SECRETS.md.');

        return self::FAILURE;
    }

    /**
     * Files by path, line by line; what they hold goes to the findings.
     *
     * @param  list<string>|null  $files
     *
     * @phpstan-impure
     */
    private function files(?array $files): ?string
    {
        if ($files === null) {
            return null;
        }

        $count = 0;

        foreach ($files as $file) {
            $content = $this->readable($file);

            if ($content === null) {
                continue;
            }

            $count++;

            foreach (SecretScanner::text($content) as $finding) {
                $this->record($this->relative($file), $finding['line'], $finding['what'], $finding['masked']);
            }
        }

        return $count === 1 ? 'one file' : "{$count} files";
    }

    /**
     * The added lines of a git diff or log, with their file, their line and, in a log, their commit;
     * what they hold goes to the findings.
     *
     * @param  list<string>  $arguments
     *
     * @phpstan-impure
     */
    private function diff(array $arguments): ?string
    {
        $process = proc_open(['git', ...$arguments], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $this->repository());

        if (! is_resource($process)) {
            $this->error('git is needed for --staged and --history, and it could not be started.');

            return null;
        }

        [$commit, $file, $number, $commits, $lines] = ['', '', 0, 0, 0];

        while (($raw = fgets($pipes[1])) !== false) {
            $line = rtrim($raw, "\r\n");

            if (str_starts_with($line, 'commit ') && strlen($line) === 47) {
                $commit = substr($line, 7, 10);
                $commits++;
            } elseif (str_starts_with($line, 'diff --git ')) {
                $file = (string) preg_replace('~^diff --git a/.* b/~', '', $line);
            } elseif (str_starts_with($line, '@@') && preg_match('/\+(\d+)/', $line, $m) === 1) {
                $number = (int) $m[1];
            } elseif (str_starts_with($line, '+') && ! str_starts_with($line, '+++')) {
                $lines++;

                foreach (SecretScanner::line(substr($line, 1)) as $finding) {
                    $this->record(($commit === '' ? '' : $commit.' ').$file, $number, $finding['what'], $finding['masked']);
                }

                $number++;
            }
        }

        fclose($pipes[1]);
        $errors = trim((string) stream_get_contents($pipes[2]));
        fclose($pipes[2]);

        if (proc_close($process) !== 0) {
            $this->error('git refused: '.($errors === '' ? 'no reason given' : $errors));

            return null;
        }

        return $commits > 0 ? "{$commits} commits, {$lines} added lines" : "{$lines} added lines";
    }

    /** @return list<string>|null every file git tracks, and every new one it would take */
    private function tracked(): ?array
    {
        $process = proc_open(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $this->repository());

        if (! is_resource($process)) {
            $this->error('git could not be started; name the folders to scan instead.');

            return null;
        }

        $listing = (string) stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        if (proc_close($process) !== 0) {
            $this->error('Not a git working tree; name the folders to scan instead.');

            return null;
        }

        $root = $this->repository();

        return array_values(array_map(static fn (string $path): string => $root.DIRECTORY_SEPARATOR.$path, array_filter(explode("\0", $listing))));
    }

    /**
     * @param  list<string>  $paths
     * @return list<string>
     */
    private function expand(array $paths): array
    {
        $files = [];

        foreach ($paths as $path) {
            if (is_file($path)) {
                $files[] = $path;

                continue;
            }

            if (! is_dir($path)) {
                $this->warn("Not found: {$path}");

                continue;
            }

            $walk = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS));

            foreach ($walk as $entry) {
                if ($entry instanceof SplFileInfo && $entry->isFile() && ! $this->skipped($entry->getPathname())) {
                    $files[] = $entry->getPathname();
                }
            }
        }

        return $files;
    }

    private function skipped(string $path): bool
    {
        $normal = str_replace('\\', '/', $path);

        foreach (self::SKIP_DIRS as $dir) {
            if (str_contains($normal, '/'.$dir.'/')) {
                return true;
            }
        }

        return false;
    }

    /** A text file's content; null for a binary, an oversized or an unreadable one. */
    private function readable(string $file): ?string
    {
        if (! is_file($file) || filesize($file) > self::MAX_BYTES) {
            return null;
        }

        $content = file_get_contents($file);

        return $content === false || str_contains(substr($content, 0, 8000), "\0") ? null : $content;
    }

    private function repository(): string
    {
        $repo = $this->option('repo');

        return is_string($repo) && $repo !== '' ? $repo : base_path();
    }

    private function relative(string $file): string
    {
        $base = str_replace('\\', '/', $this->repository()).'/';
        $normal = str_replace('\\', '/', $file);

        return str_starts_with($normal, $base) ? substr($normal, strlen($base)) : $normal;
    }

    private function record(string $where, int $line, string $what, string $masked): void
    {
        $this->findings[] = ['where' => $where, 'line' => $line, 'what' => $what, 'masked' => $masked];
    }
}
