<?php

declare(strict_types=1);

namespace App\Support\Schema;

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
            $expression,
        ));
    }

    public static function drop(string $table, string $name): void
    {
        self::assertIdentifier($table);
        self::assertIdentifier($name);

        DB::statement(sprintf('ALTER TABLE `%s` DROP CHECK `%s`', $table, $name));
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
