<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The spelling of a manufacturer or brand name, normalised once at the point data enters.
 *
 * Export files, seeders and hand-typed admin forms disagree about casing: the same make arrives as
 * "ford", "FORD" and "Ford", and a case-insensitive collation then groups them under whichever
 * spelling was written first — so a customer sees "ford" beside "Audi". Names are compared
 * case-insensitively and stored in one spelling: the manufacturer's own where it is known, title
 * case otherwise.
 */
final class MakeName
{
    /** Spellings that title case would get wrong, keyed by their lower-case form. */
    private const KNOWN = [
        'bmw' => 'BMW',
        'vw' => 'VW',
        'volkswagen' => 'Volkswagen',
        'mercedes-benz' => 'Mercedes-Benz',
        'mercedes' => 'Mercedes-Benz',
        'skoda' => 'Škoda',
        'škoda' => 'Škoda',
        'seat' => 'SEAT',
        'cupra' => 'CUPRA',
        'kia' => 'Kia',
        'mg' => 'MG',
        'ds' => 'DS',
        'byd' => 'BYD',
        'citroen' => 'Citroën',
        'citroën' => 'Citroën',
        'alfa romeo' => 'Alfa Romeo',
        'land rover' => 'Land Rover',
        'range rover' => 'Range Rover',
        'aston martin' => 'Aston Martin',
        'rolls-royce' => 'Rolls-Royce',
        'mini' => 'MINI',
        'smart' => 'smart',
        'bbs' => 'BBS',
        'oz racing' => 'OZ Racing',
        'oz' => 'OZ Racing',
        'borbet' => 'BORBET',
        'alutec' => 'ALUTEC',
        'yido' => 'YIDO',
        'rotiform' => 'Rotiform',
        'brock' => 'Brock',
        'mam' => 'MAM',
        'dezent' => 'Dezent',
        'aez' => 'AEZ',
    ];

    public static function normalise(string $name): string
    {
        $trimmed = trim((string) preg_replace('/\s+/u', ' ', $name));

        if ($trimmed === '') {
            return '';
        }

        $key = mb_strtolower($trimmed);

        if (array_key_exists($key, self::KNOWN)) {
            return self::KNOWN[$key];
        }

        // Title case per word and per hyphenated part: "alfa-romeo giulia" → "Alfa-Romeo Giulia".
        return (string) preg_replace_callback(
            '/[\p{L}\p{N}]+/u',
            static fn (array $m): string => mb_strtoupper(mb_substr($m[0], 0, 1)).mb_strtolower(mb_substr($m[0], 1)),
            $key,
        );
    }

    /** Two names are the same name when they differ only in case or surrounding space. */
    public static function same(string $a, string $b): bool
    {
        return mb_strtolower(trim($a)) === mb_strtolower(trim($b));
    }
}
