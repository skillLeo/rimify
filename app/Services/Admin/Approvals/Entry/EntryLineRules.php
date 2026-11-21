<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Support\GermanFormat;
use App\Support\TyreText;

/**
 * Whether a typed tyre can stand in the tables the shop reads: it reads (TyreText) — the form of the size, nothing about a
 * load index or a speed symbol (D-479). Anything else is kept as typed and said to staff, and the release waits for it — a
 * half-typed line must not throw away what was typed (the Gutachten rework §7: „nothing typed is ever lost“).
 */
final class EntryLineRules
{
    /** @return array{width: int, aspect: int, diameter: int|float, li: int|null, li2: int|null, si: string|null, marker: string|null}|null */
    public static function readable(string $text): ?array
    {
        return TyreText::read($text);
    }

    /** Why a typed tyre cannot stand, in the words staff read; null where it can. */
    public static function whyNot(string $text): ?string
    {
        // Only the form of the size is checked (D-479): width, aspect, R or ZR, the rim in whole or half inches, and what
        // follows as printed. A figure is never refused.
        return TyreText::read($text) === null
            ? 'Nicht lesbar. Schreib die Größe etwa so: 225/40 R18 88W, 305/70 R22.5 160F oder 235/50R18.'
            : null;
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
}
