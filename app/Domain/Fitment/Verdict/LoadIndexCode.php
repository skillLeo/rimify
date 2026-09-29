<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * Which `reifen_tragfaehigkeit` Auflagen are load-index requirements (the operator's second review of C9,
 * §3): the ones whose code names an index, as ABE 55255 prints them — `T88` is load index 88 up to the axle
 * load it states, `T00` is 100. Any other code with a kilogram figure (ABE 55255's `140`) is an axle-load
 * note, not a load index, and is never read as one.
 */
final class LoadIndexCode
{
    /** The index a code names: T88 → 88, T00 → 100; null for any other code. */
    public static function indexNamedBy(string $code): ?int
    {
        if (preg_match('/^T(\d{2})$/', strtoupper(trim($code)), $m) !== 1) {
            return null;
        }

        return (int) $m[1] === 0 ? 100 : (int) $m[1];
    }
}
