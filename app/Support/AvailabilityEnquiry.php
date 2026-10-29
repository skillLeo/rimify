<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The subject of an „Anfrage“ about a rim that is not available (his admin item 7, D-350): the rim, its size and its ET,
 * so the message names the article before the customer has written a word. The contact form takes it as its subject
 * (`/kontakt?betreff=…`) and the visitor's car from their own session, as every link to the form does (KontaktController),
 * and the message goes where every other one goes (ContactRecipient, the client's #12).
 */
final class AvailabilityEnquiry
{
    /** The contact form's own limit for a subject (ContactRequest). A subject here is never cut to it. */
    public const MAX = 150;

    private const PREFIX = 'Anfrage zur Verfügbarkeit: ';

    /** `Anfrage zur Verfügbarkeit: Borbet DB8GT2 Schwarz matt, 8,5J × 19, ET 35` */
    public static function subject(string $rim, float|int|string $widthIn, float|int|string $diameterIn, int $etMm): string
    {
        return self::PREFIX.$rim.', '.self::size($widthIn, $diameterIn, $etMm);
    }

    /**
     * A card stands for every size of its colour: each named, where they fit in a subject — else its diameters, never a
     * subject cut off in the middle of a figure.
     *
     * @param  list<array{width: float|int|string, diameter: float|int|string, et: int}>  $sizes
     */
    public static function forSizes(string $rim, array $sizes): string
    {
        if ($sizes === []) {
            return self::PREFIX.$rim;
        }

        $named = self::PREFIX.$rim.', '.implode('; ', array_map(
            static fn (array $size): string => self::size($size['width'], $size['diameter'], $size['et']),
            $sizes,
        ));

        if (mb_strlen($named) <= self::MAX) {
            return $named;
        }

        $diameters = array_values(array_unique(array_map(static fn (array $size): string => GermanFormat::trimmedDecimal($size['diameter'], 1), $sizes)));
        usort($diameters, static fn (string $a, string $b): int => (float) str_replace(',', '.', $a) <=> (float) str_replace(',', '.', $b));
        $last = array_pop($diameters);

        return self::PREFIX.$rim.', '.($diameters === [] ? $last : implode(', ', $diameters).' und '.$last).' Zoll';
    }

    /** `8,5J × 19, ET 35` — the size line of the shop (GermanFormat::wheelSize) with a comma before the ET, as a subject reads. */
    private static function size(float|int|string $widthIn, float|int|string $diameterIn, int $etMm): string
    {
        return GermanFormat::rimWidth($widthIn).' '.GermanFormat::TIMES.' '.GermanFormat::trimmedDecimal($diameterIn, 1).', ET '.$etMm;
    }
}
