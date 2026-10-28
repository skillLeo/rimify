<?php

declare(strict_types=1);

namespace App\Support;

/**
 * A search as staff type it (Human QA, 28.10.2026): two spaces where one was meant, and an umlaut written out — „TUEV“
 * for „TÜV“, „Mueller“ for „Müller“ — because the keyboard or the habit has none. The admin's list searches read the term
 * through here, so each finds what was meant, never more than a spelling of it.
 *
 * The database's collation already takes upper and lower case alike, and „ß“ as „ss“; what it cannot know is that a
 * German „ue“ is an „ü“.
 */
final class SearchTerm
{
    private const SPELLED = ['ae' => 'ä', 'oe' => 'ö', 'ue' => 'ü', 'Ae' => 'Ä', 'Oe' => 'Ö', 'Ue' => 'Ü', 'AE' => 'Ä', 'OE' => 'Ö', 'UE' => 'Ü'];

    /** Trimmed, every run of spaces (no-break ones included) one space. */
    public static function normalize(string $term): string
    {
        return trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $term));
    }

    /**
     * The term and its other German spelling: the umlauts written out where it has them, written in where it spells them
     * out. At most these two, so a search stays one query with two patterns.
     *
     * @return list<string>
     */
    public static function variants(string $term): array
    {
        $term = self::normalize($term);
        $other = preg_match('/[äöüÄÖÜ]/u', $term) === 1
            ? strtr($term, array_flip(['ae' => 'ä', 'oe' => 'ö', 'ue' => 'ü', 'Ae' => 'Ä', 'Oe' => 'Ö', 'Ue' => 'Ü']))
            : strtr($term, self::SPELLED);

        return $other === $term ? [$term] : [$term, $other];
    }

    /**
     * The LIKE patterns for the variants, with the wildcards of the term itself escaped (R-14: bound, never concatenated).
     *
     * @return list<string>
     */
    public static function likes(string $term): array
    {
        return array_map(static fn (string $v): string => '%'.addcslashes($v, '%_\\').'%', self::variants($term));
    }
}
