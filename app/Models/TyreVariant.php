<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\GermanFormat;
use Database\Factories\TyreVariantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A sellable tyre.
 *
 * `speed_rank` is what every comparison uses; `speed_symbol` is for display only. H sits between
 * U and V, so ordering the letters is code that reads correct and is wrong — in the permissive
 * direction, which is the direction this system must never fail in.
 *
 * @property int $width_mm
 * @property int $aspect
 * @property float $diameter_in
 * @property int $load_index
 * @property int $speed_rank
 * @property string $speed_symbol
 * @property string|null $eu_noise_class
 * @property string|null $eprel_id
 * @property bool $is_demo
 */
class TyreVariant extends Model
{
    /** @use HasFactory<TyreVariantFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'brand_id', 'name', 'season', 'width_mm', 'aspect', 'diameter_in',
        'load_index', 'speed_symbol', 'speed_rank',
        'eu_fuel_class', 'eu_wet_grip_class', 'eu_noise_db', 'eu_noise_class', 'eprel_id',
        'price_cents', 'currency', 'stock_qty', 'is_demo',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'width_mm' => 'integer',
            'aspect' => 'integer',
            'diameter_in' => 'float',
            'load_index' => 'integer',
            'speed_rank' => 'integer',
            'eu_noise_db' => 'integer',
            'price_cents' => 'integer',
            'stock_qty' => 'integer',
            // A seeded demonstration row. Never real stock, and the demo gate refuses to sell it.
            'is_demo' => 'boolean',
        ];
    }

    /** `245/45 R18 92Y` */
    public function label(): string
    {
        return GermanFormat::tyreSize(
            $this->width_mm,
            $this->aspect,
            $this->diameter_in,
            $this->load_index,
            $this->speed_symbol,
        );
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }
}
