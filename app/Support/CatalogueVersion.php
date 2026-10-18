<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\ApprovalDocument;
use App\Models\BalanceWeightColour;
use App\Models\Brand;
use App\Models\DocumentCondition;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Models\DocumentSpeedDerating;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Models\FitmentCondition;
use App\Models\FitmentConflict;
use App\Models\FitmentTyreSize;
use App\Models\FitmentTyreSizeCondition;
use App\Models\LoadIndexEntry;
use App\Models\Review;
use App\Models\SpeedSymbolEntry;
use App\Models\TpmsSensorPrice;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelFinishImage;
use App\Models\WheelModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Which state of the catalogue the shop's answers are computed from (the client's admin item 16, D-294): one value that
 * changes whenever anything they rest on is written — a wheel, its sizes, prices and photos, a Gutachten and everything
 * entered for it, a vehicle, the tyres and parts sold with a wheel, a review.
 *
 * Three things read it:
 * - the shop's own caches (the vehicle tree, a car's count, the menu, the search, the homepage's figures) keep their
 *   entries under it, so a write sends them all to the database again at once — not when their minutes run out;
 * - every answer's ETag carries it (CacheHeaders), so a publish changes what an address answers, visibly;
 * - a page brought back by Back or Forward compares its own with the server's, and is asked again whole where they
 *   differ (restoredPages.ts).
 *
 * Kept in the cache store and read once per request (`memo`). Gone — a cache cleared on deploy, an evicted key — it
 * starts again at a new value: the safe way round, since everything kept under the old one is then missed.
 */
final class CatalogueVersion
{
    public const CACHE_KEY = 'catalogue.version';

    /**
     * The models whose every write — saved, deleted, restored — changes what the shop answers (AppServiceProvider).
     * Writes that bypass the models (a bulk insert, an import, a release) say so themselves: `changed()`.
     *
     * @var list<class-string<Model>>
     */
    public const MODELS = [
        ApprovalDocument::class,
        DocumentCondition::class,
        DocumentConditionRework::class,
        DocumentFastener::class,
        DocumentNotice::class,
        DocumentSpeedDerating::class,
        DocumentTyreCombination::class,
        Fitment::class,
        FitmentCondition::class,
        FitmentConflict::class,
        FitmentTyreSize::class,
        FitmentTyreSizeCondition::class,
        LoadIndexEntry::class,
        SpeedSymbolEntry::class,
        Vehicle::class,
        Brand::class,
        WheelModel::class,
        WheelConfig::class,
        WheelFinish::class,
        WheelFinishImage::class,
        TyreVariant::class,
        BalanceWeightColour::class,
        TpmsSensorPrice::class,
        Review::class,
    ];

    /** The version now. */
    public static function current(): string
    {
        $version = Cache::memo()->get(self::CACHE_KEY);

        if (is_string($version) && $version !== '') {
            return $version;
        }

        $version = self::fresh();
        Cache::memo()->forever(self::CACHE_KEY, $version);

        return $version;
    }

    /**
     * Something the answers rest on was written: a new version once the write is committed — at once outside a
     * transaction, never for one a rollback undoes.
     */
    public static function changed(): void
    {
        DB::afterCommit(static function (): void {
            Cache::memo()->forever(self::CACHE_KEY, self::fresh());
        });
    }

    /** A cache key kept under the current version: `vehicle-tree.makes` becomes `vehicle-tree.makes@lq3x2k1f-9c04e1`. */
    public static function key(string $key): string
    {
        return $key.'@'.self::current();
    }

    /** Milliseconds and a random tail: never the value before, even twice in one millisecond. */
    private static function fresh(): string
    {
        return base_convert((string) (int) floor(microtime(true) * 1000), 10, 36).'-'.bin2hex(random_bytes(3));
    }
}
