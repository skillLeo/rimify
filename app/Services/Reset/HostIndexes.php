<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Illuminate\Database\Connection;
use Illuminate\Database\Schema\Blueprint;

/**
 * The indexes the preview's host adds on its own (D-476, D-477): its MariaDB puts a plain index named
 * `wdbi_<columns>_<hash>` on the columns of any query that stayed in its slow log, about twenty minutes later — no
 * migration of ours makes one, and the reset's check of the schema refused every reset while one stood.
 *
 * Only a NON-unique index with exactly this prefix counts: a unique one changes what the database accepts, so it is
 * never ignored and never removed here — the reset check keeps refusing it, as any change outside a migration.
 */
final class HostIndexes
{
    public const PREFIX = 'wdbi_';

    public static function is(string $name, bool $nonUnique): bool
    {
        return $nonUnique && str_starts_with($name, self::PREFIX);
    }

    /**
     * Every host index in this database: its table, name and columns in order.
     *
     * @return list<array{table: string, name: string, columns: list<string>}>
     */
    public static function in(Connection $db): array
    {
        $found = [];

        foreach ($db->select(
            'SELECT TABLE_NAME AS t, INDEX_NAME AS i, COLUMN_NAME AS c, NON_UNIQUE AS u
             FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX'
        ) as $row) {
            if (! self::is((string) $row->i, (int) $row->u === 1)) {
                continue;
            }

            $key = $row->t.'.'.$row->i;
            $found[$key] ??= ['table' => (string) $row->t, 'name' => (string) $row->i, 'columns' => []];
            $found[$key]['columns'][] = (string) $row->c;
        }

        // Byte by byte: the two engines order information_schema by their own collations (SchemaFingerprint).
        ksort($found, SORT_STRING);

        return array_values($found);
    }

    /**
     * Removes every host index, each by its own quoted name (never a string of SQL put together), and returns them.
     *
     * @return list<array{table: string, name: string, columns: list<string>}>
     */
    public static function remove(Connection $db): array
    {
        $found = self::in($db);

        foreach ($found as $index) {
            $db->getSchemaBuilder()->table($index['table'], static function (Blueprint $table) use ($index): void {
                $table->dropIndex($index['name']);
            });
        }

        return $found;
    }
}
