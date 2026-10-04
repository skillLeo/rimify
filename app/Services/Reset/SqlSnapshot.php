<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Generator;
use Illuminate\Database\Connection;
use RuntimeException;

/**
 * Tables of the database as one SQL file, and tables put back from one — the safety copy every reset of the test
 * environment takes first, and the baseline in the repository (database/baseline/testumgebung.sql). Written and read
 * in PHP over the app's own connection: the shared host allows no exec(), so there is no mysqldump to call.
 *
 * The file is plain SQL a person could also load with the mysql client (GO-LIVE.md §7.2): per table its DROP and its
 * CREATE, its rows as INSERTs, its triggers without DEFINER — the host's account may not name another user, and a
 * trigger that names one cannot be loaded there. Each statement is announced by a comment line `--@kind table`,
 * which is how replace() picks single tables out of a file, and the last line `--@end` says the file was written to
 * the end: a file without it is never loaded. Values are quoted by the connection itself, so a row never spans a
 * line.
 *
 * A table is put back by dropping it and creating it again — never by DELETE, so no row trigger fires (R-12's
 * append-only tables refuse a DELETE, and an invoice may only be inserted at the number its series stands at): the
 * rows go in before the triggers are made again, and the triggers are counted afterwards.
 */
final class SqlSnapshot
{
    public const FORMAT = 'rimify-snapshot/1';

    /** Rows per INSERT, and the bytes one may reach before it is cut (the host's max_allowed_packet is far above). */
    private const ROWS_PER_INSERT = 250;

    private const BYTES_PER_INSERT = 1_000_000;

    /** Rows read per query while a table is written. */
    private const PAGE = 2000;

    private const BINARY_TYPES = ['binary', 'varbinary', 'tinyblob', 'blob', 'mediumblob', 'longblob', 'bit'];

    public function __construct(private readonly Connection $db) {}

