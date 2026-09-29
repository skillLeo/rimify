<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

/**
 * A body style or drive read from a car's own name, where one word leaves no doubt (the operator's last prompt
 * §1.1): `quattro`, `xDrive`, `4MATIC`, `4x4`, `Allrad` are four-wheel drive; `Touring`, `Avant`, `Kombi` are a
 * Kombi; `Coupé`, `Cabrio`, `Roadster` are what they say. Anything else is asked, never guessed.
 *
 * Whole words only: „4er-GranCoupé“ is a four-door car, not a Coupé, and „5L mit Allradlenkung“ steers all four
 * wheels, it does not drive them. A name whose words point two ways derives nothing.
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

    /**
     * `bodyWord` and `driveWord` are the words as they stand in the name, for „aus dem Namen: Touring“.
     *
     * @return array{bodyForm: string|null, bodyWord: string|null, driveAxle: string|null, driveWord: string|null}
     */
    public static function of(?string ...$names): array
    {
        $bodies = [];
        $drives = [];

        foreach ($names as $name) {
            foreach (preg_split('/[^\p{L}\p{N}]+/u', (string) $name, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $word) {
                $key = mb_strtolower(strtr($word, ['é' => 'e', 'É' => 'E']));

                if (isset(self::BODY_WORDS[$key])) {
                    $bodies[self::BODY_WORDS[$key]] ??= $word;
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
}
