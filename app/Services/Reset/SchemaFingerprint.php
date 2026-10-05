<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Illuminate\Database\Connection;

/**
 * The shape of a database's schema as one hash — what a reset's baseline records and what it is compared against
 * before it restores anything (the operator's brief of 05.10.2026, §2.1): the tables, their columns in order with
 * type, nullability, auto-increment and generation, every index, every foreign key with its rules, every trigger by
 * name, table, timing and event.
 *
 * The same for the same migrations on MariaDB 11.8 and MySQL 8.4 — the baseline is built on one and the suite runs on
 * both: integer display widths go (`int(11)` and `int` are one type), JSON is read as the LONGTEXT MariaDB stores it
 * as, a foreign key's unsaid rule is RESTRICT on both, and what the engines spell differently — defaults, collations,
 * trigger bodies, check clauses — is left out. A change those alone would show comes through a migration, which the
 * baseline's migration list catches first. Same hash on both engines for the same 80 migrations: measured 05.10.2026.
 */
final class SchemaFingerprint
{
    public static function of(Connection $db): string
    {
        return hash('sha256', (string) json_encode(self::shape($db), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
    }

    /** @return array<string, list<string>> */
    public static function shape(Connection $db): array
    {
        $tables = array_map(
            static fn (object $r): string => (string) $r->t,
            $db->select("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"),
        );

        $columns = array_map(
            static fn (object $r): string => implode('|', [
                (string) $r->t,
                (string) $r->c,
                (string) $r->p,
                (string) $r->n,
                self::type((string) $r->ty),
                stripos((string) $r->x, 'auto_increment') !== false ? 'ai' : '',
                preg_match('/\b(VIRTUAL|STORED) GENERATED\b/i', (string) $r->x, $g) === 1 ? strtolower($g[1]) : '',
            ]),
            $db->select(
                'SELECT TABLE_NAME AS t, COLUMN_NAME AS c, ORDINAL_POSITION AS p, IS_NULLABLE AS n, COLUMN_TYPE AS ty, EXTRA AS x
                 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, ORDINAL_POSITION'
            ),
        );

        $indexes = array_map(
            static fn (object $r): string => implode('|', [(string) $r->t, (string) $r->i, (string) $r->s, (string) $r->c, (string) $r->u, strtolower((string) $r->ty)]),
            $db->select(
                'SELECT TABLE_NAME AS t, INDEX_NAME AS i, SEQ_IN_INDEX AS s, COLUMN_NAME AS c, NON_UNIQUE AS u, INDEX_TYPE AS ty
                 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX'
            ),
        );

        $keys = array_map(
            static fn (object $r): string => implode('|', [(string) $r->t, (string) $r->k, (string) $r->c, (string) $r->p, (string) $r->rt, (string) $r->rc, self::rule((string) $r->ur), self::rule((string) $r->dr)]),
            $db->select(
                'SELECT k.TABLE_NAME AS t, k.CONSTRAINT_NAME AS k, k.COLUMN_NAME AS c, k.ORDINAL_POSITION AS p, k.REFERENCED_TABLE_NAME AS rt,
                        k.REFERENCED_COLUMN_NAME AS rc, r.UPDATE_RULE AS ur, r.DELETE_RULE AS dr
                 FROM information_schema.KEY_COLUMN_USAGE k
                 JOIN information_schema.REFERENTIAL_CONSTRAINTS r
                   ON r.CONSTRAINT_SCHEMA = k.TABLE_SCHEMA AND r.TABLE_NAME = k.TABLE_NAME AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
                 WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
                 ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION'
            ),
        );

        $triggers = array_map(
            static fn (object $r): string => implode('|', [(string) $r->n, (string) $r->t, strtolower((string) $r->w), strtolower((string) $r->e)]),
            $db->select(
                'SELECT TRIGGER_NAME AS n, EVENT_OBJECT_TABLE AS t, ACTION_TIMING AS w, EVENT_MANIPULATION AS e
                 FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() ORDER BY TRIGGER_NAME'
            ),
        );

        // Sorted here, byte by byte: ORDER BY follows each engine's own collation, and the two put „review_feedback“ and
        // „reviews“ in different orders.
        $shape = ['tables' => $tables, 'columns' => $columns, 'indexes' => $indexes, 'keys' => $keys, 'triggers' => $triggers];

        foreach ($shape as &$lines) {
            sort($lines, SORT_STRING);
        }

        return $shape;
    }

    /**
     * A foreign key's rule as both engines mean it: InnoDB checks NO ACTION at once, exactly as RESTRICT, and a rule
     * left unsaid is reported as NO ACTION by MySQL 8.4 and as RESTRICT by MariaDB 11.8 (measured 05.10.2026, 73 keys).
     */
    private static function rule(string $rule): string
    {
        $rule = strtoupper(trim($rule));

        return $rule === 'NO ACTION' ? 'RESTRICT' : $rule;
    }

    /** A column type both engines spell alike: no integer display width, JSON as the LONGTEXT MariaDB keeps it in. */
    private static function type(string $type): string
    {
        $type = strtolower(trim($type));
        $type = (string) preg_replace('/\b(tinyint|smallint|mediumint|int|bigint)\(\d+\)/', '$1', $type);

        return $type === 'json' ? 'longtext' : $type;
    }
}
