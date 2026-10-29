<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Support\EgNumber;

/**
 * Which entry of a Gutachten's Verwendungsbereich a car's combinations come from (his admin item 19; the operator's
 * brief of 29.10.2026, Batch 2, D-358): the entry whose printed EG type-approval number takes in the car's field K —
 * both read the same way (EgNumber: no spaces, lower case, trailing asterisks gone) and never more loosely than the
 * document prints it. `e1*2001/116*0287*..` (no extension) takes every extension of 0287; `…*11` only 11; `…*00-09`
 * only 00 to 09; `…*04-..` 04 on. A car without a K, or whose K no entry takes in, gets none — and so does a car two
 * entries take in with different lists: neither is chosen for it (fails closed, CLAUDE.md §2).
 */
final class CombinationEntry
{
    /**
     * @param  array<string, list<string>>  $pairsByEntry  normalised entry => the keys of its pairs
     * @return string|null the entry, or null where none takes the car in unambiguously
     */
    public static function for(?string $carK, array $pairsByEntry): ?string
    {
        $car = EgNumber::parse($carK);

        if ($car === null) {
            return null;
        }

        $matches = [];

        foreach ($pairsByEntry as $entry => $pairs) {
            $number = EgNumber::parse((string) $entry);

            if ($number !== null && $number->covers($car)) {
                sort($pairs);
                $matches[(string) $entry] = implode('|', $pairs);
            }
        }

        if ($matches === [] || count(array_unique($matches)) > 1) {
            return null;
        }

        return (string) array_key_first($matches);
    }
}
