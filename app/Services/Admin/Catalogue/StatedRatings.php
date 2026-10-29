<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Models\AdminUser;
use App\Models\Setting;
use App\Models\WheelModel;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use App\Support\WheelTitle;
use Illuminate\Support\Facades\DB;

/**
 * Stars typed in the admin, per rim — the client's #19 as he decided it in writing on 29.10.2026 („Please just take it
 * live. We will contact a lawyer to ask him about the details.“, D-345): the rating and the number of reviews behind it,
 * written together or taken off together, each change one Protokoll entry; the table itself refuses one without the
 * other (chk_wheel_model_stated_rating).
 *
 * Beside them, everywhere they show, stands one shop-wide sentence (§ 5b Abs. 3 UWG: whether and how the shop checks
 * the reviews it shows) — a setting with the agreed default, which his lawyer may reword. Emptied, no typed stars render
 * anywhere: the shop never shows ratings with no statement about them.
 *
 * They are the operator's statement, not the shop's finding: never „Geprüfter Kauf“, never added to the buyers' own
 * rating (ReviewSummary writes that), never in the structured data (ProductJsonLd reads the buyers' rating alone).
 */
final class StatedRatings
{
    /** The shop-wide sentence beside typed stars; a string — emptied, none render. */
    public const DISCLOSURE_SETTING = 'reviews.stated_disclosure';

    /** The default agreed on 29.10.2026 (the operator's brief, the client's reply to #19). */
    public const DISCLOSURE_DEFAULT = 'Bewertungen aus anderen Quellen, vom Shop übernommen und nicht auf einen Kauf geprüft.';

    /** The sentence as it stands: the default until someone sets another, empty once someone empties it. */
    public static function disclosure(): string
    {
        $value = Setting::get(self::DISCLOSURE_SETTING);

        return is_string($value) ? trim($value) : self::DISCLOSURE_DEFAULT;
    }

    public function setDisclosure(string $text, AdminUser $admin): void
    {
        $text = trim((string) preg_replace('/\s+/u', ' ', $text));

        DB::transaction(static function () use ($text, $admin): void {
            $before = self::disclosure();

            if ($before === $text) {
                return;
            }

            Setting::set(self::DISCLOSURE_SETTING, $text);
            AuditTrail::record($admin, 'reviews.disclosure_changed', ['before' => $before, 'after' => $text]);
        });
    }

    public function state(WheelModel $wheel, float $rating, int $count, AdminUser $admin): void
    {
        DB::transaction(static function () use ($wheel, $rating, $count, $admin): void {
            $locked = WheelModel::query()->whereKey($wheel->id)->lockForUpdate()->firstOrFail();
            $before = self::label($locked->stated_rating, $locked->stated_rating_count);

            $locked->forceFill(['stated_rating' => $rating, 'stated_rating_count' => $count])->save();

            AuditTrail::record($admin, 'wheel.rating_stated', [
                'name' => WheelTitle::full($locked),
                'label' => GermanFormat::rating($rating, $count),
                'before' => $before,
            ], $locked);
        });
    }

    /** Takes the stars off; false where there were none, and then nothing is written. */
    public function remove(WheelModel $wheel, AdminUser $admin): bool
    {
        return DB::transaction(static function () use ($wheel, $admin): bool {
            $locked = WheelModel::query()->whereKey($wheel->id)->lockForUpdate()->firstOrFail();
            $before = self::label($locked->stated_rating, $locked->stated_rating_count);

            if ($before === null) {
                return false;
            }

            $locked->forceFill(['stated_rating' => null, 'stated_rating_count' => null])->save();
            AuditTrail::record($admin, 'wheel.rating_removed', ['name' => WheelTitle::full($locked), 'label' => $before], $locked);

            return true;
        });
    }

    /**
     * What a page shows beside the rim's name, or null: both figures typed and a sentence to stand beside them.
     *
     * @return array{label: string, disclosure: string}|null
     */
    public static function forShop(WheelModel $wheel, ?string $disclosure = null): ?array
    {
        return self::forValues($wheel->stated_rating, $wheel->stated_rating_count, $disclosure ?? self::disclosure());
    }

    /**
     * The same from a card's columns — the disclosure read once per page, not once per card.
     *
     * @return array{label: string, disclosure: string}|null
     */
    public static function forValues(mixed $rating, mixed $count, string $disclosure): ?array
    {
        $label = self::label($rating, $count);

        return $label === null || $disclosure === '' ? null : ['label' => $label, 'disclosure' => $disclosure];
    }

    /**
     * The admin's card: the figures as they are typed (`4,9`, `13`) and the line the shop shows — or null.
     *
     * @return array{rating: string, count: string, label: string}|null
     */
    public static function forAdmin(WheelModel $wheel): ?array
    {
        $label = self::label($wheel->stated_rating, $wheel->stated_rating_count);

        return $label === null ? null : [
            'rating' => GermanFormat::decimal((float) $wheel->stated_rating, 1),
            'count' => (string) $wheel->stated_rating_count,
            'label' => $label,
        ];
    }

    /** `4,9 (13 Bewertungen)`, or null where the pair is not whole and within its bounds. */
    private static function label(mixed $rating, mixed $count): ?string
    {
        if (! is_numeric($rating) || ! is_numeric($count)) {
            return null;
        }

        $rating = (float) $rating;
        $count = (int) $count;

        return $rating < 1.0 || $rating > 5.0 || $count < 1 ? null : GermanFormat::rating($rating, $count);
    }
}
