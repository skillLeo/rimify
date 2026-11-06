<?php

declare(strict_types=1);

namespace App\Support;

/**
 * A wheel's data as a Gutachten prints it (its „Raddaten“), typed by staff from the paper, read only to be compared with the
 * size they chose: `8 1/2 J X 18 H2`, `8½ × 18`, `8,5x20`; `120/5`, `5 × 120`, `5/112`. A bolt pattern's order tells holes
 * from circle: the small number is the holes. What does not read is null — said to staff, never guessed.
 */
final class PrintedWheel
{
    /** @return array{width: float, diameter: float}|null */
    public static function size(string $text): ?array
    {
        $normal = strtoupper(trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $text)));
        $normal = str_replace(['½', '¼', '¾'], [' 1/2', ' 1/4', ' 3/4'], $normal);

        if (preg_match('/^(\d{1,2})(?:\s+(\d)\/(\d)|[.,](\d{1,2}))?\s*J?\s*[X×*]\s*(\d{2})(?:[.,]0)?(?:\s*(?:H2|H|AH|FH|X)\S*)?$/u', $normal, $m) !== 1) {
            return null;
        }

        $whole = (float) $m[1];

        if ($m[2] !== '' && (int) $m[3] !== 0) {
            $whole += (int) $m[2] / (int) $m[3];
        } elseif ($m[4] !== '') {
            $whole += (float) ('0.'.$m[4]);
        }

        return ['width' => $whole, 'diameter' => (float) $m[5]];
    }

    /** @return array{holes: int, circle: float}|null */
    public static function bolts(string $text): ?array
    {
        if (preg_match('/^(\d{1,3}(?:[.,]\d{1,2})?)\s*[\/X×*x]\s*(\d{1,3}(?:[.,]\d{1,2})?)$/u', trim($text), $m) !== 1) {
            return null;
        }

        $a = (float) str_replace(',', '.', $m[1]);
        $b = (float) str_replace(',', '.', $m[2]);
        [$holes, $circle] = $a <= $b ? [$a, $b] : [$b, $a];

        if ($holes < 3 || $holes > 12 || floor($holes) !== $holes || $circle < 80 || $circle > 250) {
            return null;
        }

        return ['holes' => (int) $holes, 'circle' => $circle];
    }
}
