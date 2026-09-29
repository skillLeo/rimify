<?php

declare(strict_types=1);

use Illuminate\Database\Events\ConnectionEstablished;
use Illuminate\Database\MySqlConnection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * MySQL addendum §7/§9: strict mode is a correctness requirement. Outside it an unparseable axle
 * load is silently stored as 0, a zero axle load derives a minimum load index of zero, and that
 * permits every tyre — R-03 failing open.
 */

it('runs every MySQL connection in strict mode', function (): void {
    $modes = explode(',', (string) DB::selectOne('SELECT @@SESSION.sql_mode AS m')->m);

    expect($modes)->toContain(
        'STRICT_TRANS_TABLES',
        'ERROR_FOR_DIVISION_BY_ZERO',
        'NO_ZERO_DATE',
        'NO_ZERO_IN_DATE',
        'NO_ENGINE_SUBSTITUTION',
    );
});

it('stores and reads timestamps in UTC', function (): void {
    expect(DB::selectOne('SELECT @@SESSION.time_zone AS tz')->tz)->toBe('+00:00');
});

it('uses the accent- and case-insensitive utf8mb4 collation key numbers rely on', function (): void {
    expect(DB::selectOne('SELECT @@SESSION.collation_connection AS c')->c)->toBe('utf8mb4_0900_ai_ci');
});

it('rejects a non-numeric value for a numeric column instead of coercing it to zero', function (): void {
    Schema::create('strict_mode_probe', function ($table): void {
        $table->unsignedInteger('axle_load_front_kg')->nullable();
    });

    try {
        expect(fn () => DB::statement("INSERT INTO strict_mode_probe (axle_load_front_kg) VALUES ('n/a')"))
            ->toThrow(QueryException::class);

        expect(DB::table('strict_mode_probe')->count())->toBe(0);
    } finally {
        Schema::dropIfExists('strict_mode_probe');
    }
});

// A connection lost during the check reconnects, and a reconnect announces a new connection: asking again from
// inside the check recursed until PHP ran out of memory. The check runs once; the reconnect inside it is not re-checked.
it('checks a connection once, and never again from inside its own check', function (): void {
    $asked = 0;
    $connection = Mockery::mock(MySqlConnection::class);
    $connection->shouldReceive('getDriverName')->andReturn('mysql');
    $connection->shouldReceive('getName')->andReturn('mysql');
    $connection->shouldReceive('selectOne')->andReturnUsing(function () use (&$asked, $connection): object {
        $asked++;
        // What Laravel does when the query finds the connection gone: reconnect, and announce it.
        event(new ConnectionEstablished($connection));

        return (object) ['sql_mode' => 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY'];
    });

    event(new ConnectionEstablished($connection));

    expect($asked)->toBe(1);
});

it('refuses to boot a MySQL connection that is not strict', function (): void {
    config()->set('database.connections.lax', array_merge(
        config('database.connections.mysql'),
        ['strict' => false, 'modes' => ['NO_ENGINE_SUBSTITUTION']],
    ));

    expect(fn () => DB::connection('lax')->select('SELECT 1'))
        ->toThrow(RuntimeException::class, 'not in strict mode');

    DB::purge('lax');
});
