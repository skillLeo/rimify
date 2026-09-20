<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\WheelFinishFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * One colourway of a wheel model.
 *
 * `hex` is the swatch a customer taps; `art_finish` is the palette `wheelSVG()` shades the metal
 * with. They are deliberately separate — two finishes can share a palette and still need different
 * swatches, and a swatch that drives the rendering would make every new colour a code change.
 *
 * @property int $id
 * @property int $wheel_model_id
 * @property string $name_de
 * @property string|null $name_en
 * @property string|null $hex
 * @property string $art_finish
 * @property int $sort_order
 */
class WheelFinish extends Model
{
    /** @use HasFactory<WheelFinishFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $table = 'wheel_finishes';

    protected $fillable = ['wheel_model_id', 'name_de', 'name_en', 'hex', 'art_finish', 'sort_order'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }

    /** @return BelongsTo<WheelModel, $this> */
    public function wheelModel(): BelongsTo
    {
        return $this->belongsTo(WheelModel::class);
    }

    /** @return HasMany<WheelConfig, $this> */
    public function configs(): HasMany
    {
        return $this->hasMany(WheelConfig::class);
    }
}
