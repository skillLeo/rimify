<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * A body style or drive read from a car's own name, where one word leaves no doubt (the operator's last prompt
 * §1.1): `quattro`, `xDrive`, `4MATIC`, `4x4`, `Allrad` are four-wheel drive; `Touring`, `Avant`, `Kombi` are a
 * Kombi; `Coupé`, `Cabrio`, `Roadster` are what they say. Anything else is asked, never guessed.
 *
 * Whole words only: „4er-GranCoupé“ is a four-door car, not a Coupé, and „5L mit Allradlenkung“ steers all four
 * wheels, it does not drive them. A word the rest of the name contradicts is not read either (G-03): „ohne Allrad“
 * and „nicht 4x4“ rule the drive out, and a Coupé that has four doors — BMW's „Gran Coupé“, Mercedes' „CLA Coupé“
 * and „CLS Coupé“, a „4-Türer Coupé“ — is asked for. A name whose words point two ways derives nothing.
 */
final class BuildFromName
{
    /** Word (lower case) → drive axle. `xDrive` also as the start of a word: „xDrive30d“. */
    private const DRIVE_WORDS = ['quattro' => 'Allrad', 'xdrive' => 'Allrad', '4matic' => 'Allrad', '4x4' => 'Allrad', 'allrad' => 'Allrad'];

    /** Word (lower case, accents folded) → body style. */
    private const BODY_WORDS = [
        'touring' => 'Kombi',
        'avant' => 'Kombi',
        'kombi' => 'Kombi',
        'coupe' => 'Coupe',
        'cabrio' => 'Cabrio',
        'cabriolet' => 'Cabrio',
        'roadster' => 'Roadster',
    ];

    /** A word right before one of the above that rules it out: „ohne Allrad“, „nicht 4x4“, „kein Allrad“. */
    private const NEGATIONS = ['ohne', 'nicht', 'kein', 'keine', 'keinen', 'non', 'no', 'without', 'not'];

    /** Anywhere in the name, these make a „Coupé“ a car with four doors: a question, not an answer. */
    private const FOUR_DOOR_COUPE = ['gran', 'grancoupe', 'cla', 'cls', 'viertuerer', 'viertürer', '4tuerer', '4türer', 'tuerer', 'türer', 'turer'];

    /**
     * `bodyWord` and `driveWord` are the words as they stand in the name, for „erkannt an „Touring““.
     *
     * @return array{bodyForm: string|null, bodyWord: string|null, driveAxle: string|null, driveWord: string|null}
     */
    public static function of(?string ...$names): array
    {
        $words = [];

        foreach ($names as $name) {
            // One run of words per name: „ohne“ at the end of the model never negates the variant's first word.
            $words[] = preg_split('/[^\p{L}\p{N}]+/u', (string) $name, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        }

        $keys = array_map(static fn (array $run): array => array_map(self::key(...), $run), $words);
        $fourDoors = array_intersect(array_merge(...$keys), self::FOUR_DOOR_COUPE) !== [];
        $bodies = [];
        $drives = [];

        foreach ($words as $n => $run) {
            foreach ($run as $i => $word) {
                $key = $keys[$n][$i];

                if ($i > 0 && in_array($keys[$n][$i - 1], self::NEGATIONS, true)) {
                    continue;
                }

                $body = self::BODY_WORDS[$key] ?? null;

                if ($body !== null && ! ($body === 'Coupe' && $fourDoors)) {
                    $bodies[$body] ??= $word;
                }

                $drive = self::DRIVE_WORDS[$key] ?? (str_starts_with($key, 'xdrive') ? 'Allrad' : null);

                if ($drive !== null) {
                    $drives[$drive] ??= $word;
                }
            }
        }

        $body = count($bodies) === 1 ? array_key_first($bodies) : null;
        $drive = count($drives) === 1 ? array_key_first($drives) : null;

        return [
            'bodyForm' => $body,
            'bodyWord' => $body === null ? null : $bodies[$body],
            'driveAxle' => $drive,
            'driveWord' => $drive === null ? null : $drives[$drive],
        ];
    }

    private static function key(string $word): string
    {
        return mb_strtolower(strtr($word, ['é' => 'e', 'É' => 'E']));
    }
}
