<?php

declare(strict_types=1);

namespace App\Support;

use InvalidArgumentException;

/**
 * The one place a quantity multiplies a price (D-102).
 *
 * A stored price is ALWAYS one item: one rim (`wheel_configs.price_cents`), one tyre, one mounting, one sensor. A
 * line, a set or the product page's figure for a chosen amount is that price times its quantity — worked out here and
 * nowhere else, then formatted through Money. Three bugs of one family came from a second multiplier: a tile at a
 * quarter of the price, one rim labelled as the set, and a product page that showed one rim's price while its button
 * put four in the basket without a word (the client's #14, 01.10.2026).
 *
 * Kept honest by two tests: `MoneyDisplayTest` reads 229,00 € and 916,00 € on every surface, and `LinePriceGuardTest`
 * fails on any other multiplier in `app/` or `resources/js/`. Money itself no longer multiplies.
 */
final class LinePrice
{
    /** One item's price, `$quantity` times: 229,00 € × 4 = 916,00 €. Never a fraction, never below zero. */
    public static function total(Money $unit, int $quantity): Money
    {
        if ($quantity < 0) {
            throw new InvalidArgumentException("A quantity of [{$quantity}] is not a quantity.");
        }

        return Money::fromMinor($unit->toMinor() * $quantity, $unit->currency());
    }

    /**
     * The figure for each amount a page offers, from one item's price: what the product page's amount selector shows
     * as the customer changes it — computed here, so the browser never multiplies money.
     *
     * @param  list<int>  $quantities
     * @return list<array{quantity: int, cents: int, text: string}>
     */
    public static function byQuantity(Money $unit, array $quantities): array
    {
        return array_map(static function (int $quantity) use ($unit): array {
            $total = self::total($unit, $quantity);

            return ['quantity' => $quantity, 'cents' => $total->toMinor(), 'text' => $total->format()];
        }, $quantities);
    }
}
