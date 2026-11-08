<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Support\GermanFormat;
use App\Support\TyreText;

/**
 * Whether a typed tyre can stand in the tables the shop reads: it reads (TyreText), its size lies within what a row takes,
 * and the engine knows its load index. Anything else is kept as typed and said to staff, and the release waits for it — a
 * half-typed line must not throw away what was typed (the Gutachten rework §7: „nothing typed is ever lost“).
 */
final class EntryLineRules
{
    /** @return array{width: int, aspect: int, diameter: int, li: int|null, li2: int|null, si: string|null, marker: string|null}|null */
    public static function readable(string $text): ?array
    {
        $tyre = TyreText::read($text);

        return $tyre === null || self::why($tyre) !== null ? null : $tyre;
    }

    /** Why a typed tyre cannot stand, in the words staff read; null where it can. */
    public static function whyNot(string $text): ?string
    {
        $tyre = TyreText::read($text);

        if ($tyre === null) {
            return 'Nicht lesbar. Schreib die Größe etwa so: 225/40 R18 88W, 245/45R18 100 oder 235/50R18.';
        }

        return self::why($tyre);
    }

    /** A tyre whose rim is not its axle's wheel does not physically fit. The words staff read; null where it fits. */
    public static function misfit(float $tyreDiameter, float $wheelDiameter, string $side): ?string
    {
        return abs($tyreDiameter - $wheelDiameter) < 0.001 ? null : sprintf(
            'Dieser Reifen passt nicht: Die Felge %s hat %s Zoll, der Reifen R%s.',
            $side === 'front' ? 'vorne' : 'hinten',
            GermanFormat::trimmedDecimal($wheelDiameter, 1),
            GermanFormat::trimmedDecimal($tyreDiameter, 1),
        );
    }

    /** @param array{width: int, aspect: int, diameter: int, li: int|null, li2: int|null, si: string|null, marker: string|null} $tyre */
    private static function why(array $tyre): ?string
    {
        if ($tyre['width'] < 125 || $tyre['width'] > 355) {
            return 'Gib die Reifenbreite in Millimetern an, zwischen 125 und 355.';
        }

        if ($tyre['aspect'] < 25 || $tyre['aspect'] > 85) {
            return 'Gib den Querschnitt als Zahl zwischen 25 und 85 an.';
        }

        if ($tyre['diameter'] < 12 || $tyre['diameter'] > 26) {
            return 'Gib den Durchmesser hinter dem R in Zoll an, zwischen 12 und 26.';
        }

        // Every load index 0 to 279 is entered as the paper prints it (the client's round of 08.11.2026, §4, D-442): one the shop holds no
        // capacity for is answered „Noch nicht bestätigt“ in the shop (FitmentResolver), never refused here.

        return null;
    }
}
