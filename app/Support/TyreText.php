<?php

declare(strict_types=1);

namespace App\Support;

/**
 * A tyre as a Gutachten prints it, typed or pasted by staff (the Gutachten rework §6): `225/40R18 88W`, `225/40 R18 88W`,
 * `225/40R18-88`, `245/45R18 100`, `235/50R18`, `255/35 R 18 90 W`, `HL 255/35R20 100`. The size, the load index and the
 * speed symbol come apart; a figure the paper does not print stays not given. `HL` or `XL` names the tyre's build, before
 * or after the size, and is kept. What does not read is null: said to staff, never guessed.
 *
 * The browser reads the same notations the same way (Erfassung/tyreInput.ts); both tests read one list of them
 * (tests/Fixtures/tyre-notations.json).
 *
 * @phpstan-type Tyre array{width: int, aspect: int, diameter: int, li: int|null, si: string|null, marker: string|null}
 */
final class TyreText
{
    /** What the speed-symbol column and the engine's table know (SpeedSymbolDeriver). */
    public const SYMBOLS = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', '(Y)'];

    /** @return Tyre|null */
    public static function read(string $text): ?array
    {
        $normal = strtoupper(trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $text)));
        $marker = null;

        if (preg_match('/^(HL|XL)\s+(.*)$/', $normal, $prefix) === 1) {
            $marker = $prefix[1];
            $normal = $prefix[2];
        }

        if (preg_match('/^(.*?)\s+(XL|HL|RF|REINF|EXTRA LOAD)$/', $normal, $suffix) === 1) {
            $marker ??= in_array($suffix[2], ['XL', 'HL'], true) ? $suffix[2] : null;
            $normal = $suffix[1];
        }

        $size = '(\d{3})\s*\/\s*(\d{2})\s*(?:Z?\s*R|-)\s*(\d{2})';
        $minimum = '(?:\s*-?\s*(?:(\d{2,3})\s*(\(Y\))|\(?\s*(?:(\d{2,3})\s*([A-Z])?|([A-Z]))\s*\)?))?';

        if (preg_match('/^'.$size.$minimum.'$/', $normal, $m, PREG_UNMATCHED_AS_NULL) !== 1) {
            return null;
        }

        $symbol = $m[5] ?? $m[7] ?? $m[8] ?? null;

        if ($symbol !== null && ! in_array($symbol, self::SYMBOLS, true)) {
            return null;
        }

        $index = $m[4] ?? $m[6] ?? null;

        return [
            'width' => (int) $m[1],
            'aspect' => (int) $m[2],
            'diameter' => (int) $m[3],
            'li' => $index === null ? null : (int) $index,
            'si' => $symbol,
            'marker' => $marker,
        ];
    }

    /**
     * As the shop and the admin write it: `225/40 R18 88W`, `HL 255/35 R20 100`, `235/50 R18`.
     *
     * @param  array{width: int, aspect: int, diameter: int|float, li: int|null, si: string|null, marker: string|null}  $tyre
     */
    public static function label(array $tyre): string
    {
        $minimum = ($tyre['li'] ?? '').($tyre['si'] ?? '');

        return trim(sprintf('%s %d/%d R%s %s', $tyre['marker'] ?? '', $tyre['width'], $tyre['aspect'], rtrim(rtrim(number_format((float) $tyre['diameter'], 1, '.', ''), '0'), '.'), $minimum));
    }
}