    /**
     * Writes `$tables` to `$path`: structure, rows and triggers. `$structureOnly` tables are written without their
     * rows. `$portable` writes what the repository keeps: no AUTO_INCREMENT counters and no compression, so the file
     * reads the same however often it is written.
     *
     * @param  list<string>  $tables
     * @param  array<string, mixed>  $meta
     * @param  list<string>  $structureOnly
     * @return array{tables: array<string, array{rows: int, auto_increment: int|null, triggers: int}>, triggers: int}
     */
    public function write(string $path, array $tables, array $meta = [], array $structureOnly = [], bool $portable = false): array
    {
        $part = $path.'.part';

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0775, true);
        }

        $out = $portable ? fopen($part, 'wb') : gzopen($part, 'wb6');

        if ($out === false) {
            throw new RuntimeException("Die Sicherung kann nicht nach {$path} geschrieben werden.");
        }

        $put = $portable
            ? static function (string $line) use ($out): void {
                fwrite($out, $line."\n");
            }
        : static function (string $line) use ($out): void {
            gzwrite($out, $line."\n");
        };

        $summary = [];
        $triggers = 0;

        try {
            $put('-- RIMIFY '.self::FORMAT.': '.(string) ($meta['purpose'] ?? 'Sicherung der Datenbank'));
            $put('--@meta '.json_encode(['format' => self::FORMAT, ...$meta, 'tables' => $tables], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
            $put('SET NAMES utf8mb4;');
            $put('SET FOREIGN_KEY_CHECKS = 0;');

            foreach ($tables as $table) {
                $summary[$table] = $this->writeTable($put, $table, in_array($table, $structureOnly, true), $portable);
                $triggers += $summary[$table]['triggers'];
            }

            // Its own frame, which no reader executes: a line after the last statement would otherwise read as its tail.
            $put('--@footer');
            $put('SET FOREIGN_KEY_CHECKS = 1;');
            $put('--@end '.json_encode(['tables' => $summary, 'triggers' => $triggers], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
        } finally {
            $portable ? fclose($out) : gzclose($out);
        }

        if (! rename($part, $path)) {
            throw new RuntimeException("Die Sicherung {$path} konnte nicht abgeschlossen werden.");
        }

        return ['tables' => $summary, 'triggers' => $triggers];
    }

    /**
     * The file's header: what it is, and what was recorded when it was written.
     *
     * @return array<string, mixed>
     */
    public static function meta(string $path): array
    {
        foreach (self::frames($path, stopAfterMeta: true) as $frame) {
            if ($frame['kind'] === 'meta') {
                return $frame['data'];
            }
        }

        throw new RuntimeException("{$path} ist keine Sicherung im Format ".self::FORMAT.'.');
    }

    /**
     * The file's last line — what it holds per table — or null when the file was not written to the end.
     *
     * @return array{tables: array<string, array{rows: int, auto_increment: int|null, triggers: int}>, triggers: int}|null
     */
    public static function summary(string $path): ?array
    {
        $end = null;

        foreach (self::frames($path) as $frame) {
            if ($frame['kind'] === 'end') {
                $end = $frame['data'];
            }
        }

        if (! is_array($end) || ! is_array($end['tables'] ?? null)) {
            return null;
        }

        /** @var array{tables: array<string, array{rows: int, auto_increment: int|null, triggers: int}>, triggers: int} $end */
        return $end;
    }

    /**
     * Drops `$tables` and makes them again from `$structure` — their CREATE and their triggers — with the rows `$rows`
     * holds for them (none when null). Foreign keys are not checked while the tables are empty and refilled: the
     * caller checks every reference once all are back (TestReset). A counter in `$floors` is the lowest AUTO_INCREMENT
     * a table may come back with, so no id that was ever given is given again.
     *
     * @param  list<string>  $tables
     * @param  array<string, int>  $floors
     */
    public function replace(array $tables, string $structure, ?string $rows, array $floors = []): void
    {
        if ($tables === []) {
            return;
        }

        $wanted = array_flip($tables);
        $made = [];
        $counters = [];

        $this->db->statement('SET FOREIGN_KEY_CHECKS = 0');

        try {
            foreach (self::frames($structure) as $frame) {
                if (in_array($frame['kind'], ['drop', 'create'], true) && isset($wanted[$frame['table']])) {
                    $this->db->unprepared($frame['sql']);
                    $made[$frame['table']] = true;
                }

                if ($frame['kind'] === 'end') {
                    foreach ($frame['data']['tables'] ?? [] as $table => $info) {
                        $counters[(string) $table] = is_array($info) && is_int($info['auto_increment'] ?? null) ? $info['auto_increment'] : null;
                    }
                }
            }

            $missing = array_diff($tables, array_keys($made));

            if ($missing !== []) {
                throw new RuntimeException('Die Sicherung enthält diese Tabellen nicht: '.implode(', ', $missing).'.');
            }

            if ($rows !== null) {
                foreach (self::frames($rows) as $frame) {
                    if ($frame['kind'] === 'rows' && isset($wanted[$frame['table']])) {
                        $this->db->unprepared($frame['sql']);
                    }
                }
            }

            foreach (self::frames($structure) as $frame) {
                if ($frame['kind'] === 'trigger' && isset($wanted[$frame['table']])) {
                    $this->db->unprepared(self::withoutDefiner($frame['sql']));
                }
            }
        } finally {
            $this->db->statement('SET FOREIGN_KEY_CHECKS = 1');
        }

        foreach ($floors as $table => $floor) {
            if (! isset($wanted[$table]) || $floor <= ($counters[$table] ?? 0)) {
                continue;
            }

            $this->db->statement(sprintf('ALTER TABLE %s AUTO_INCREMENT = %d', self::id($table), $floor));
        }
    }

    /**
     * Inserts the rows `$file` holds for `$table` into a temporary copy of it, and returns the copy's name — so the
     * caller can pick single rows out (the demo rows an undo brings back into a kept table) without loading the
     * whole table over the live one.
     */
    public function stage(string $file, string $table): string
    {
        $stage = '_reset_'.$table;

        $this->db->statement('DROP TEMPORARY TABLE IF EXISTS '.self::id($stage));
        $this->db->statement(sprintf('CREATE TEMPORARY TABLE %s LIKE %s', self::id($stage), self::id($table)));

        $prefix = 'INSERT INTO '.self::id($table).' ';

        foreach (self::frames($file) as $frame) {
            if ($frame['kind'] === 'rows' && $frame['table'] === $table && str_starts_with($frame['sql'], $prefix)) {
                $this->db->unprepared('INSERT INTO '.self::id($stage).' '.substr($frame['sql'], strlen($prefix)));
            }
        }

        return $stage;
    }

    /**
     * The statements of a file, in order: `meta` and `end` with their data, the rest with their SQL.
     *
     * @return Generator<int, array{kind: string, table: string, name: string|null, sql: string, data: array<string, mixed>}>
     */
    public static function frames(string $path, bool $stopAfterMeta = false): Generator
    {
        $in = @gzopen($path, 'rb');

        if ($in === false) {
            throw new RuntimeException("Die Sicherung {$path} lässt sich nicht öffnen.");
        }

        $frame = null;
        $sql = [];

        try {
            while (($line = gzgets($in)) !== false) {
                $line = rtrim($line, "\r\n");

                if (str_starts_with($line, '--@')) {
                    if ($frame !== null) {
                        yield self::frame($frame, $sql);
                    }

                    [$kind, $rest] = array_pad(explode(' ', substr($line, 3), 2), 2, '');
                    $frame = ['kind' => $kind, 'rest' => $rest];
                    $sql = [];

                    if ($kind === 'meta' || $kind === 'end') {
                        yield self::frame($frame, []);
                        $frame = null;

                        if ($kind === 'meta' && $stopAfterMeta) {
                            return;
                        }
                    }

                    continue;
                }

                // Outside a statement: the header's and footer's SET lines and comments. Inside one: its text, without
                // the DELIMITER lines the mysql client needs around a trigger.
                if ($frame === null || str_starts_with($line, 'DELIMITER ')) {
                    continue;
                }

                $sql[] = $line;
            }

            if ($frame !== null) {
                yield self::frame($frame, $sql);
            }
        } finally {
            gzclose($in);
        }
    }

    /** A trigger statement without its DEFINER: the account loading it becomes the definer. */
    public static function withoutDefiner(string $sql): string
    {
        return (string) preg_replace('/\s+DEFINER\s*=\s*(`[^`]*`|\'[^\']*\'|[^\s@]+)\s*@\s*(`[^`]*`|\'[^\']*\'|\S+)/i', '', $sql, 1);
    }

    /** A quoted identifier. Table names come from the schema or the code, never from a request (R-14). */
    public static function id(string $name): string
    {
        return '`'.str_replace('`', '``', $name).'`';
    }

    /**
     * @param  callable(string): void  $put
     * @return array{rows: int, auto_increment: int|null, triggers: int}
     */
    private function writeTable(callable $put, string $table, bool $structureOnly, bool $portable): array
    {
        $create = (array) $this->db->selectOne('SHOW CREATE TABLE '.self::id($table));
        $ddl = (string) ($create['Create Table'] ?? '');

        if ($ddl === '') {
            throw new RuntimeException("Die Tabelle {$table} lässt sich nicht lesen.");
        }

        $counter = preg_match('/\sAUTO_INCREMENT=(\d+)/', $ddl, $m) === 1 ? (int) $m[1] : null;

        if ($portable) {
            $ddl = (string) preg_replace('/\sAUTO_INCREMENT=\d+/', '', $ddl);
        }

        $put("--@drop {$table}");
        $put('DROP TABLE IF EXISTS '.self::id($table).';');
        $put("--@create {$table}");
        $put($ddl.';');

        $rows = $structureOnly ? 0 : $this->writeRows($put, $table);
        $triggers = $this->writeTriggers($put, $table);

        return ['rows' => $rows, 'auto_increment' => $portable ? null : $counter, 'triggers' => $triggers];
    }

    /** @param  callable(string): void  $put */
    private function writeRows(callable $put, string $table): int
    {
        $columns = $this->db->select(
            'SELECT COLUMN_NAME AS name, DATA_TYPE AS type, EXTRA AS extra, GENERATION_EXPRESSION AS expression
             FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
            [$table],
        );

        $stored = [];
        $binary = [];

        foreach ($columns as $column) {
            $name = (string) $column->name;
            $generated = stripos((string) $column->extra, 'GENERATED') !== false || ((string) ($column->expression ?? '')) !== '';

            if ($generated) {
                continue;
            }

            $stored[] = $name;

            if (in_array(strtolower((string) $column->type), self::BINARY_TYPES, true)) {
                $binary[$name] = true;
            }
        }

        $order = $this->primaryKey($table) ?: [$stored[0]];
        $select = sprintf(
            'SELECT %s FROM %s ORDER BY %s LIMIT %d OFFSET ',
            implode(', ', array_map(static fn (string $c): string => isset($binary[$c]) ? 'HEX('.self::id($c).') AS '.self::id($c) : self::id($c), $stored)),
            self::id($table),
            implode(', ', array_map(self::id(...), $order)),
            self::PAGE,
        );

        $head = 'INSERT INTO '.self::id($table).' ('.implode(', ', array_map(self::id(...), $stored)).') VALUES ';
        $pdo = $this->db->getPdo();
        /** @var list<string> $batch */
        $batch = [];
        $bytes = 0;
        $count = 0;

        for ($offset = 0; ; $offset += self::PAGE) {
            $page = $this->db->select($select.$offset);

            foreach ($page as $row) {
                $values = [];

                foreach ($stored as $column) {
                    $value = $row->{$column} ?? null;

                    $values[] = match (true) {
                        $value === null => 'NULL',
                        isset($binary[$column]) => $value === '' ? "''" : '0x'.$value,
                        is_int($value) => (string) $value,
                        is_float($value) => json_encode($value, JSON_THROW_ON_ERROR),
                        is_bool($value) => $value ? '1' : '0',
                        default => $pdo->quote((string) $value),
                    };
                }

                $tuple = '('.implode(', ', $values).')';
                $batch[] = $tuple;
                $bytes += strlen($tuple);
                $count++;

                if (count($batch) >= self::ROWS_PER_INSERT || $bytes >= self::BYTES_PER_INSERT) {
                    self::flush($put, $table, $head, $batch);
                    $batch = [];
                    $bytes = 0;
                }
            }

            if (count($page) < self::PAGE) {
                break;
            }
        }

        if ($batch !== []) {
            self::flush($put, $table, $head, $batch);
        }

        return $count;
    }

    /**
     * One INSERT of the rows gathered so far, announced as the table's.
     *
     * @param  callable(string): void  $put
     * @param  list<string>  $tuples
     */
    private static function flush(callable $put, string $table, string $head, array $tuples): void
    {
        $put("--@rows {$table}");
        $put($head.implode(', ', $tuples).';');
    }

    /** @param  callable(string): void  $put */
    private function writeTriggers(callable $put, string $table): int
    {
        $names = $this->db->select(
            'SELECT TRIGGER_NAME AS name FROM information_schema.TRIGGERS
             WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = ?
             ORDER BY ACTION_TIMING, EVENT_MANIPULATION, ACTION_ORDER, TRIGGER_NAME',
            [$table],
        );

        foreach ($names as $trigger) {
            $definition = (array) $this->db->selectOne('SHOW CREATE TRIGGER '.self::id((string) $trigger->name));
            $statement = self::withoutDefiner((string) ($definition['SQL Original Statement'] ?? ''));

            if ($statement === '') {
                throw new RuntimeException("Der Trigger {$trigger->name} lässt sich nicht lesen.");
            }

            $put("--@trigger {$table} {$trigger->name}");
            $put('DELIMITER ;;');
            $put(rtrim($statement, "; \n").';;');
            $put('DELIMITER ;');
        }

        return count($names);
    }

    /** @return list<string> */
    private function primaryKey(string $table): array
    {
        $keys = $this->db->select(
            'SELECT COLUMN_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? ORDER BY ORDINAL_POSITION',
            [$table, 'PRIMARY'],
        );

        return array_map(static fn (object $k): string => (string) $k->name, $keys);
    }

    /**
     * @param  array{kind: string, rest: string}  $frame
     * @param  list<string>  $sql
     * @return array{kind: string, table: string, name: string|null, sql: string, data: array<string, mixed>}
     */
    private static function frame(array $frame, array $sql): array
    {
        if ($frame['kind'] === 'meta' || $frame['kind'] === 'end') {
            $data = json_decode($frame['rest'], true);

            return ['kind' => $frame['kind'], 'table' => '', 'name' => null, 'sql' => '', 'data' => is_array($data) ? $data : []];
        }

        [$table, $name] = array_pad(explode(' ', $frame['rest'], 2), 2, null);
        $text = rtrim(implode("\n", $sql));
        $text = str_ends_with($text, ';;') ? substr($text, 0, -2) : (str_ends_with($text, ';') ? substr($text, 0, -1) : $text);

        return ['kind' => $frame['kind'], 'table' => (string) $table, 'name' => $name, 'sql' => $text, 'data' => []];
    }
}
