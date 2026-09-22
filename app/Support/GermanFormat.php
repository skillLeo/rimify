<?php

declare(strict_types=1);

namespace App\Support;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

/**
 * The one German-formatting helper (R-10).
 *
 * Deliberately built from string primitives rather than `intl`, so the output is byte-stable
 * across machines and a test can assert the exact code points. Three of those code points are
 * invisible in a diff and each of them matters:
 *
 *   U+00A0 NO-BREAK SPACE     between a value and `€`, so a price never wraps across lines
 *   U+00D7 MULTIPLICATION     in `8,5J × 18`, which is not the letter x
 *   U+2013 EN DASH            in a build period `03/2018–11/2019`, which is not a hyphen
 *
 * Numeric input is accepted as string as well as float, because MySQL returns DECIMAL columns as
 * strings and a float round-trip of `8.50` is exactly where `8,5J` turns into `8,49J`.
 */
final class GermanFormat
{
    public const NBSP = "\u{00A0}";

    public const TIMES = "\u{00D7}";

    public const MIDDOT = "\u{00B7}";

    public const ENDASH = "\u{2013}";

    public const MINUS = "\u{2212}";

    public const TIMEZONE = 'Europe/Berlin';

    /** `1.425,00 €` — thousands point, decimal comma, non-breaking space before the symbol. */
    public static function money(int $cents, string $currency = 'EUR'): string
    {
        $symbol = match ($currency) {
            'EUR' => '€',
            'CHF' => 'CHF',
            default => $currency,
        };

        $sign = $cents < 0 ? self::MINUS : '';
        $absolute = abs($cents);

        $value = number_format($absolute / 100, 2, ',', '.');

        return $sign.$value.self::NBSP.$symbol;
    }

    /** A plain German decimal: comma separator, thousands point, fixed places. */
    public static function decimal(float|int|string $value, int $decimals = 2): string
    {
        return number_format((float) $value, $decimals, ',', '.');
    }

    /**
     * A number with no trailing zeros: 8.0 → `8`, 8.5 → `8,5`, 66.60 → `66,6`.
     * This is what makes `8,5J` and `66,6 mm` read as they do on the document.
     */
    public static function trimmedDecimal(float|int|string $value, int $maxDecimals = 2): string
    {
        $formatted = number_format((float) $value, $maxDecimals, ',', '.');

        if (! str_contains($formatted, ',')) {
            return $formatted;
        }

        return rtrim(rtrim($formatted, '0'), ',');
    }

    /** `8,5J` — never `8.5J`, and never `8,0J`. */
    public static function rimWidth(float|int|string $widthIn): string
    {
        return self::trimmedDecimal($widthIn, 2).'J';
    }

    /** `66,6 mm` */
    public static function millimetres(float|int|string $value, int $maxDecimals = 2): string
    {
        return self::trimmedDecimal($value, $maxDecimals).self::NBSP.'mm';
    }

    /** `8,5J × 19` — width and diameter, held together by no-break spaces so they never wrap apart. */
    public static function rimSize(float|int|string $widthIn, float|int|string $diameterIn): string
    {
        return self::rimWidth($widthIn).self::NBSP.self::TIMES.self::NBSP.self::trimmedDecimal($diameterIn, 1);
    }

    /** `ET 45` — the Einpresstiefe, written as `wheelSize()` writes it, with a no-break space. */
    public static function offset(int $etMm): string
    {
        return 'ET'.self::NBSP.$etMm;
    }

    /** `620 kg`, `1.020 kg` — whole kilograms, a thousands point, a no-break space before the unit. */
    public static function kilograms(int $kg): string
    {
        return self::integer($kg).self::NBSP.'kg';
    }

    /** `8,5J × 18 · ET 35` */
    public static function wheelSize(float|int|string $widthIn, float|int|string $diameterIn, int $etMm): string
    {
        return sprintf(
            '%s %s %s %s ET %d',
            self::rimWidth($widthIn),
            self::TIMES,
            self::trimmedDecimal($diameterIn, 1),
            self::MIDDOT,
            $etMm,
        );
    }

    /** `8,5J × 18 · ET 35 · 5/112 · 66,6 mm` */
    public static function wheelLabel(
        float|int|string $widthIn,
        float|int|string $diameterIn,
        int $etMm,
        int $boltHoles,
        float|int|string $boltCircleMm,
        float|int|string $centreBoreMm,
    ): string {
        return implode(' '.self::MIDDOT.' ', [
            self::wheelSize($widthIn, $diameterIn, $etMm),
            self::boltPattern($boltHoles, $boltCircleMm),
            self::millimetres($centreBoreMm),
        ]);
    }

