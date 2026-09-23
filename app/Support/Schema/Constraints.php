<?php

declare(strict_types=1);

namespace App\Support\Schema;

use Illuminate\Database\MySqlConnection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Laravel 13's Blueprint has no `check()` helper, so CHECK constraints are added with raw DDL.
 * They go through this one class so that every constraint in the schema is spelled, named and
 * dropped the same way — and so the enum-backed ones cannot drift from the PHP enums they mirror.
 *
 * MySQL 8.0.16+ enforces CHECK constraints; they are the reason a bad HSN or an inverted permitted
 * range cannot reach the fitment engine at all.
 */
final class Constraints
{
    /** Identifiers are interpolated, so they are restricted to a safe shape (R-14). */
    private const IDENTIFIER = '/^[A-Za-z_][A-Za-z0-9_]*$/';

    public static function add(string $table, string $name, string $expression): void
    {
        self::assertIdentifier($table);
        self::assertIdentifier($name);

        DB::statement(sprintf(
            'ALTER TABLE `%s` ADD CONSTRAINT `%s` CHECK (%s)',
            $table,
            $name,
            self::forServer($expression),
        ));
    }

    /**
     * MariaDB refuses `REGEXP_LIKE()` inside a CHECK clause (error 1901) but accepts the REGEXP
     * operator. `(?-i)` keeps the match case-sensitive under a `_ci` collation, which is what the
     * `'c'` match type means on MySQL. On MySQL the expression is used exactly as written.
     */
    private static function forServer(string $expression): string
    {
        $connection = DB::connection();

        if (! $connection instanceof MySqlConnection || ! $connection->isMaria()) {
            return $expression;
        }

        return (string) preg_replace(
            "/REGEXP_LIKE\\((`[A-Za-z0-9_]+`),\\s*'([^']*)',\\s*'c'\\)/",
            "$1 REGEXP '(?-i)$2'",
            $expression,
        );
    }

    public static function drop(string $table, string $name): void
    {
        self::assertIdentifier($table);
        self::assertIdentifier($name);

        // DROP CONSTRAINT is the spelling both MySQL (8.0.19+) and MariaDB accept; DROP CHECK is MySQL's alone.
        DB::statement(sprintf('ALTER TABLE `%s` DROP CONSTRAINT `%s`', $table, $name));
    }

    /**
     * Drop a constraint that may already be gone. DDL is not transactional, so a migration that
     * failed halfway leaves the constraint dropped; its retry must not fail on that.
     */
    public static function dropIfExists(string $table, string $name): void
    {
        self::assertIdentifier($table);
        self::assertIdentifier($name);

        $exists = DB::selectOne(
            'SELECT 1 AS present FROM information_schema.TABLE_CONSTRAINTS
             WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
            [$table, $name],
        );

        if ($exists !== null) {
            self::drop($table, $name);
        }
    }

    /**
     * Constrain a column to the values of a backed enum, so the database and the PHP enum can
     * never disagree about what a valid status is.
     *
     * @param  list<string>  $values
     */
    public static function enum(string $table, string $column, array $values, ?string $name = null): void
    {
        self::assertIdentifier($column);

        $quoted = implode(', ', array_map(
            static fn (string $value): string => DB::getPdo()->quote($value),
            $values,
        ));

        self::add($table, $name ?? "chk_{$table}_{$column}", "`{$column}` IN ({$quoted})");
    }

    /**
     * A min/max pair may not be inverted. Either bound may be NULL, meaning unbounded on that
     * side — which is how an open-ended permitted range is expressed without a range type.
     */
    public static function range(string $table, string $minColumn, string $maxColumn, string $name): void
    {
        self::assertIdentifier($minColumn);
        self::assertIdentifier($maxColumn);

        self::add(
            $table,
            $name,
            "`{$minColumn}` IS NULL OR `{$maxColumn}` IS NULL OR `{$minColumn}` <= `{$maxColumn}`",
        );
    }

    private static function assertIdentifier(string $value): void
    {
        if (preg_match(self::IDENTIFIER, $value) !== 1) {
            throw new InvalidArgumentException("Unsafe SQL identifier: [{$value}].");
        }
    }
}
