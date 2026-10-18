<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\WheelModel;

/**
 * A wheel's name in the shop (his admin items 5, 6 and 13, D-298): the brand, the model and the Radtypenbezeichnung —
 * the designation the Gutachten identify the wheel by, so a customer can hold the page beside the PDF. A title a person
 * typed stands instead and is never overwritten when its parts change; the admin flags where the two differ.
 *
 * The brand always leads: the shop shows it beside the rest (`brandName` · `modelName`), so a typed title is read as what
 * follows the brand — „Havanna Black“ and „BORBET Havanna Black“ are the same title. resources/js/lib/wheelTitle.ts is
 * the same rule for the admin's preview.
 */
final class WheelTitle
{
    /**
     * The title the parts make: `BORBET Havanna HA 8018`. The Radtypenbezeichnung is left out where it is empty or the
     * model's name already holds it — a name never says the same twice.
     */
    public static function composed(string $brand, string $model, ?string $designation): string
    {
        $designation = self::tidy((string) $designation);
        $parts = [$brand, $model];

        if ($designation !== '' && ! str_contains(mb_strtolower($model), mb_strtolower($designation))) {
            $parts[] = $designation;
        }

        return self::tidy(implode(' ', $parts));
    }

    /** The wheel's title in the shop: the brand, then the typed title's rest or the composition's. */
    public static function full(WheelModel $model): string
    {
        return self::tidy((string) $model->brand?->name.' '.self::name($model));
    }

    /** What the shop shows beside the brand, for one wheel model. */
    public static function name(WheelModel $model): string
    {
        return self::nameFor((string) $model->brand?->name, (string) $model->name, $model->type_designation, $model->getAttribute('title'));
    }

    /**
     * What follows the brand, from the parts as plain values — for a query's row as for a model.
     */
    public static function nameFor(string $brand, string $model, ?string $designation, mixed $typed): string
    {
        $typed = self::tidy(is_string($typed) ? $typed : '');

        return self::afterBrand($brand, $typed !== '' ? $typed : self::composed($brand, $model, $designation));
    }

    /** A title without a leading brand name; a title that does not start with it, whole. */
    public static function afterBrand(string $brand, string $full): string
    {
        $brand = self::tidy($brand);
        $full = self::tidy($full);

        if ($brand !== '' && str_starts_with(mb_strtolower($full.' '), mb_strtolower($brand.' '))) {
            return self::tidy(mb_substr($full, mb_strlen($brand)));
        }

        return $full;
    }

    /**
     * What a save stores: nothing where the title typed is empty or the one the parts make — the title then follows its
     * parts —, the typed title otherwise, which no later change to the parts overwrites.
     */
    public static function stored(?string $typed, string $brand, string $model, ?string $designation): ?string
    {
        $typed = self::tidy((string) $typed);

        if ($typed === '') {
            return null;
        }

        return self::tidy($brand.' '.self::afterBrand($brand, $typed)) === self::composed($brand, $model, $designation) ? null : $typed;
    }

    /** Whether a typed title differs from what the parts make now — the admin says so, and offers the composition. */
    public static function diverges(WheelModel $model): bool
    {
        return self::divergesFor((string) $model->brand?->name, (string) $model->name, $model->type_designation, $model->getAttribute('title'));
    }

    /** The same, from the parts as plain values — for a list's rows, which carry the brand's name. */
    public static function divergesFor(string $brand, string $model, ?string $designation, mixed $typed): bool
    {
        $typed = self::tidy(is_string($typed) ? $typed : '');

        return $typed !== '' && self::tidy($brand.' '.self::afterBrand($brand, $typed)) !== self::composed($brand, $model, $designation);
    }

    private static function tidy(string $text): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', $text));
    }
}
