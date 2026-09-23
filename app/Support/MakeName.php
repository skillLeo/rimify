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
        // The wheel brands write themselves in capitals, and their own logos do too.
        'dezent' => 'DEZENT',
        'aez' => 'AEZ',
        'motec' => 'MOTEC',
        'ronal' => 'RONAL',
        'rial' => 'RIAL',
        'dotz' => 'DOTZ',
        'ats' => 'ATS',
        'cms' => 'CMS',
    ];

    /**
     * Synonyms unified onto one join key, keyed by their lower-cased, whitespace-collapsed
     * spelling. `normalise()` deliberately keeps `VW` and `Volkswagen` apart as labels; a price
     * keyed on the label would therefore miss half the fleet, which is what this table prevents.
     */
    private const KEY_ALIASES = [
        'vw' => 'volkswagen',
        'volkswagen' => 'volkswagen',
        'mercedes' => 'mercedes-benz',
        'mercedes-benz' => 'mercedes-benz',
        'mercedes benz' => 'mercedes-benz',
        'mb' => 'mercedes-benz',
        'skoda' => 'skoda',
        'škoda' => 'skoda',
        'citroen' => 'citroen',
        'citroën' => 'citroen',
        'vauxhall' => 'opel',
        'opel' => 'opel',
    ];

    /** ASCII folding for the letters German and French make names actually use. */
    private const KEY_TRANSLITERATION = [
        'ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss', 'é' => 'e', 'ë' => 'e',
    ];

    /**
     * The join key for a car make: lower case, ASCII-folded, hyphenated, with synonyms unified.
     *
     * `VW`, `vw` and `Volkswagen` all key to `volkswagen`; `Mercedes` and `Mercedes-Benz` to
     * `mercedes-benz`; `Skoda` and `Škoda` to `skoda`. It is the only key a per-make price may
     * use. `''` for an empty or unusable name, and the caller must treat `''` as "no make"
     * (fail closed).
     */
    public static function key(string $name): string
    {
        $lower = mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', $name)));

        if ($lower === '') {
            return '';
        }

        $aliased = self::KEY_ALIASES[$lower] ?? $lower;
        $folded = strtr($aliased, self::KEY_TRANSLITERATION);
        // Every remaining non-alphanumeric run becomes one hyphen; invalid UTF-8 yields '' here,
        // which the caller treats as "no make".
        $slug = trim((string) preg_replace('/[^a-z0-9]+/u', '-', $folded), '-');
        // A second pass, so a synonym that only became canonical after folding still unifies.
        $slug = self::KEY_ALIASES[$slug] ?? $slug;

        return rtrim(substr($slug, 0, 64), '-');
    }

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
