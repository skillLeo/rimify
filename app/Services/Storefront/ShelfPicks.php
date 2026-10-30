<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Models\AdminUser;
use App\Models\Setting;
use App\Services\Admin\AuditTrail;

/**
 * The rims the team picks for the homepage's shelf (the client's #5, „please show 8 rims“; D-353): up to eight, in the
 * order chosen, each a card — a model in one colour, `modelId:finishId`. They fill the places that sales leave free
 * (HomeShelf); a pick that is no longer on sale is simply passed over.
 */
final class ShelfPicks
{
    public const KEY = 'home.shelf_picks';

    /** The shelf's size, and so the most there is to pick. */
    public const SIZE = 8;

    /** @return list<string> `modelId:finishId`, in the order picked */
    public static function keys(): array
    {
        $stored = Setting::get(self::KEY);

        if (! is_array($stored)) {
            return [];
        }

        $keys = [];

        foreach ($stored as $key) {
            if (is_string($key) && preg_match('/^\d+:\d+$/', $key) === 1 && ! in_array($key, $keys, true)) {
                $keys[] = $key;
            }
        }

        return array_slice($keys, 0, self::SIZE);
    }

    /**
     * @param  list<string>  $keys  validated (ShelfPicksRequest)
     * @param  array<string, string>  $labels  key → the rim's name, for the Protokoll's sentence
     */
    public static function set(array $keys, array $labels, AdminUser $actor): void
    {
        $before = self::keys();

        if ($before === $keys) {
            return;
        }

        Setting::set(self::KEY, $keys);

        $name = static fn (string $key): string => $labels[$key] ?? $key;

        AuditTrail::record($actor, 'home.shelf_picked', [
            'before' => array_map($name, $before),
            'after' => array_map($name, $keys),
        ]);
    }
}
