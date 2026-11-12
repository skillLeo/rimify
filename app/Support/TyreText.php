<?php

declare(strict_types=1);

namespace App\Support;

use App\Domain\Fitment\Derivation\ReferenceTables;

/**
 * A tyre as a Gutachten prints it, typed or pasted by staff (the Gutachten rework §6): `225/40R18 88W`, `225/40 R18 88W`,
 * `225/40R18-88`, `245/45R18 100`, `235/50R18`, `255/35 R 18 90 W`, `HL 255/35R20 100`. The size, the load index and the
 * speed symbol come apart; a figure the paper does not print stays not given. What does not read is null: said to staff,
 * never guessed.
 *
 * Every pairing the ETRTO knows reads (the client's round of 08.11.2026, §4, D-442): a load index 0 to 279 with any symbol J to Y,
 * (W) or (Y); a dual index for C tyres, `115/113R` (the second is kept, the first is the minimum); the bracket forms `92(Y)`, `(92Y)`,
 * `(Y)` — the category above 300 km/h, ECE-R 30 — and the same with W, `92(W)`, `92 (W)`, `(92W)`, `(W)`: above 270 km/h, to the
 * maker's limit (D-453); and `ZR` in the size. The build is kept as the marker: `XL`, `HL`, `RF` (also typed `Reinforced`), `C` after
 * the rim diameter; `Extra Load` is XL.
 *
 * The browser reads the same notations the same way (Erfassung/tyreInput.ts); both tests read one list of them
 * (tests/Fixtures/tyre-notations.json).
 *
 * @phpstan-type Tyre array{width: int, aspect: int, diameter: int, li: int|null, li2: int|null, si: string|null, marker: string|null}
 */
final class TyreText
{
    /** What the speed-symbol column and the engine's table know (SpeedSymbolDeriver), in their rank order. */
    public const SYMBOLS = ['J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', '(W)', 'Y', '(Y)'];

    /** The highest load index the ETRTO lists. */
    public const MAX_LOAD_INDEX = 279;

    /** @return Tyre|null */
    public static function read(string $text): ?array
    {
        $normal = strtoupper(trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $text)));
        $marker = null;

        if (preg_match('/^(HL|XL|RF)\s+(.*)$/', $normal, $prefix) === 1) {
            $marker = $prefix[1];
            $normal = $prefix[2];
        }

        if (preg_match('/^(.*?)\s+(XL|HL|RF|REINF|REINFORCED|EXTRA LOAD)$/', $normal, $suffix) === 1) {
            $marker ??= match ($suffix[2]) {
                'EXTRA LOAD' => 'XL',
                'REINF', 'REINFORCED' => 'RF',
                default => $suffix[2],
            };
            $normal = $suffix[1];
        }

        $size = '(\d{3})\s*\/\s*(\d{2})\s*(?:Z?\s*R|-)\s*(\d{2})(\s*C\b)?';
        // (92Y) · 92(Y) · 92 (W) · 115/113R · 92 · (Y) · Y
        $minimum = '(?:\s*-?\s*(?:\(\s*(\d{1,3})\s*([A-Z])\s*\)|(\d{1,3})(?:\s*\/\s*(\d{1,3}))?\s*(\(\s*[A-Z]\s*\)|[A-Z])?|(\(\s*[A-Z]\s*\)|[A-Z])))?';

        if (preg_match('/^'.$size.$minimum.'$/', $normal, $m, PREG_UNMATCHED_AS_NULL) !== 1) {
            return null;
        }

        // In brackets, the service description says the open category above it: above 300 km/h for Y, above 270 km/h for W (D-453).
        // No other letter is ever so printed.
        if ($m[5] !== null && $m[6] !== 'Y' && $m[6] !== 'W') {
            return null;
        }

        $symbol = $m[5] !== null ? '('.$m[6].')' : (($m[9] ?? $m[10]) === null ? null : (string) preg_replace('/\s+/', '', (string) ($m[9] ?? $m[10])));
        $index = $m[5] ?? $m[7] ?? null;
        $dual = $m[8] ?? null;

        if (($symbol !== null && ! in_array($symbol, self::SYMBOLS, true))
            || ($index !== null && (int) $index > self::MAX_LOAD_INDEX) || ($dual !== null && (int) $dual > self::MAX_LOAD_INDEX)) {
            return null;
        }

        return [
            'width' => (int) $m[1],
            'aspect' => (int) $m[2],
            'diameter' => (int) $m[3],
            'li' => $index === null ? null : (int) $index,
            'li2' => $dual === null ? null : (int) $dual,
            'si' => $symbol,
            // A C tyre is built for its load: the C names it, whatever else the paper prints beside it.
            'marker' => $m[4] !== null ? 'C' : $marker,
        ];
    }

    /**
     * As the shop and the admin write it: `225/40 R18 88W`, `HL 255/35 R20 100`, `235/50 R18`, `235/65 R16 C 115/113R`.
     *
     * @param  array{width: int, aspect: int, diameter: int|float, li: int|null, li2?: int|null, si: string|null, marker: string|null}  $tyre
     */
    public static function label(array $tyre): string
    {
        $index = $tyre['li'] === null ? '' : $tyre['li'].(($tyre['li2'] ?? null) === null ? '' : '/'.$tyre['li2']);
        $minimum = $index.($tyre['si'] ?? '');
        $marker = $tyre['marker'] ?? null;
        $diameter = rtrim(rtrim(number_format((float) $tyre['diameter'], 1, '.', ''), '0'), '.');

        return trim(sprintf('%s %d/%d R%s%s %s', $marker === 'C' ? '' : (string) $marker, $tyre['width'], $tyre['aspect'], $diameter, $marker === 'C' ? ' C' : '', $minimum));
    }

    /**
     * The service description alone, as a tyre's papers or the catalogue form give it (D-453): `97(W)`, `94W XL`, `115/113R`, `(92Y)`,
     * `92 (W)`, `W`, `(w)` — read as the size's end is read (read()). Null where it does not read.
     *
     * @return array{li: int|null, li2: int|null, si: string|null, marker: string|null}|null
     */
    public static function service(string $text): ?array
    {
        $tyre = self::read('100/10R10 '.trim($text));

        if ($tyre === null || ($tyre['li'] === null && $tyre['si'] === null) || $tyre['marker'] === 'C') {
            return null;
        }

        return ['li' => $tyre['li'], 'li2' => $tyre['li2'], 'si' => $tyre['si'], 'marker' => $tyre['marker']];
    }

    /** @return list<string> the symbols, as the engine's table holds them */
    public static function symbols(): array
    {
        return array_column(ReferenceTables::SPEED_SYMBOLS, 'symbol');
    }
}
