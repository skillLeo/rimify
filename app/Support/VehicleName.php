<?php

declare(strict_types=1);

namespace App\Support;

/**
 * A vehicle's name as people say it: make, model and variant, with the model named once.
 * The KBA variant usually repeats the model („RS 4 Avant Quattro“ under „RS 4“), so the model is
 * dropped where the variant already starts with it — `BMW X3 M40i`, never `BMW X3 X3 M40i`.
 */
final class VehicleName
{
    public static function of(?string $make, ?string $model, ?string $variant): string
    {
        $make = trim((string) $make);
        $model = trim((string) $model);
        $variant = trim((string) $variant);
        $rest = $model !== '' && str_starts_with($variant, $model) ? $variant : trim("{$model} {$variant}");

        return trim("{$make} {$rest}");
    }

    /**
     * The name the shop gives a car: make and variant, as a dataset's variant names it — `BMW 320d`. A car typed
     * from a Gutachten is named by its Fahrzeugtyp, which says nothing without the model, so it keeps the model:
     * `BMW 1er-Reihe 187`, `BMW 5er-Reihe 5L ohne Allradlenkung`, never `BMW 187` (Block D).
     */
    public static function forShop(?string $make, ?string $model, ?string $variant, ?string $typeDesignation): string
    {
        $variant = trim((string) $variant);
        $type = trim((string) $typeDesignation);

        if ($type !== '' && str_starts_with($variant, $type)) {
            return self::of($make, $model, $variant);
        }

        return trim(trim((string) $make).' '.$variant);
    }

    /** The same, read from anything that carries `make`, `model` and `variant`. */
    public static function from(object $vehicle): string
    {
        return self::of(self::text($vehicle, 'make'), self::text($vehicle, 'model'), self::text($vehicle, 'variant'));
    }

    private static function text(object $vehicle, string $key): ?string
    {
        $value = $vehicle->{$key} ?? null;

        return is_scalar($value) ? (string) $value : null;
    }
}
