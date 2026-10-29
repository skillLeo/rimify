<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Models\AdminUser;
use App\Models\WheelModel;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use App\Support\WheelTitle;
use Illuminate\Support\Facades\DB;

/**
 * Stars typed in the admin, per rim — the client's #19 as we promised it (D-344): the rating, the number of reviews behind
 * it, and the sentence that says where they come from. Written together or taken off together, each change one Protokoll
 * entry; the table itself refuses one without the others (chk_wheel_model_stated_rating).
 *
 * They are the operator's statement, not the shop's finding. The product page shows them under the rim's name beside that
 * sentence, and nowhere else: never as „Geprüfter Kauf“, never added to the buyers' own rating (ReviewSummary writes
 * that), never in the structured data (ProductJsonLd reads the buyers' rating alone).
 */
final class StatedRatings
{
    public function state(WheelModel $wheel, float $rating, int $count, string $origin, AdminUser $admin): void
    {
        DB::transaction(static function () use ($wheel, $rating, $count, $origin, $admin): void {
            $locked = WheelModel::query()->whereKey($wheel->id)->lockForUpdate()->firstOrFail();
            $before = self::forShop($locked);

            $locked->forceFill(['stated_rating' => $rating, 'stated_rating_count' => $count, 'stated_rating_origin' => $origin])->save();

            AuditTrail::record($admin, 'wheel.rating_stated', [
                'name' => WheelTitle::full($locked),
                'label' => GermanFormat::rating($rating, $count),
                'origin' => $origin,
                'before' => $before,
            ], $locked);
        });
    }

    /** Takes the stars off; false where there were none, and then nothing is written. */
    public function remove(WheelModel $wheel, AdminUser $admin): bool
    {
        return DB::transaction(static function () use ($wheel, $admin): bool {
            $locked = WheelModel::query()->whereKey($wheel->id)->lockForUpdate()->firstOrFail();
            $before = self::forShop($locked);

            if ($before === null && $locked->stated_rating === null) {
                return false;
            }

            $locked->forceFill(['stated_rating' => null, 'stated_rating_count' => null, 'stated_rating_origin' => null])->save();

            AuditTrail::record($admin, 'wheel.rating_removed', [
                'name' => WheelTitle::full($locked),
                'label' => $before['label'] ?? null,
                'origin' => $before['origin'] ?? null,
            ], $locked);

            return true;
        });
    }

    /**
     * What the product page shows under the rim's name, or null: all three typed and the sentence not blank — without its
     * sentence there are no stars, whatever else is stored.
     *
     * @return array{label: string, origin: string}|null
     */
    public static function forShop(WheelModel $wheel): ?array
    {
        $rating = $wheel->stated_rating;
        $count = $wheel->stated_rating_count;
        $origin = trim((string) $wheel->stated_rating_origin);

        if ($rating === null || $rating < 1.0 || $rating > 5.0 || $count === null || $count < 1 || $origin === '') {
            return null;
        }

        return ['label' => GermanFormat::rating($rating, $count), 'origin' => $origin];
    }

    /**
     * The admin's card: the figures as they are typed (`4,9`, `13`), the sentence, and the line the shop shows — or null.
     *
     * @return array{rating: string, count: string, origin: string, label: string}|null
     */
    public static function forAdmin(WheelModel $wheel): ?array
    {
        $shop = self::forShop($wheel);

        if ($shop === null) {
            return null;
        }

        return [
            'rating' => GermanFormat::decimal((float) $wheel->stated_rating, 1),
            'count' => (string) $wheel->stated_rating_count,
            'origin' => $shop['origin'],
            'label' => $shop['label'],
        ];
    }
}
