<?php

declare(strict_types=1);

/**
 * The .env a release will run with, checked before the release changes anything — before `artisan down`:
 * `php deploy/check-env.php [path/to/.env] [production|staging]` (the target defaults to TARGET_ENV, then production).
 *
 * CLAUDE.md R-04.1 makes the server's own `RIMIFY_RESET_ERLAUBT=true` a condition of Testumgebung zurücksetzen:
 *
 *  - production: the variable is not in .env at all. The live shop has no reset to allow or forbid; a line there is a
 *    defect (GO-LIVE.md §4.4), whatever it says.
 *  - staging: the variable is there, `true` or `false` — absent, System › Zurücksetzen would answer 404 to the
 *    Super-Admin without anyone having decided so (the operator's brief of 05.10.2026, §0).
 *
 * Plain PHP with no autoloader: it runs against a fetched release before composer has. Exit 0 when the file holds,
 * 1 with one German sentence per fault otherwise.
 */
[$script, $file, $target] = array_pad($argv, 3, '');

$file = $file !== '' ? $file : __DIR__.'/../.env';
$target = $target !== '' ? $target : (getenv('TARGET_ENV') ?: 'production');

if (! in_array($target, ['production', 'staging'], true)) {
    fwrite(STDERR, "== check-env: Ziel muss production oder staging sein, nicht „{$target}“.\n");
    exit(1);
}

if (! is_file($file)) {
    fwrite(STDERR, "== check-env: {$file} fehlt.\n");
    exit(1);
}

$values = [];

foreach (preg_split('/\R/', (string) file_get_contents($file)) ?: [] as $line) {
    if (preg_match('/^\s*(?:export\s+)?RIMIFY_RESET_ERLAUBT\s*=\s*(.*?)\s*$/', $line, $m) === 1) {
        $values[] = trim($m[1], "\"' \t");
    }
}

$faults = [];

if ($target === 'production') {
    if ($values !== []) {
        $faults[] = 'RIMIFY_RESET_ERLAUBT steht in der .env des Live-Shops („'.implode('“, „', $values).'“). Diese Zeile gehört dort nicht hin, auch nicht mit false – herausnehmen und neu starten.';
    }
} elseif ($values === []) {
    $faults[] = 'RIMIFY_RESET_ERLAUBT fehlt in der .env dieses Testservers. Ohne die Zeile antwortet System › Zurücksetzen dem Super-Admin mit 404 – RIMIFY_RESET_ERLAUBT=true eintragen (oder false, wenn es hier bewusst aus sein soll).';
} elseif (count($values) > 1) {
    $faults[] = 'RIMIFY_RESET_ERLAUBT steht '.count($values).'-mal in der .env – genau eine Zeile lassen.';
} elseif (! in_array($values[0], ['true', 'false'], true)) {
    $faults[] = 'RIMIFY_RESET_ERLAUBT ist „'.$values[0].'“ – erlaubt sind nur true und false.';
}

if ($faults !== []) {
    foreach ($faults as $fault) {
        fwrite(STDERR, "== check-env: {$fault}\n");
    }

    exit(1);
}

echo $target === 'production'
    ? "== check-env: RIMIFY_RESET_ERLAUBT nicht gesetzt, wie im Live-Shop verlangt\n"
    : "== check-env: RIMIFY_RESET_ERLAUBT={$values[0]}\n";
