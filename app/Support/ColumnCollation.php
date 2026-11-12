<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The collation a column compares with, read from the schema once per connection (D-462): a value joined in from a
 * derived table compares exactly as one bound in a `where()` would — under the column's own rules, case and accents as
 * the column has them —, on MySQL and on MariaDB alike. Only a name of letters, digits and underscores is handed out.
 */
final class ColumnCollation
{
    /** @var array<string, string> */
    private static array $known = [];

    public static function of(string $table, string $column): string
    {
        $key = DB::connection()->getName().'|'.DB::connection()->getDatabaseName().'|'.$table.'|'.$column;

        if (! isset(self::$known[$key])) {
            $name = (string) DB::table('information_schema.COLUMNS')
                ->whereRaw('TABLE_SCHEMA = DATABASE()')
                ->where('TABLE_NAME', $table)
                ->where('COLUMN_NAME', $column)
                ->value('COLLATION_NAME');

            if (preg_match('/^[A-Za-z0-9_]+$/', $name) !== 1) {
                throw new RuntimeException('The collation of '.$table.'.'.$column.' could not be read.');
            }

            self::$known[$key] = $name;
        }

        return self::$known[$key];
    }
}
