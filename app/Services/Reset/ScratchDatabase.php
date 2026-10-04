<?php

declare(strict_types=1);

namespace App\Services\Reset;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * A database of its own beside the app's, on the same server and account: where `rimify:reset-baseline` builds the
 * baseline, and where the reset's tests replace tables without touching the database the other tests run in.
 * Made and dropped over a connection of its own, so the statements never end a transaction open on the app's.
 */
final class ScratchDatabase
{
    public function __construct(public readonly string $name, public readonly string $connection) {}

    /** Makes the database (empty) and a connection named `$connection` to it, cloned from `$from`. */
    public static function create(string $name, string $connection, ?string $from = null): self
    {
        if (preg_match('/^[A-Za-z0-9_]{1,64}$/', $name) !== 1) {
            throw new InvalidArgumentException("{$name} is not a database name this would make.");
        }

        $from ??= (string) config('database.default');
        /** @var array<string, mixed> $base */
        $base = (array) config("database.connections.{$from}");

        config(["database.connections.{$connection}__admin" => [...$base, 'database' => 'information_schema']]);
        $admin = DB::connection("{$connection}__admin");
        $charset = (string) ($base['charset'] ?? 'utf8mb4');
        $collation = (string) ($base['collation'] ?? 'utf8mb4_unicode_ci');

        $admin->statement('DROP DATABASE IF EXISTS '.SqlSnapshot::id($name));
        $admin->statement(sprintf('CREATE DATABASE %s CHARACTER SET %s COLLATE %s', SqlSnapshot::id($name), $charset, $collation));

        config(["database.connections.{$connection}" => [...$base, 'database' => $name]]);
        DB::purge($connection);

        return new self($name, $connection);
    }

    public function db(): Connection
    {
        return DB::connection($this->connection);
    }

    public function drop(): void
    {
        DB::purge($this->connection);
        DB::connection("{$this->connection}__admin")->statement('DROP DATABASE IF EXISTS '.SqlSnapshot::id($this->name));
        DB::purge("{$this->connection}__admin");
    }
}
