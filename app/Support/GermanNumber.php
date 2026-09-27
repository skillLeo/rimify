<?php

declare(strict_types=1);

namespace App\Support;

/**
 * German measurement INPUT: `8,5` → `8.5`, `66,6` → `66.6`, `-12` → `-12`.
 *
 * An input parser only, like Money::fromGerman: a figure nobody can read unambiguously is refused
 * with null, never guessed. A measurement typed here decides which approval a wheel matches, so a
 * point that might be a thousands separator is refused rather than read either way.
 */
final class GermanNumber
{
    /**
     * The value as a decimal string with a point (`8.5`), or null when it is empty or malformed, has
     * more decimals than allowed, or is negative where a negative is not allowed.
     *
     * `$pointIsDecimal` reads `8.5` as eight and a half — for a supplier's file that says so, never for
     * a field a person types in.
     */
    public static function parse(string $input, int $maxDecimals, bool $negative = false, bool $pointIsDecimal = false): ?string
    {
        $value = trim((string) preg_replace('/(mm|zoll|\"|\x{00A0}|\x{202F}|\s)+/iu', '', $input));
        $value = str_replace("\u{2212}", '-', $value);

        if ($value === '') {
            return null;
        }

        if ($pointIsDecimal) {
            if (str_contains($value, ',')) {
                return null;
            }

            $value = str_replace('.', ',', $value);
        }

        if (preg_match('/^(-?)(\d{1,6})(?:,(\d+))?$/', $value, $m) !== 1) {
            return null;
        }

        [, $sign, $whole] = $m;
        $fraction = rtrim($m[3] ?? '', '0');

        if ($sign === '-' && ! $negative) {
            return null;
        }

        if (strlen($fraction) > $maxDecimals) {
            return null;
        }

        $number = ltrim($whole, '0') === '' ? '0' : ltrim($whole, '0');
        $result = $fraction === '' ? $number : $number.'.'.$fraction;

        return $sign === '-' && $result !== '0' ? '-'.$result : $result;
    }

    /** A whole number, or null. */
    public static function integer(string $input, bool $negative = false): ?int
    {
        $value = self::parse($input, 0, $negative);

        return $value === null ? null : (int) $value;
    }
}
