<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Support\TyreText;
use Illuminate\Support\Facades\DB;

/**
 * Whether a typed tyre can stand in the tables the shop reads: it reads (TyreText), its size lies within what a row takes,
 * and the engine knows its load index. Anything else is kept as typed and said to staff, and the release waits for it — a
 * half-typed line must not throw away what was typed (the Gutachten rework §7: „nothing typed is ever lost“).
 */
final class EntryLineRules
{
    /** @return array{width: int, aspect: int, diameter: int, li: int|null, si: string|null, marker: string|null}|null */
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

    /** @param array{width: int, aspect: int, diameter: int, li: int|null, si: string|null, marker: string|null} $tyre */
    private static function why(array $tyre): ?string
    {
        if ($tyre['width'] < 125 || $tyre['width'] > 355) {
            return 'Die Reifenbreite bitte in Millimetern, zwischen 125 und 355.';
        }

        if ($tyre['aspect'] < 25 || $tyre['aspect'] > 85) {
            return 'Den Querschnitt bitte als Zahl zwischen 25 und 85.';
        }

        if ($tyre['diameter'] < 12 || $tyre['diameter'] > 26) {
            return 'Den Felgendurchmesser des Reifens bitte in Zoll, zwischen 12 und 26.';
        }

        // „gibt es nicht“ would say more than we know: an index above 120 exists, only its capacity is not on record (D-310).
        if ($tyre['li'] !== null && ! DB::table('load_index_table')->where('load_index', $tyre['li'])->exists()) {
            return 'Diesen Tragfähigkeitsindex kennt der Shop nicht. Er rechnet mit den Indizes 70 bis 120.';
        }

        return null;
    }
}
