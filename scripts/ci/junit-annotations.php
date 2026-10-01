<?php

declare(strict_types=1);

/*
 * Turns the failures in a JUnit report into GitHub annotations (`::error …`), so a red run says which test failed
 * and why on the run's summary — and through the public API, which needs no login, unlike the raw log.
 *
 *   php scripts/ci/junit-annotations.php junit.xml
 *
 * GitHub shows ten annotations per step; the rest are counted in the last one.
 */

$path = $argv[1] ?? 'junit.xml';

if (! is_file($path)) {
    fwrite(STDOUT, "::error title=No JUnit report::{$path} was not written — the suite stopped before it could report.\n");
    exit(0);
}

$xml = simplexml_load_file($path);

if ($xml === false) {
    fwrite(STDOUT, "::error title=Unreadable JUnit report::{$path} is not valid XML.\n");
    exit(0);
}

$escape = static fn (string $text): string => str_replace(['%', "\r", "\n"], ['%25', '%0D', '%0A'], $text);
$shown = 0;
$total = 0;

foreach ($xml->xpath('//testcase[failure or error]') ?: [] as $case) {
    $total++;

    if ($shown >= 9) {
        continue;
    }

    $problem = $case->failure ?? $case->error;
    $file = str_replace(getcwd().DIRECTORY_SEPARATOR, '', (string) ($case['file'] ?? ''));
    $line = (int) ($case['line'] ?? 0);
    $message = mb_substr(trim((string) $problem), 0, 1500);

    fwrite(STDOUT, sprintf(
        "::error file=%s,line=%d,title=%s::%s\n",
        $escape($file),
        $line,
        $escape(mb_substr((string) $case['class'].' › '.(string) $case['name'], 0, 250)),
        $escape($message),
    ));
    $shown++;
}

if ($total > $shown) {
    fwrite(STDOUT, sprintf("::error title=%d more failing tests::Only the first %d are annotated; the run log has them all.\n", $total - $shown, $shown));
}
