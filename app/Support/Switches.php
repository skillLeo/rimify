<?php

declare(strict_types=1);

namespace App\Support;

/**
 * The three switches of the operator's brief of 22.11.2026, Part A — each off until the operator says „release A1“, „A2“ or
 * „A4“ and the client has answered. Off, the shop answers exactly as it did before they existed (proved by the census:
 * `docs/launch/SWITCHES.md`). Each is one env value; flipping one needs `php artisan config:cache` on the host, and the
 * catalogue caches key on it (CatalogueVersion::key), so no cached answer outlives a flip.
 */
final class Switches
{
    /** A1 — Nur Felgen: one dropdown of every wheel dimension; Kompletträder: one dropdown of every combination (D6). */
    public static function d6Dropdowns(): bool
    {
        return (bool) config('rimify.features.d6_dropdowns', false);
    }

    /** A2 — option Q: a Teilegutachten states the Abnahme on every combination, from its type, unless a Prüfer excepts the row. */
    public static function teilegutachtenAbnahme(): bool
    {
        return (bool) config('rimify.features.teilegutachten_abnahme', false);
    }

    /** A4 — a Komplettrad's answer scoped to the sizes chosen: an Auflage printed beside another size is not said for this set. */
    public static function scopedAuflagen(): bool
    {
        return (bool) config('rimify.features.scoped_auflagen', false);
    }

    /** Empty while every switch is off — so the caches' keys are byte for byte what they were before the switches. */
    public static function fingerprint(): string
    {
        $on = array_keys(array_filter([
            'd6' => self::d6Dropdowns(),
            'tg' => self::teilegutachtenAbnahme(),
            'sa' => self::scopedAuflagen(),
        ]));

        return $on === [] ? '' : '~'.implode('.', $on);
    }
}
