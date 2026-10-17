<?php

declare(strict_types=1);

/*
 * The operator's rule of 17.10.2026 („THIRD TIME. THE CLASS IS CLEANUP.“): **cleanup never navigates.** A teardown that
 * drives the browser after the body has finished can race a locator that has not given up yet, however generous the
 * timeout — under load the timeout's afterEach opened the bare order list while 508's check still polled, and the check
 * read that page as the app's answer (D-263). Three tests lied that way in one week.
 *
 * Found that day: twelve teardowns that drove or ran code in the page (seven `goto` + `page.evaluate` for the saved
 * views, five `page.evaluate` for the rail) and four cleanups inside test bodies that clicked or navigated (K2-01, K2-02,
 * UEB-04, the acceptance run's #23). All go by request now (e2e/teardown.ts). This test keeps it so, over the three
 * browser suites:
 *
 *   - an `afterEach` / `afterAll` never receives the page, and never reaches one through the context;
 *   - a fixture's teardown — what runs after `await use(…)` — never drives the page; it may drop the page's route
 *     handlers (`unrouteAll`, so an in-flight `route.fetch` cannot fail a finished test) and ask whether it is closed.
 */

const E2E_SUITES = ['e2e', 'tests/e2e', 'tests/abnahme'];

/**
 * Every teardown in the suites: hooks with their parameter list and body, fixtures with what follows `await use(`.
 *
 * @return list<array{file: string, line: int, kind: string, params: string, body: string}>
 */
function e2eTeardowns(): array
{
    $root = dirname(__DIR__, 2);
    $found = [];

    foreach (E2E_SUITES as $suite) {
        $dir = $root.'/'.$suite;

        if (! is_dir($dir)) {
            continue;
        }

        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $file) {
            if ($file->getExtension() !== 'ts') {
                continue;
            }

            $path = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
            $source = (string) file_get_contents($file->getPathname());

            preg_match_all('/\b(?:test\.)?after(?:Each|All)\s*\(/', $source, $hooks, PREG_OFFSET_CAPTURE);

            foreach ($hooks[0] as [, $at]) {
                $arrow = strpos($source, '=>', $at);
                $open = $arrow === false ? false : strpos($source, '{', $arrow);

                if ($arrow === false || $open === false) {
                    continue;
                }

                $found[] = [
                    'file' => $path,
                    'line' => substr_count(substr($source, 0, $at), "\n") + 1,
                    'kind' => 'hook',
                    'params' => substr($source, $at, $arrow - $at),
                    'body' => e2eWithoutComments(e2eBlock($source, $open)),
                ];
            }

            preg_match_all('/await use\(/', $source, $uses, PREG_OFFSET_CAPTURE);

            foreach ($uses[0] as [, $at]) {
                $found[] = [
                    'file' => $path,
                    'line' => substr_count(substr($source, 0, $at), "\n") + 1,
                    'kind' => 'fixture',
                    'params' => '',
                    'body' => e2eWithoutComments(e2eRestOfFunction($source, $at)),
                ];
            }
        }
    }

    return $found;
}

/** Code without its comments: a word in a comment („a blank page“) is not a call. */
function e2eWithoutComments(string $code): string
{
    return (string) preg_replace(['#/\*.*?\*/#s', '#^\s*//.*$#m'], '', $code);
}

/** The block that opens at `$open` (a `{`), braces counted. */
function e2eBlock(string $source, int $open): string
{
    $depth = 0;

    for ($i = $open, $n = strlen($source); $i < $n; $i++) {
        $depth += $source[$i] === '{' ? 1 : ($source[$i] === '}' ? -1 : 0);

        if ($depth === 0) {
            return substr($source, $open, $i - $open + 1);
        }
    }

    return substr($source, $open);
}

/** From `$at` to the closing brace of the function it stands in: a fixture's teardown. */
function e2eRestOfFunction(string $source, int $at): string
{
    $depth = 0;

    for ($i = $at, $n = strlen($source); $i < $n; $i++) {
        $depth += $source[$i] === '{' ? 1 : ($source[$i] === '}' ? -1 : 0);

        if ($depth < 0) {
            return substr($source, $at, $i - $at);
        }
    }

    return substr($source, $at);
}

it('finds the teardowns it guards — a scan that finds none proves nothing', function (): void {
    $kinds = array_count_values(array_column(e2eTeardowns(), 'kind'));

    expect($kinds['hook'] ?? 0)->toBeGreaterThanOrEqual(15)
        ->and($kinds['fixture'] ?? 0)->toBeGreaterThanOrEqual(4);
});

/** Why a hook drives a page, or null: it takes one, reaches one through the context, or names one. */
function e2eHookOffends(string $params, string $body): ?string
{
    return match (true) {
        preg_match('/\bpage\b/', $params) === 1 => 'takes the page',
        preg_match('/\.pages\(\)|\.newPage\(/', $body) === 1 => 'reaches a page through the context',
        preg_match('/\bpage\b/', e2eWithoutComments($body)) === 1 => 'names a page',
        default => null,
    };
}

it('catches the shapes it was written for — and lets a request through', function (string $params, string $body, ?string $reason): void {
    expect(e2eHookOffends($params, $body))->toBe($reason);
})->with([
    '508: the cleanup navigates' => ['test.afterEach(async ({ page, isMobile }) ', '{ await cleanUp(page) }', 'takes the page'],
    'the page taken from the context' => ['test.afterEach(async ({ context }) ', '{ await context.pages()[0].goto("/admin") }', 'reaches a page through the context'],
    'a fresh page opened to clean up' => ['test.afterAll(async ({ browser }) ', '{ const p = await browser.newPage(); }', 'reaches a page through the context'],
    'by request' => ['test.afterEach(async ({ context }) ', '{ await cleanUp(context) }', null],
    'a word in a comment' => ['test.afterEach(async ({ context }) ', "{\n    // a blank page with no cookie\n    await resetRail(context)\n}", null],
]);

it('lets no afterEach or afterAll touch a page — cleanup never navigates, it goes by request (D-263)', function (): void {
    $offending = [];

    foreach (e2eTeardowns() as $teardown) {
        if ($teardown['kind'] !== 'hook') {
            continue;
        }

        $reason = e2eHookOffends($teardown['params'], $teardown['body']);

        if ($reason !== null) {
            $offending[] = "{$teardown['file']}:{$teardown['line']} {$reason}";
        }
    }

    expect($offending)->toBe([], "A teardown drives the browser after the body — reset by request (e2e/teardown.ts) instead:\n  ".implode("\n  ", $offending));
});

it('lets no fixture drive the page after its test — dropping its routes and asking whether it is closed excepted', function (): void {
    $offending = [];

    foreach (e2eTeardowns() as $teardown) {
        if ($teardown['kind'] !== 'fixture') {
            continue;
        }

        $calls = [];
        preg_match_all('/\bpage\.(\w+)\(/', $teardown['body'], $calls);

        foreach (array_diff($calls[1], ['unrouteAll', 'isClosed']) as $call) {
            $offending[] = "{$teardown['file']}:{$teardown['line']} calls page.{$call}() after the test";
        }

        if (preg_match('/\.pages\(\)|\.newPage\(/', $teardown['body']) === 1) {
            $offending[] = "{$teardown['file']}:{$teardown['line']} reaches a page through the context after the test";
        }
    }

    expect($offending)->toBe([], "A fixture drives the browser after the test:\n  ".implode("\n  ", $offending));
});
