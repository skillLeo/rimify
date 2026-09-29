<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BrandFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brand extends Model
{
    /** @use HasFactory<BrandFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = ['name', 'slug', 'logo_path', 'is_wheel_brand', 'sort_order'];

    /** The generated columns that carry the unique keys among live brands (K2-01): never written, never shown. */
    protected $hidden = ['live_name', 'live_slug'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            // On the homepage brand wall whether or not a wheel is in stock; a tyre brand is not.
            'is_wheel_brand' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<WheelModel, $this> */
    public function wheelModels(): HasMany
    {
        return $this->hasMany(WheelModel::class);
    }

    /** @return HasMany<TyreVariant, $this> */
    public function tyreVariants(): HasMany
    {
        return $this->hasMany(TyreVariant::class);
    }
}
