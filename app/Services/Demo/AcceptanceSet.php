<?php

declare(strict_types=1);

namespace App\Services\Demo;

/**
 * The acceptance set (`rimify:demo --abnahme`, the operator's brief „THE 34“ §1.3): a small shop the client can look at
 * and buy from with the test payment — the DB8GT2 on the two real Gutachten, three demo cars with their papers' figures,
 * tyres and the Komplettrad's accessories — every row born demo, its `demo_ref` under `abnahme:`.
 *
 * The one place a demo row reaches the storefront: the old example catalogue stays refused everywhere, and so does
 * this set in production, whatever its rows say (`demo:assert-clean` refuses any demo row there anyway).
 */
final class AcceptanceSet
{
    public const PREFIX = 'abnahme:';

    /** Whether a row is the acceptance set's: born demo, its ref under the set's prefix. */
    public static function owns(bool $isDemo, ?string $ref): bool
    {
        return $isDemo && is_string($ref) && str_starts_with($ref, self::PREFIX);
    }

    /** Whether a demo row may be shown and sold here: the acceptance set's, and never in production. */
    public static function sellable(bool $isDemo, ?string $ref): bool
    {
        return self::owns($isDemo, $ref) && ! app()->environment('production');
    }

    /** Whether a row is demo data the shop must not sell: demo, and not the acceptance set's here. */
    public static function refused(bool $isDemo, ?string $ref): bool
    {
        return $isDemo && ! self::sellable($isDemo, $ref);
    }
}
