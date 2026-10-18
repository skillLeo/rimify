<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CatalogueStatus;
use App\Services\Demo\AcceptanceSet;
use Database\Factories\WheelModelFactory;
use Illuminate\Database\Eloquent\Builder;
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
 * @property string|null $type_designation the Radtypenbezeichnung, as the Gutachten print it (D-298)
 * @property string|null $title the name in the shop where a person typed one; null: brand, model and Radtypenbezeichnung (WheelTitle)
 * @property string|null $description_de
 * @property string|null $seo_title
 * @property string|null $seo_description
 * @property string|null $internal_note admin only, never shown in the shop
 * @property CatalogueStatus $status
 * @property int $spoke_count
 * @property float|null $rating
 * @property int $rating_count
 * @property bool $is_demo
 * @property string|null $demo_ref `abnahme:…` for the acceptance set's rows (AcceptanceSet), else null
 */
class WheelModel extends Model
{
    /** @use HasFactory<WheelModelFactory> */
    use HasFactory;

    use SoftDeletes;

    /**
     * Never `rating` or `rating_count`: they are what the buyers' visible reviews add up to, written by ReviewSummary
     * alone (D-103) — no form, import or seeder can type a rating nobody gave (§ 5 UWG).
     */
    protected $fillable = [
        'brand_id', 'name', 'type_designation', 'title', 'slug', 'description_de', 'seo_title', 'seo_description', 'internal_note', 'status',
        'spoke_count', 'is_demo', 'demo_ref',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => CatalogueStatus::class,
            'spoke_count' => 'integer',
            // A seeded demonstration row. Never real stock, and said so on the page.
            'is_demo' => 'boolean',
            // Displayed, never compared as money — a float is the honest type for a star figure.
            'rating' => 'float',
            'rating_count' => 'integer',
        ];
    }

    /**
     * The models the shop sells: published, and real — or the acceptance set's, off production (AcceptanceSet).
     *
     * @param  Builder<WheelModel>  $query
     */
    public function scopeOnSale(Builder $query): void
    {
        $query->where('status', CatalogueStatus::Published->value)
            ->where(static function (Builder $sold): void {
                $sold->where('is_demo', false);

                if (! app()->environment('production')) {
                    $sold->orWhere('demo_ref', 'like', AcceptanceSet::PREFIX.'%');
                }
            });
    }

    /** Demo data the shop must not show or sell: every demo model but the acceptance set's off production. */
    public function refusedAsDemo(): bool
    {
        return AcceptanceSet::refused((bool) $this->is_demo, $this->demo_ref);
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
