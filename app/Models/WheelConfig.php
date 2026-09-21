<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\GermanFormat;
use Database\Factories\WheelConfigFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * The sellable unit: one model, in one finish, in one diameter × width × ET × bolt pattern.
 *
 * MySQL returns DECIMAL columns as strings, so width and diameter are cast to float here — the
 * fitment engine compares them numerically against the permitted ranges, and a string comparison
 * would make '10.00' < '9.00'.
 *
 * @property float $diameter_in
 * @property float $width_in
 * @property int $et_mm
 * @property int $price_cents
 * @property int $stock_qty
 */
class WheelConfig extends Model
{
    /** @use HasFactory<WheelConfigFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'wheel_model_id', 'wheel_finish_id', 'diameter_in', 'width_in', 'et_mm',
        'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm', 'hump', 'bead_profile',
        'kba_number', 'ean', 'sku', 'price_cents', 'currency', 'stock_qty', 'weight_g',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'diameter_in' => 'float',
            'width_in' => 'float',
            'et_mm' => 'integer',
            'bolt_holes' => 'integer',
            'bolt_circle_mm' => 'float',
            'centre_bore_mm' => 'float',
            'price_cents' => 'integer',
            'stock_qty' => 'integer',
            'weight_g' => 'integer',
        ];
    }

    public function isInStock(): bool
    {
        return $this->stock_qty > 0;
    }

    /** `8,5J × 18 · ET 35 · 5/112 · 66,6 mm` — the label the customer sees. */
    public function label(): string
    {
        return GermanFormat::wheelLabel(
            $this->width_in,
            $this->diameter_in,
            $this->et_mm,
            $this->bolt_holes,
            $this->bolt_circle_mm,
            $this->centre_bore_mm,
        );
    }

    /** @return BelongsTo<WheelModel, $this> */
    public function wheelModel(): BelongsTo
    {
        return $this->belongsTo(WheelModel::class);
    }

    /** @return BelongsTo<WheelFinish, $this> */
    public function wheelFinish(): BelongsTo
    {
        return $this->belongsTo(WheelFinish::class);
    }

    /** @return HasMany<Fitment, $this> */
    public function fitments(): HasMany
    {
        return $this->hasMany(Fitment::class);
    }
}
