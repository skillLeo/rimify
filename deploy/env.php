<?php

declare(strict_types=1);

/**
 * Set one key in .env, safely: `php deploy/env.php KEY value`.
 *
 * A PHP helper rather than sed, because a password may contain any character sed treats as syntax.
 * An empty value leaves an existing key untouched, so a deploy without a secret never blanks one.
 */
[$script, $key, $value] = array_pad($argv, 3, '');

if (! preg_match('/^[A-Z][A-Z0-9_]*$/', $key)) {
    fwrite(STDERR, "invalid key: {$key}\n");
    exit(1);
}

$file = __DIR__.'/../.env';
$env = is_file($file) ? (string) file_get_contents($file) : '';
$pattern = '/^'.preg_quote($key, '/').'=.*$/m';

if ($value === '' && preg_match($pattern, $env) === 1) {
    exit(0);
}

// Quote values with spaces or specials the way Laravel's dotenv parser expects.
$needsQuotes = preg_match('/[\s#"\'$\\\\]/', $value) === 1;
$line = $key.'='.($needsQuotes ? '"'.addcslashes($value, '"\\$').'"' : $value);

$env = preg_match($pattern, $env) === 1
    ? (string) preg_replace_callback($pattern, static fn (): string => $line, $env)
    : rtrim($env)."\n".$line."\n";

file_put_contents($file, $env);
