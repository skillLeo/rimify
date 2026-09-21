<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Axle;
use Database\Factories\FitmentTyreSizeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A tyre size a document permits on a fitment, per axle — front and rear can differ.
 *
 * `min_load_index` and `min_speed_symbol` are the document's OWN minima. Where they are present
 * the document wins and the derivation is the floor; the stricter of the two governs (R-06).
 *
 * @property int $width_mm
 * @property int $aspect
 * @property float $diameter_in
 * @property int|null $min_load_index
 * @property string|null $min_speed_symbol
 * @property Axle $axle
 */
class FitmentTyreSize extends Model
{
    /** @use HasFactory<FitmentTyreSizeFactory> */
    use HasFactory;

    protected $table = 'fitment_tyre_sizes';

    protected $fillable = [
        'fitment_id', 'width_mm', 'aspect', 'diameter_in', 'min_load_index', 'min_speed_symbol', 'axle',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'width_mm' => 'integer',
            'aspect' => 'integer',
            'diameter_in' => 'float',
            'min_load_index' => 'integer',
            'axle' => Axle::class,
        ];
    }

    /** @return BelongsTo<Fitment, $this> */
    public function fitment(): BelongsTo
    {
        return $this->belongsTo(Fitment::class);
    }
}
