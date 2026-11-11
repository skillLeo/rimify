<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Support\Shipping;
use Illuminate\Support\Facades\DB;

/**
 * The one shipping setting of Einstellungen › Verkäufer & Versand as the first shipping method (D-449), once, by the migration
 * that brings the methods: what the shop said before the release, it says after. Complete and not marked a placeholder, it is
 * active, „Standardversand“; incomplete or a placeholder, it is kept for the admin to finish and never said to a customer — as
 * before, where such a setting made every real order wait. No setting, no method: the `.env` stands as before (Shipping).
 */
final class ShippingSettingCarry
{
    /** @return 'active'|'inactive'|'none' */
    public static function carry(): string
    {
        $row = DB::table('settings')->where('key', Shipping::KEY)->value('value');
        $value = is_string($row) ? json_decode($row, true) : null;

        if (! is_array($value) || DB::table('shipping_methods')->exists()) {
            return 'none';
        }

        $zone = is_array($value['zones'][Shipping::DOMESTIC] ?? null) ? $value['zones'][Shipping::DOMESTIC] : [];
        $cost = is_int($zone['cost_cents'] ?? null) && $zone['cost_cents'] >= 0 ? $zone['cost_cents'] : null;
        $free = is_int($zone['free_from_cents'] ?? null) && $zone['free_from_cents'] >= 0 ? $zone['free_from_cents'] : null;
        $min = is_int($value['delivery_min_days'] ?? null) ? $value['delivery_min_days'] : null;
        $max = is_int($value['delivery_max_days'] ?? null) ? $value['delivery_max_days'] : null;
        $complete = $cost !== null && $min !== null && $max !== null && $min >= 1 && $max >= $min && $max <= 60;
        $active = $complete && ($value['placeholder'] ?? false) !== true;

        DB::table('shipping_methods')->insert([
            'name' => 'Standardversand',
            'price_cents' => $cost ?? 0,
            'currency' => 'EUR',
            'free_from_cents' => $free,
            'delivery_min_days' => $complete ? $min : 1,
            'delivery_max_days' => $complete ? $max : 1,
            'countries' => json_encode([Shipping::DOMESTIC]),
            'product_types' => null,
            'position' => 1,
            'active' => $active,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $active ? 'active' : 'inactive';
    }
}
