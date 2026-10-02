<?php

declare(strict_types=1);

namespace App\Support;

use InvalidArgumentException;

/**
 * An amount of money: integer minor units and their currency, and the one place money is computed
 * (the launch release §4). Two of the six bugs the golden record found were prices converted in a
 * second place; this closes the class.
 *
 *   Money::fromMinor(142500)                 1.425,00 €
 *   LinePrice::total($money, 4)              5.700,00 € — a quantity, in the one place it multiplies (D-102)
 *   ->vatIncluded(Money::VAT_STANDARD_BP)    the 19 % a gross German price contains
 *   ->withVat(1900)                          net → gross
 *   ->format()                               through GermanFormat::money (R-10)
 *
 * No float is anywhere near it: rates are basis points (1900 = 19 %, as `order_lines.tax_rate_bp`),
 * every division is integer division rounded half away from zero, the commercial rounding of a
 * German invoice. Amounts in different currencies are never added — that throws.
 *
 * Beside it, the German INPUT parser (`fromGerman`): `1.425,00 €` → 142500, and a price nobody can
 * read unambiguously is refused with null, never guessed: the figure an admin types ends up frozen
 * on a real bill through `order_lines.unit_price_cents` (CLAUDE.md §2).
 */
final readonly class Money
{
    /** The German standard rate, in basis points. */
    public const VAT_STANDARD_BP = 1900;

    /** Longer than this and the cents no longer fit a 64-bit integer — no real price is close. */
    private const MAX_EURO_DIGITS = 15;

    private function __construct(private int $minor, private string $currency) {}

    /** From integer minor units (cents) in an ISO 4217 currency. */
    public static function fromMinor(int $minor, string $currency = 'EUR'): self
    {
        if (preg_match('/^[A-Z]{3}$/', $currency) !== 1) {
            throw new InvalidArgumentException("[{$currency}] is not an ISO 4217 currency code.");
        }

        return new self($minor, $currency);
    }

    public static function zero(string $currency = 'EUR'): self
    {
        return self::fromMinor(0, $currency);
    }

    public function toMinor(): int
    {
        return $this->minor;
    }

    public function currency(): string
    {
        return $this->currency;
    }

    /* No `multiply`: a quantity times a price is LinePrice's, and only LinePrice's (D-102). */

    public function plus(self $other): self
    {
        return new self($this->minor + $this->same($other)->minor, $this->currency);
    }

    public function minus(self $other): self
    {
        return new self($this->minor - $this->same($other)->minor, $this->currency);
    }

    /** This net amount with VAT at `$rateBp` added: 100,00 € at 1900 → 119,00 €. */
    public function withVat(int $rateBp): self
    {
        return new self($this->minor + self::divide($this->minor * self::rate($rateBp), 10_000), $this->currency);
    }

    /** The VAT a gross amount contains at `$rateBp`: 119,00 € at 1900 → 19,00 €. */
    public function vatIncluded(int $rateBp): self
    {
        $rate = self::rate($rateBp);

        return new self(self::divide($this->minor * $rate, 10_000 + $rate), $this->currency);
    }

    /** The net part of a gross amount: the gross less the VAT it contains. */
    public function withoutVat(int $rateBp): self
    {
        return $this->minus($this->vatIncluded($rateBp));
    }

    public function equals(self $other): bool
    {
        return $this->minor === $other->minor && $this->currency === $other->currency;
    }

    public function isZero(): bool
    {
        return $this->minor === 0;
    }

    /** `1.425,00 €` — the one way an amount becomes text (R-10). */
    public function format(): string
    {
        return GermanFormat::money($this->minor, $this->currency);
    }

    /** `1425.50` — a plain decimal with a point, for machines: an export cell, an API amount. */
    public function toDecimal(): string
    {
        [$sign, $units, $cents] = $this->parts();

        return $sign.$units.'.'.$cents;
    }

    /** `1.425,50` — German digits without the currency, as an admin's price field shows them. */
    public function toGerman(): string
    {
        [$sign, $units, $cents] = $this->parts();

        return ($sign === '' ? '' : GermanFormat::MINUS).GermanFormat::grouped($units).','.$cents;
    }

    /** @return array{0: string, 1: string, 2: string} sign, whole units, two digits of cents */
    private function parts(): array
    {
        $absolute = abs($this->minor);

        return [$this->minor < 0 ? '-' : '', (string) intdiv($absolute, 100), str_pad((string) ($absolute % 100), 2, '0', STR_PAD_LEFT)];
    }

    private function same(self $other): self
    {
        if ($other->currency !== $this->currency) {
            throw new InvalidArgumentException("Cannot combine {$this->currency} with {$other->currency}.");
        }

        return $other;
    }

    private static function rate(int $rateBp): int
    {
        if ($rateBp < 0 || $rateBp > 10_000) {
            throw new InvalidArgumentException("A VAT rate of [{$rateBp}] basis points is not a rate.");
        }

        return $rateBp;
    }

    /** `$numerator / $denominator`, rounded half away from zero, in integers only. */
    private static function divide(int $numerator, int $denominator): int
    {
        $quotient = intdiv(abs($numerator) * 2 + $denominator, $denominator * 2);

        return $numerator < 0 ? -$quotient : $quotient;
    }

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
