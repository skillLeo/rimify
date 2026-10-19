<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Models\Brand;
use Illuminate\Support\Str;

/**
 * The brand a catalogue form names: one chosen from the list, or one typed in — the Felge form's and the Reifen form's
 * alike, so a brand typed on either is found, brought back or made the same way.
 */
final class CatalogueBrands
{
    /**
     * The brand chosen by id; otherwise the live brand of the name typed, a removed one of that name brought back, or a
     * new one at the end of the brand wall. `$wheelBrand` is what a new brand is: a Felge's stands on the homepage's
     * brand wall, a tyre's does not.
     */
    public static function resolve(?int $id, ?string $new, bool $wheelBrand): Brand
    {
        if ($id !== null) {
            return Brand::query()->findOrFail($id);
        }

        $name = trim((string) $new);
        $existing = Brand::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();

        if ($existing instanceof Brand) {
            return $existing;
        }

        // A removed brand of that name comes back — its id, its slug and its logo — as on the Marken
        // page, rather than a second row as „rotiform-2" (K2-01).
        $removed = Brand::onlyTrashed()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->latest('deleted_at')->first();

        // Only while no live brand holds its address: a brand renamed to „Rotiform.“ keeps the slug
        // `rotiform`, and a restored twin would collide with it (K2-44) — a new brand is made instead.
        if ($removed instanceof Brand && ! Brand::query()->where('slug', $removed->slug)->exists()) {
            $removed->restore();

            return $removed;
        }

        return Brand::query()->create([
            'name' => $name,
            'slug' => self::slug($name),
            'is_wheel_brand' => $wheelBrand,
            'sort_order' => (int) Brand::query()->max('sort_order') + 10,
        ]);
    }

    /** A brand address no other brand has, now or before. */
    private static function slug(string $name): string
    {
        $base = Str::slug($name, '-', 'de') ?: 'marke';
        $slug = $base;
        $n = 2;

        while (Brand::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
