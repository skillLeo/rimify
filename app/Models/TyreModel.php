<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A tyre model: brand, name and season, once, with its photographs; its sizes are the `tyre_variants` of those three, which every
 * reader of a tyre goes on reading (the Gutachten rework §9, D-407).
 *
 * @property int $id
 * @property int $brand_id
 * @property string $name
 * @property string $season
 * @property Brand|null $brand
 */
class TyreModel extends Model
{
    protected $fillable = ['brand_id', 'name', 'season'];

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return HasMany<TyreModelImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(TyreModelImage::class)->orderBy('position')->orderBy('id');
    }

    /**
     * Its live sizes.
     *
     * @return Builder<TyreVariant>
     */
    public function sizes(): Builder
    {
        return TyreVariant::query()->where('brand_id', $this->brand_id)->where('name', $this->name)->where('season', $this->season);
    }

    /** A seeded demonstration model: shown and never changed, as its tyres (TyreVariantPolicy). */
    public function isDemo(): bool
    {
        return $this->sizes()->where('is_demo', true)->exists();
    }

    /** `Continental PremiumContact 7` */
    public function title(): string
    {
        return trim(($this->brand->name ?? '').' '.$this->name);
    }
}
