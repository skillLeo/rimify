<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Enums\CatalogueStatus;
use App\Enums\DocumentStatus;
use App\Support\CatalogueVersion;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The store's real figures: how many documents are live, how many vehicle variants they cover,
 * how many wheels have at least one, and how many brands. Shown only where they are true — a
 * number here is a count, never a claim. Cached for an hour under the catalogue's version (CatalogueVersion, D-294),
 * which every write to the catalogue renews.
 */
final readonly class HomeStats
{
    private const CACHE_KEY = 'home.stats';

    private const TTL = 3600;

    /**
     * @return array{gutachten: int, variants: int, wheels: int, brands: int}
     */
    public function counts(): array
    {
        /** @var array{gutachten: int, variants: int, wheels: int, brands: int} $counts */
        $counts = Cache::remember(CatalogueVersion::key(self::CACHE_KEY), self::TTL, function (): array {
            $live = DB::table('fitments as f')
                ->join('approval_documents as ad', 'ad.id', '=', 'f.approval_document_id')
                ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
                ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
                ->join('vehicles as v', 'v.id', '=', 'f.vehicle_id')
                ->where('ad.status', DocumentStatus::Published->value)
                ->whereNull('ad.valid_to')
                ->whereNull('wm.deleted_at')
                ->whereNull('wc.deleted_at')
                ->whereNull('v.deleted_at')
                ->where('wm.status', CatalogueStatus::Published->value);

            $row = $live->selectRaw('
                COUNT(DISTINCT ad.id) AS gutachten,
                COUNT(DISTINCT f.vehicle_id) AS variants,
                COUNT(DISTINCT wm.id) AS wheels,
                COUNT(DISTINCT wm.brand_id) AS brands
            ')->first();

            return [
                'gutachten' => $row === null ? 0 : (int) $row->gutachten,
                'variants' => $row === null ? 0 : (int) $row->variants,
                'wheels' => $row === null ? 0 : (int) $row->wheels,
                'brands' => $row === null ? 0 : (int) $row->brands,
            ];
        });

        return $counts;
    }

    /**
     * The same two figures for one wheel (#19, D-103): the released documents that approve it, and the vehicle variants
     * they approve it for. What the product page says under the name while it has no reviews — a count it can prove.
     * Not cached: a release must show at once, and it is one indexed query.
     *
     * @return array{gutachten: int, variants: int}
     */
    public function forModel(int $wheelModelId): array
    {
        $row = DB::table('fitments as f')
            ->join('approval_documents as ad', 'ad.id', '=', 'f.approval_document_id')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->join('vehicles as v', 'v.id', '=', 'f.vehicle_id')
            ->where('wc.wheel_model_id', $wheelModelId)
            ->where('ad.status', DocumentStatus::Published->value)
            ->whereNull('ad.valid_to')
            ->whereNull('wc.deleted_at')
            ->whereNull('v.deleted_at')
            ->selectRaw('COUNT(DISTINCT ad.id) AS gutachten, COUNT(DISTINCT f.vehicle_id) AS variants')
            ->first();

        return [
            'gutachten' => $row === null ? 0 : (int) $row->gutachten,
            'variants' => $row === null ? 0 : (int) $row->variants,
        ];
    }

    public static function forget(): void
    {
        Cache::forget(CatalogueVersion::key(self::CACHE_KEY));
    }
}
