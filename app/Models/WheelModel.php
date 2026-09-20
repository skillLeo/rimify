<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CatalogueStatus;
use Database\Factories\WheelModelFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * "BORBET Havanna" — one product, many sellable configurations.
 *
 * @property int $id
 * @property int $brand_id
 * @property string $name
 * @property string $slug
 * @property string|null $type_designation
 * @property string|null $description_de
 * @property CatalogueStatus $status
 * @property int $spoke_count
 * @property float|null $rating
 * @property int $rating_count
 */
class WheelModel extends Model
{
    /** @use HasFactory<WheelModelFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'brand_id', 'name', 'type_designation', 'slug', 'description_de', 'status',
        'spoke_count', 'rating', 'rating_count',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => CatalogueStatus::class,
            'spoke_count' => 'integer',
            // Displayed, never compared as money — a float is the honest type for a star figure.
            'rating' => 'float',
            'rating_count' => 'integer',
        ];
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return HasMany<WheelFinish, $this> */
    public function finishes(): HasMany
    {
        return $this->hasMany(WheelFinish::class);
    }

    /** @return HasMany<WheelConfig, $this> */
    public function configs(): HasMany
    {
        return $this->hasMany(WheelConfig::class);
    }
}