    /** `5 × 112`, and `5 × 114,3` where the circle is fractional — the way a Gutachten writes it. */
    public static function boltPattern(int $holes, float|int|string $circleMm): string
    {
        return $holes.self::NBSP.self::TIMES.self::NBSP.self::trimmedDecimal($circleMm, 1);
    }

    /** `245/45 R18 92Y`, or `245/45 R18` when the indices are not given. */
    public static function tyreSize(
        int $widthMm,
        int $aspect,
        float|int|string $diameterIn,
        ?int $loadIndex = null,
        ?string $speedSymbol = null,
    ): string {
        $size = sprintf('%d/%d R%s', $widthMm, $aspect, self::trimmedDecimal($diameterIn, 1));

        if ($loadIndex === null || $speedSymbol === null || $speedSymbol === '') {
            return $size;
        }

        return $size.' '.$loadIndex.$speedSymbol;
    }

    /**
     * Timestamps are stored UTC and rendered Europe/Berlin, so an order placed at 23:30 UTC on
     * the 20th is shown as the 21st — which is the date the customer will look for.
     *
     * `DateTimeInterface` itself has no `setTimezone()`, so the instant is converted first; that
     * also means a caller may pass any implementation, including Carbon.
     */
    private static function inBerlin(DateTimeInterface $at): DateTimeImmutable
    {
        return DateTimeImmutable::createFromInterface($at)->setTimezone(new DateTimeZone(self::TIMEZONE));
    }

    /** `21.11.2025`, rendered in Europe/Berlin whatever zone the instant was stored in. */
    public static function date(?DateTimeInterface $date): ?string
    {
        return $date === null ? null : self::inBerlin($date)->format('d.m.Y');
    }

    /** `21.11.2025, 14:22 Uhr` */
    public static function dateTime(?DateTimeInterface $at): ?string
    {
        return $at === null ? null : self::inBerlin($at)->format('d.m.Y, H:i').' Uhr';
    }

    /** `03/2018` */
    public static function monthYear(?DateTimeInterface $date): ?string
    {
        return $date === null ? null : self::inBerlin($date)->format('m/Y');
    }

    /**
     * `03/2018–11/2019`, or `12/2019–heute` where the model is still in production.
     *
     * An open end is "heute", never a date: writing today's date here is the same mistake as
     * coercing a NULL build_to, and it would tell the customer something false.
     */
    public static function buildPeriod(?DateTimeInterface $from, ?DateTimeInterface $to): string
    {
        $start = self::monthYear($from);
        $end = self::monthYear($to);

        if ($start === null && $end === null) {
            return 'Bauzeitraum unbekannt';
        }

        if ($start === null) {
            return 'bis '.$end;
        }

        return $start.self::ENDASH.($end ?? 'heute');
    }

    /** HSN keeps its leading zeros: `5` renders as `0005`, never as `5`. */
    public static function hsn(string $hsn): string
    {
        return str_pad(mb_strtoupper(trim($hsn)), 4, '0', STR_PAD_LEFT);
    }

    /** `HSN 0005 · TSN 582` */
    public static function keyNumbers(string $hsn, string $tsn): string
    {
        return sprintf('HSN %s %s TSN %s', self::hsn($hsn), self::MIDDOT, mb_strtoupper(trim($tsn)));
    }

    /** `4,8 (555 Bewertungen)`, with the singular handled. */
    public static function rating(float|int|string $rating, int $reviews): string
    {
        $noun = $reviews === 1 ? 'Bewertung' : 'Bewertungen';

        return self::decimal($rating, 1).' ('.number_format($reviews, 0, ',', '.').' '.$noun.')';
    }

    /** `+12 %` / `−3 %` — a non-breaking space before the sign, per German typography. */
    public static function percent(int|float $value, bool $withSign = true): string
    {
        $sign = '';

        if ($withSign) {
            $sign = $value > 0 ? '+' : ($value < 0 ? self::MINUS : '');
        }

        return $sign.self::trimmedDecimal(abs($value), 1).self::NBSP.'%';
    }

    /** `1.234` — an integer quantity with a thousands point. */
    public static function integer(int $value): string
    {
        return number_format($value, 0, ',', '.');
    }
}
