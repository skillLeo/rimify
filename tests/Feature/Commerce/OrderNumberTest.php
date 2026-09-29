<?php

declare(strict_types=1);

use App\Models\Order;
use App\Services\Commerce\OrderWriter;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Order numbers are never issued twice (the launch release §3): the year's last number is read under
 * a row lock, the table's unique index refuses a duplicate whatever happens, and a refused number is
 * drawn again. Two writers a second apart cannot read the same last number.
 */
function numberedOrder(string $number): Order
{
    return Order::factory()->create(['order_number' => $number, 'is_demo' => false]);
}

it('draws the number again when another checkout took it in between', function (): void {
    $year = now()->year;
    numberedOrder("RMF-{$year}-0041");
    $taken = false;

    $order = OrderWriter::withNumber(function (string $number) use (&$taken): Order {
        // The other checkout wins the race for this number once: the unique index refuses ours.
        if (! $taken) {
            $taken = true;
            numberedOrder($number);
        }

        return Order::factory()->create(['order_number' => $number, 'is_demo' => false]);
    });

    expect($order->order_number)->toBe("RMF-{$year}-0043")
        ->and(Order::query()->where('order_number', "RMF-{$year}-0042")->count())->toBe(1);
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

it('makes a second writer wait while the first holds the last number', function (): void {
    $year = now()->year;
    numberedOrder("RMF-{$year}-0100");

    // The first checkout: inside its transaction it has read the last number, under the lock.
    $first = OrderWriter::nextNumber();
    expect($first)->toBe("RMF-{$year}-0101");

    // The second checkout, on its own connection, a second later: it may not read the same number.
    config(['database.connections.second_writer' => config('database.connections.'.config('database.default'))]);
    $second = DB::connection('second_writer');
    $second->statement('SET SESSION innodb_lock_wait_timeout = 1');
    $second->beginTransaction();

    try {
        expect(fn () => $second->table('orders')
            ->where('order_number', 'like', "RMF-{$year}-%")
            ->lockForUpdate()
            ->selectRaw('MAX(CAST(SUBSTRING(order_number, ?) AS UNSIGNED)) AS n', [strlen("RMF-{$year}-") + 1])
            ->value('n'))->toThrow(QueryException::class, 'Lock wait timeout');
    } finally {
        $second->rollBack();
        DB::purge('second_writer');
    }
});
