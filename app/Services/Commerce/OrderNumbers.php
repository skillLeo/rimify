<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The order number (his admin item 18, D-354): `2611-10487` — the order's year and month in Berlin, then a counter that
 * never resets and grows by a random step of 1 to 9 from a secure source, starting at a random value from 10000 to
 * 19999, so neither the first order nor the shop's volume reads off a number.
 *
 * Drawn inside the order's transaction under a row lock on the counter: a second checkout waits for the first to
 * commit, so two orders never share a step, and the table's unique index on `order_number` refuses one regardless.
 * Orders from before keep their numbers (`RMF-2026-0006`, the demo set's `RMF-D-…`).
 */
final class OrderNumbers
{
    /** The counter's one row. */
    private const ROW = 1;

    public const START_MIN = 10000;

    public const START_MAX = 19999;

    public const STEP_MAX = 9;

    /** Must run inside the transaction that writes the order: the lock is held until it commits. */
    public static function next(?CarbonImmutable $at = null): string
    {
        // The migration writes the row. Only locked here, never inserted on the way: an INSERT IGNORE before the lock
        // would hold a shared lock to the commit, and two checkouts would wait on each other.
        $row = DB::table('order_number_counter')->where('id', self::ROW)->lockForUpdate()->first(['last_value']);

        if ($row === null) {
            // Someone removed it: written again, once, and read under the lock as always.
            DB::table('order_number_counter')->insertOrIgnore(['id' => self::ROW, 'last_value' => null, 'created_at' => now(), 'updated_at' => now()]);
            $row = DB::table('order_number_counter')->where('id', self::ROW)->lockForUpdate()->first(['last_value']);
        }

        $last = $row?->last_value;
        $next = $last === null ? random_int(self::START_MIN, self::START_MAX) : (int) $last + random_int(1, self::STEP_MAX);

        DB::table('order_number_counter')->where('id', self::ROW)->update(['last_value' => $next, 'updated_at' => now()]);

        return ($at ?? CarbonImmutable::now())->setTimezone('Europe/Berlin')->format('ym').'-'.$next;
    }
}
