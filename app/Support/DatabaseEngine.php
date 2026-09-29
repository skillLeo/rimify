<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Which database this is, and whether the test suite has run against it (D-052).
 *
 * The shop's guarantees live partly in the database — CHECK constraints, SIGNAL triggers, strict mode,
 * FULLTEXT, one collation — and the preview host turned out to run MariaDB 11.8 while the suite ran on
 * MySQL 8.4 only. Two engines can parse the same schema and enforce it differently, and a difference
 * there reads correct and is wrong (D-009). So the suite runs against every engine listed in
 * `rimify.database.engines`, and the app refuses to use any other: an engine is compared by its
 * release series — MariaDB 11.8, MySQL 8.4 — never assumed from the driver's name.
 */
final class DatabaseEngine
{
    public const MARIADB = 'MariaDB';

    public const MYSQL = 'MySQL';

    /**
     * `11.8.9-MariaDB-log` → [MariaDB, 11.8]; `8.4.9` → [MySQL, 8.4].
     *
     * @return array{0: string, 1: string}
     */
    public static function parse(string $version): array
    {
        $engine = stripos($version, 'mariadb') !== false ? self::MARIADB : self::MYSQL;
        $series = preg_match('/^(\d+)\.(\d+)/', $version, $m) === 1 ? $m[1].'.'.$m[2] : $version;

        return [$engine, $series];
    }

    /**
     * The engines and release series the suite runs against, as `MariaDB 11.8`.
     *
     * @return list<string>
     */
    public static function tested(): array
    {
        $engines = config('rimify.database.engines', []);

        return array_values(array_map(static fn (mixed $e): string => (string) $e, is_array($engines) ? $engines : []));
    }

    /** Why the app may not run on this server, naming both — or null when the suite has run against it. */
    public static function refusal(string $version): ?string
    {
        [$engine, $series] = self::parse($version);
        $tested = self::tested();

        if (in_array("{$engine} {$series}", $tested, true)) {
            return null;
        }

        return sprintf(
            'The database is %s %s (%s); the test suite runs against %s only. '
            .'Run the suite against this engine and add it to rimify.database.engines before the shop uses it.',
            $engine,
            $series,
            $version,
            $tested === [] ? 'no engine' : implode(' and ', $tested),
        );
    }
}
