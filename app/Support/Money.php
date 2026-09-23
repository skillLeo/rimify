<?php

declare(strict_types=1);

namespace App\Support;

/**
 * German money INPUT: `1.425,00 €` → 142500 cents.
 *
 * An input parser only — every rendered amount goes through `GermanFormat::money()` (R-10). A
 * price nobody can read unambiguously is refused with null, never guessed: the figure an admin
 * types here ends up frozen on a real bill through `order_lines.unit_price_cents` (CLAUDE.md §2).
 */
final class Money
{
    /** Longer than this and the cents no longer fit a 64-bit integer — no real price is close. */
    private const MAX_EURO_DIGITS = 15;

    /**
     * `1.425,00 €`, `1.425,00`, `1425,5`, `1425` → integer cents. NULL when the input is empty,
     * ambiguous, negative or malformed.
     */
    public static function fromGerman(string $input): ?int
    {
        // 1. Currency markers and every kind of space, including the two no-break spaces German
        //    typography puts before the euro sign.
        $value = trim((string) preg_replace('/(€|EUR|\x{00A0}|\x{202F}|\s)+/iu', '', $input));

        // 2. Empty, or negative in either spelling of the minus. No price on these screens is
        //    negative, so a minus is a typo we refuse rather than a sign we strip.
        if ($value === '' || str_contains($value, '-') || str_contains($value, "\u{2212}")) {
            return null;
        }

        // 3. Nothing but digits, points and commas.
        if (preg_match('/^[0-9.,]+$/', $value) !== 1) {
            return null;
        }

        $hasPoint = str_contains($value, '.');
        $hasComma = str_contains($value, ',');

        if ($hasPoint && $hasComma) {
            // 4. `1.425,00`: the point is the thousands separator, and the grouping is validated
            //    BEFORE the points are stripped — `1.42,00`, an admin who meant `1.425,00`, is
            //    refused rather than silently read as 142,00 €.
            if (preg_match('/^(\d{1,3}(?:\.\d{3})+),(\d{1,2})$/', $value, $m) !== 1) {
                return null;
            }

            return self::cents(str_replace('.', '', $m[1]), $m[2]);
        }

        if ($hasComma) {
            // 5. `1425,5` — a decimal comma with one or two digits after it, never three.
            if (preg_match('/^(\d+),(\d{1,2})$/', $value, $m) !== 1) {
                return null;
            }

            return self::cents($m[1], $m[2]);
        }

        if ($hasPoint) {
            // 6. German writes a thousands point: `1.425` is 1425 €. `49.00` could be 49 € or
            //    49 cents, and we do not guess.
            if (preg_match('/^\d{1,3}(?:\.\d{3})+$/', $value) !== 1) {
                return null;
            }

            return self::cents(str_replace('.', '', $value), '0');
        }

        // 7. Digits only: whole euros.
        return self::cents($value, '0');
    }

    /** 8. Integer maths on the digit strings — never a float round-trip. */
    private static function cents(string $euros, string $decimals): ?int
    {
        if (strlen($euros) > self::MAX_EURO_DIGITS) {
            return null;
        }

        return (int) $euros * 100 + (int) str_pad($decimals, 2, '0');
    }
}
