<?php

declare(strict_types=1);

namespace App\Support\Security;

/**
 * Finds credentials in text — the guard added after a live payment key was pasted into a working
 * session (docs/dev/SECRETS.md). `secrets:scan` runs it over the working tree, a commit's staged lines
 * (the pre-commit hook) or the whole history.
 *
 * Every rule is a key's own shape, tight enough that the repository's own words about keys (`sk_live_…`
 * in a sentence, `whsec_test_secret` in phpunit.xml) are not findings. The one shape with no prefix of
 * its own, a 40-character AWS secret, counts only beside a name that says secret, AWS or S3 and only
 * with upper case, lower case and digits in it — otherwise every SHA-1 in a lock file would be one.
 *
 * A finding never carries the credential: only its prefix and its last four characters.
 */
final class SecretScanner
{
    /**
     * rule => [pattern, what it is]. A pattern names the credential `secret` and, where the prefix
     * says what it is, that `prefix`.
     *
     * @var array<string, array{0: string, 1: string}>
     */
    public const RULES = [
        'stripe-live-secret' => ['/\b(?<prefix>sk_live_)(?<secret>[0-9A-Za-z]{16,})/', 'Stripe live secret key'],
        'stripe-live-restricted' => ['/\b(?<prefix>rk_live_)(?<secret>[0-9A-Za-z]{16,})/', 'Stripe live restricted key'],
        'stripe-test-secret' => ['/\b(?<prefix>sk_test_)(?<secret>[0-9A-Za-z]{16,})/', 'Stripe test secret key'],
        'stripe-live-publishable' => ['/\b(?<prefix>pk_live_)(?<secret>[0-9A-Za-z]{16,})/', 'Stripe live publishable key'],
        'stripe-webhook-secret' => ['/\b(?<prefix>whsec_)(?<secret>[0-9A-Za-z]{24,})/', 'Stripe webhook signing secret'],
        'aws-access-key' => ['/\b(?<prefix>AKIA|ASIA)(?<secret>[0-9A-Z]{16})\b/', 'AWS access key id'],
        'aws-secret-key' => ['/(?i:aws|secret|s3)[A-Za-z0-9_.\-]*["\']?\s*(?:=>|[:=])\s*["\']?(?<secret>[A-Za-z0-9\/+]{40})(?![A-Za-z0-9\/+=])/', 'AWS secret access key'],
        'private-key' => ['/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/', 'private key (PEM)'],
        'database-url-password' => ['/\b(?<prefix>DATABASE_URL|DB_URL)\s*[=:]\s*["\']?[A-Za-z][A-Za-z0-9+.\-]*:\/\/[^:\/\s"\'@]+:(?<secret>[^@\s"\']+)@/', 'database URL with a password'],
    ];

    /** Cheap substrings, lower case, one of which every finding contains: a line with none is skipped. */
    private const TRIGGERS = ['_live_', 'sk_test_', 'whsec_', 'akia', 'asia', 'private key', 'url', 'aws', 'secret', 's3'];

    /**
     * The credentials in one line.
     *
     * @return list<array{rule: string, what: string, masked: string}>
     */
    public static function line(string $line): array
    {
        if (! self::mayContain($line)) {
            return [];
        }

        $found = [];

        foreach (self::RULES as $rule => [$pattern, $what]) {
            if (preg_match_all($pattern, $line, $matches, PREG_SET_ORDER) === 0) {
                continue;
            }

            foreach ($matches as $match) {
                $secret = $match['secret'] ?? '';

                if ($rule === 'aws-secret-key' && ! self::looksRandom($secret)) {
                    continue;
                }

                $found[] = ['rule' => $rule, 'what' => $what, 'masked' => self::mask($match['prefix'] ?? '', $secret, $match[0])];
            }
        }

        return $found;
    }

    /**
     * The credentials in a text, by line number (from 1).
     *
     * @return list<array{line: int, rule: string, what: string, masked: string}>
     */
    public static function text(string $text): array
    {
        $found = [];

        foreach (preg_split('/\R/', $text) ?: [] as $index => $line) {
            foreach (self::line($line) as $finding) {
                $found[] = ['line' => $index + 1, ...$finding];
            }
        }

        return $found;
    }

    /** `sk_live_…WhAd`: what kind of key, and enough to tell which one — never the key. */
    public static function mask(string $prefix, string $secret, string $whole): string
    {
        if ($secret === '') {
            return $whole;
        }

        return ($prefix === '' ? '' : $prefix.($prefix[-1] === '_' ? '' : ' ')).'…'.substr($secret, -4);
    }

    private static function mayContain(string $line): bool
    {
        $lower = strtolower($line);

        foreach (self::TRIGGERS as $trigger) {
            if (str_contains($lower, $trigger)) {
                return true;
            }
        }

        return false;
    }

    /** A 40-character value with upper case, lower case and digits: a secret's shape, not a hash's. */
    private static function looksRandom(string $value): bool
    {
        return preg_match('/[a-z]/', $value) === 1 && preg_match('/[A-Z]/', $value) === 1 && preg_match('/\d/', $value) === 1;
    }
}
