<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * Which `reifen_tragfaehigkeit` Auflagen are load-index requirements (the operator's second review of C9,
 * §3): the ones whose code names an index, as ABE 55255 prints them — `T88` is load index 88 up to the axle
 * load it states, `T00` is 100. Any other code with a kilogram figure (ABE 55255's `140`) is an axle-load
 * note, not a load index, and is never read as one.
 *
 * The code is the index's last two digits: T70 to T99 are 70 to 99, and from T00 on the hundreds — T00 is 100,
 * so T05 is 105 and T12 is 112 (D-310). Read as 5 or 12, such a limit would bind no tyre the shop sells and the
 * release check would pass it unread — the permissive direction. The shop's table starts at 70, so a code below T70
 * is read as the hundreds, never as an index it does not know; one above the table (T21 = 121) has no capacity here
 * either, and no tyre meets it — the strict direction, as everywhere a figure cannot be read.
 */
final class LoadIndexCode
{
    /** The index a code names: T88 → 88, T00 → 100, T12 → 112; null for any other code. */
    public static function indexNamedBy(string $code): ?int
    {
        if (preg_match('/^T(\d{2})$/', strtoupper(trim($code)), $m) !== 1) {
            return null;
        }

        $digits = (int) $m[1];

        return $digits >= 70 ? $digits : 100 + $digits;
    }
}
