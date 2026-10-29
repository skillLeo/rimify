<?php

declare(strict_types=1);

use App\Models\Order;
use App\Services\Commerce\OrderNumbers;
use App\Services\Commerce\OrderWriter;
use App\Services\Reset\ScratchDatabase;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * The order number (his admin item 18, D-354): `YYMM-n` — the order's year and month in Berlin, then a counter that
 * never resets, raised by a random step of 1 to 9, starting at a random value from 10000 to 19999. Drawn under a row
 * lock inside the order's transaction; the table's unique index refuses a duplicate whatever happens, and a refused
 * number is drawn again.
 */
function numberedOrder(string $number): Order
{
    return Order::factory()->create(['order_number' => $number, 'is_demo' => false]);
}

/** @return array{0: string, 1: int} `YYMM` and the counter */
function numberParts(string $number): array
{
    expect($number)->toMatch('/^\d{4}-\d{5,}$/');

    return [substr($number, 0, 4), (int) substr($number, 5)];
}

it('starts at a random value from 10000 to 19999, and steps 1 to 9 from there, never twice the same', function (): void {
    [, $first] = numberParts(DB::transaction(static fn (): string => OrderNumbers::next()));
    expect($first)->toBeGreaterThanOrEqual(OrderNumbers::START_MIN)->toBeLessThanOrEqual(OrderNumbers::START_MAX);

    $last = $first;
    $steps = [];

    foreach (range(1, 200) as $_) {
        [, $n] = numberParts(DB::transaction(static fn (): string => OrderNumbers::next()));
        $steps[] = $n - $last;
        $last = $n;
    }

    expect(min($steps))->toBeGreaterThanOrEqual(1)->and(max($steps))->toBeLessThanOrEqual(OrderNumbers::STEP_MAX)
        // Random, not a constant step: two hundred draws take more than one size of step.
        ->and(count(array_unique($steps)))->toBeGreaterThan(1)
        ->and(DB::table('order_number_counter')->value('last_value'))->toBe($last);
});

it('takes the year and month in Berlin — an order placed at 00:30 on 1 November in Berlin is November’s', function (): void {
    // 31 October 2026, 23:30 UTC: already 1 November, 00:30, in Berlin (CET).
    [$month] = numberParts(DB::transaction(static fn (): string => OrderNumbers::next(CarbonImmutable::parse('2026-10-31 23:30:00', 'UTC'))));
    [$before] = numberParts(DB::transaction(static fn (): string => OrderNumbers::next(CarbonImmutable::parse('2026-10-31 22:30:00', 'UTC'))));

    expect($month)->toBe('2611')->and($before)->toBe('2610');
});

it('draws the number again when another checkout took it in between', function (): void {
    $taken = null;

    $order = OrderWriter::withNumber(function (string $number) use (&$taken): Order {
        // The other checkout wins the race for this number once: the unique index refuses ours.
        if ($taken === null) {
            $taken = $number;
            numberedOrder($number);
        }

        return Order::factory()->create(['order_number' => $number, 'is_demo' => false]);
    });

    expect($order->order_number)->not->toBe($taken)
        ->and(numberParts($order->order_number)[1])->toBeGreaterThan(numberParts((string) $taken)[1])
        ->and(Order::query()->where('order_number', $taken)->count())->toBe(1);
});

it('fails loudly after three refusals instead of guessing a number', function (): void {
    $attempts = 0;

    expect(function () use (&$attempts): void {
        OrderWriter::withNumber(function (string $number) use (&$attempts): Order {
            $attempts++;
            numberedOrder($number);

            return Order::factory()->create(['order_number' => $number, 'is_demo' => false]);
        });
    })->toThrow(UniqueConstraintViolationException::class);

    expect($attempts)->toBe(OrderWriter::NUMBER_ATTEMPTS);
});

it('makes a second writer wait while the first holds the counter', function (): void {
    // The first checkout: inside its transaction it has drawn its number, under the lock.
    OrderWriter::nextNumber();

    // The second checkout, on its own connection, a second later: it may not read the counter until the first commits.
    config(['database.connections.second_writer' => config('database.connections.'.config('database.default'))]);
    $second = DB::connection('second_writer');
    $second->statement('SET SESSION innodb_lock_wait_timeout = 1');
    $second->beginTransaction();

    try {
        expect(fn () => $second->table('order_number_counter')->where('id', 1)->lockForUpdate()->value('last_value'))
            ->toThrow(QueryException::class, 'Lock wait timeout');
    } finally {
        $second->rollBack();
        DB::purge('second_writer');
    }
});

it('gives fifty checkouts at once fifty numbers, all different, each a step of 1 to 9 above the one before', function (): void {
    // Fifty PHP processes against a database of their own, at the same moment — the test's own transaction would hide
    // the counter from them, and their numbers must not touch the suite's.
    $scratch = ScratchDatabase::create(substr((string) config('database.connections.'.config('database.default').'.database'), 0, 40).'_numbers', 'order_numbers');

    try {
        // The table as the migration leaves it: its one row, no start drawn yet.
        $scratch->db()->getSchemaBuilder()->create('order_number_counter', function (Blueprint $table): void {
            $table->unsignedTinyInteger('id')->primary();
            $table->unsignedInteger('last_value')->nullable();
            $table->timestamps();
        });
        $scratch->db()->table('order_number_counter')->insert(['id' => 1, 'last_value' => null]);

        $connection = (array) config('database.connections.order_numbers');
        $env = [
            ...getenv(),
            'APP_ENV' => 'local',
            'DB_CONNECTION' => (string) ($connection['driver'] ?? 'mysql'),
            'DB_HOST' => (string) ($connection['host'] ?? '127.0.0.1'),
            'DB_PORT' => (string) ($connection['port'] ?? '3306'),
            'DB_DATABASE' => $scratch->name,
            'DB_USERNAME' => (string) ($connection['username'] ?? ''),
            'DB_PASSWORD' => (string) ($connection['password'] ?? ''),
            'CACHE_STORE' => 'array',
            'SESSION_DRIVER' => 'array',
            'QUEUE_CONNECTION' => 'sync',
        ];

        $children = [];

        foreach (range(1, 50) as $i) {
            $children[$i] = proc_open([PHP_BINARY, base_path('tests/Support/order-number-child.php')], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, base_path(), $env);
            $children[$i] = [$children[$i], $pipes];
        }

        $numbers = [];

        foreach ($children as [$process, $pipes]) {
            $out = trim((string) stream_get_contents($pipes[1]));
            $err = trim((string) stream_get_contents($pipes[2]));
            fclose($pipes[1]);
            fclose($pipes[2]);
            expect(proc_close($process))->toBe(0, $err);
            $numbers[] = $out;
        }

        $counters = array_map(static fn (string $number): int => numberParts($number)[1], $numbers);
        sort($counters);
        $steps = array_map(static fn (int $a, int $b): int => $b - $a, array_slice($counters, 0, -1), array_slice($counters, 1));

        expect(count(array_unique($numbers)))->toBe(50)
            // Each drew from the one before it, in turn: one chain, no gap wider than a step, no step of zero.
            ->and(min($steps))->toBeGreaterThanOrEqual(1)
            ->and(max($steps))->toBeLessThanOrEqual(OrderNumbers::STEP_MAX)
            ->and((int) $scratch->db()->table('order_number_counter')->value('last_value'))->toBe(max($counters));
    } finally {
        $scratch->drop();
    }
});
