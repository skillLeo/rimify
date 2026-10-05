<?php

declare(strict_types=1);

use Symfony\Component\Process\Process;

/*
 * The rulebook is part of the repository (the operator's brief of 05.10.2026, §1.3). CLAUDE.md is the written spec of
 * the triggers R-12 rests on: kept untracked on one machine, it would go with that machine, and the next reader would
 * meet triggers with no stated reason and take them for legacy. So it is tracked, and every rule (`R-04`, `R-12.3`) and
 * every decision (`D-153`) a tracked file names must have its row — in CLAUDE.md's table and in docs/decisions.md. A
 * rule the code cites and the book has lost is a failure, not a dangling comment.
 */

/** @return list<string> */
function rulebookTrackedFiles(): array
{
    $process = new Process(['git', 'ls-files'], base_path());
    $process->run();

    expect($process->isSuccessful())->toBeTrue('git ls-files did not run: '.$process->getErrorOutput());

    return array_values(array_filter(preg_split('/\R/', $process->getOutput()) ?: []));
}

/** @return array<string, true> */
function rulebookRows(string $file, string $pattern): array
{
    preg_match_all($pattern, (string) file_get_contents(base_path($file)), $m);

    return array_fill_keys($m[1], true);
}

it('tracks CLAUDE.md and the decision log, and neither is empty or ignored', function (): void {
    $tracked = rulebookTrackedFiles();
    $ignored = new Process(['git', 'check-ignore', '-q', 'CLAUDE.md'], base_path());
    $ignored->run();

    expect($tracked)->toContain('CLAUDE.md', 'docs/decisions.md')
        ->and(filesize(base_path('CLAUDE.md')))->toBeGreaterThan(1000)
        ->and(filesize(base_path('docs/decisions.md')))->toBeGreaterThan(1000)
        // 1: not ignored by any .gitignore, the global excludes or .git/info/exclude.
        ->and($ignored->getExitCode())->toBe(1);
});

it('has a row for every rule and every decision a tracked file names', function (): void {
    $rules = rulebookRows('CLAUDE.md', '/^\|\s*(R-\d{2}(?:\.\d+)?)\s*\|/m');
    $decisions = rulebookRows('docs/decisions.md', '/^\|\s*(D-\d{3})\s*\|/m');
    $missing = [];

    expect($rules)->toHaveKeys(['R-04.1', 'R-12', 'R-12.3'])->and($decisions)->toHaveKey('D-153');

    foreach (rulebookTrackedFiles() as $file) {
        $path = base_path($file);

        if (preg_match('/\.(php|ts|vue|js|mjs|md|yml|yaml|sh|json|css)$/', $file) !== 1 || ! is_file($path) || filesize($path) > 2_000_000) {
            continue;
        }

        $text = (string) file_get_contents($path);
        preg_match_all('/(?<![\w-])(R-\d{2}(?:\.\d+)?|D-\d{3})(?!\w)/', $text, $m, PREG_OFFSET_CAPTURE);

        foreach ($m[1] as [$id, $offset]) {
            if (! isset((str_starts_with($id, 'R-') ? $rules : $decisions)[$id])) {
                $missing[] = $id.' in '.$file.':'.(substr_count(substr($text, 0, $offset), "\n") + 1);
            }
        }
    }

    expect($missing)->toBe([]);
});
