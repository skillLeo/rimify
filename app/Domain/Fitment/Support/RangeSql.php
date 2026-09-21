<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use InvalidArgumentException;

/**
 * Open-ended range predicates in SQL, written ONCE.
 *
 * MySQL has no range types, so PostgreSQL's `&&` and `<@` become explicit NULL-aware comparisons.
 * The whole point of this class is that those comparisons exist in exactly one place: a second
 * hand-written copy that gets one NULL branch wrong is the single most likely defect introduced by
 * targeting MySQL, and it would be wrong in the permissive direction.
 *
 * `BuildWindow::overlaps()` is the in-memory twin of `windowsOverlap()`, and a test asserts the two
 * agree across all nine NULL combinations.
 *
 * Table and column names are interpolated, so they are restricted to a safe identifier shape; no
 * value is ever interpolated (R-14).
 */
final class RangeSql
{
    private const IDENTIFIER = '/^[A-Za-z_][A-Za-z0-9_]*$/';

    /**
     * Two open-ended windows overlap when each starts before the other ends. A NULL bound makes
     * its comparison vacuously true, which is what "unbounded on that side" means.
     *
     * Replaces PostgreSQL's `&&`.
     *
     * @template TBuilder of QueryBuilder|\Illuminate\Database\Eloquent\Builder<*>
     *
     * @param  TBuilder  $query
     * @param  string  $a  table or alias holding `build_from` / `build_to`
     * @param  string  $b  the other table or alias
     * @return TBuilder
     */
    public static function windowsOverlap(
        QueryBuilder|Builder $query,
        string $a,
        string $b,
        string $fromColumn = 'build_from',
        string $toColumn = 'build_to',
    ): QueryBuilder|Builder {
        self::assertIdentifier($a);
        self::assertIdentifier($b);
        self::assertIdentifier($fromColumn);
        self::assertIdentifier($toColumn);

        return $query->whereRaw(
            "(`{$a}`.`{$fromColumn}` IS NULL OR `{$b}`.`{$toColumn}` IS NULL "
            ."OR `{$a}`.`{$fromColumn}` <= `{$b}`.`{$toColumn}`) "
            ."AND (`{$b}`.`{$fromColumn}` IS NULL OR `{$a}`.`{$toColumn}` IS NULL "
            ."OR `{$b}`.`{$fromColumn}` <= `{$a}`.`{$toColumn}`)"
        );
    }

    /**
     * Is a value inside an open-ended min/max pair? A NULL bound is unbounded on that side.
     *
     * Replaces PostgreSQL's `<@`.
     *
     * @template TBuilder of QueryBuilder|\Illuminate\Database\Eloquent\Builder<*>
     *
     * @param  TBuilder  $query
     * @param  string  $valueColumn  fully qualified, e.g. `wheel_configs.width_in`
     * @param  string  $rangeColumn  the pair's stem, e.g. `fitments.permitted_width` for
     *                               `permitted_width_min` / `permitted_width_max`
     * @return TBuilder
     */
    public static function within(
        QueryBuilder|Builder $query,
        string $valueColumn,
        string $rangeColumn,
    ): QueryBuilder|Builder {
        return $query->whereRaw(self::withinExpression($valueColumn, $rangeColumn));
    }

    /**
     * The overlap predicate as a bare SQL fragment, for the single-statement listing query where
     * the builder is not available. Same expression, same single source.
     */
    public static function windowsOverlapExpression(
        string $a,
        string $b,
        string $fromColumn = 'build_from',
        string $toColumn = 'build_to',
    ): string {
        self::assertIdentifier($a);
        self::assertIdentifier($b);
        self::assertIdentifier($fromColumn);
        self::assertIdentifier($toColumn);

        return "(`{$a}`.`{$fromColumn}` IS NULL OR `{$b}`.`{$toColumn}` IS NULL "
            ."OR `{$a}`.`{$fromColumn}` <= `{$b}`.`{$toColumn}`) "
            ."AND (`{$b}`.`{$fromColumn}` IS NULL OR `{$a}`.`{$toColumn}` IS NULL "
            ."OR `{$b}`.`{$fromColumn}` <= `{$a}`.`{$toColumn}`)";
    }

    public static function withinExpression(string $valueColumn, string $rangeColumn): string
    {
        $value = self::quote($valueColumn);
        $min = self::quote($rangeColumn.'_min');
        $max = self::quote($rangeColumn.'_max');

        return "({$min} IS NULL OR {$value} >= {$min}) AND ({$max} IS NULL OR {$value} <= {$max})";
    }

    /** Quote `table.column` as `` `table`.`column` ``, validating every segment first. */
    private static function quote(string $qualified): string
    {
        $parts = explode('.', $qualified);

        foreach ($parts as $part) {
            self::assertIdentifier($part);
        }

        return '`'.implode('`.`', $parts).'`';
    }

    private static function assertIdentifier(string $value): void
    {
        if (preg_match(self::IDENTIFIER, $value) !== 1) {
            throw new InvalidArgumentException("Unsafe SQL identifier: [{$value}].");
        }
    }
}
