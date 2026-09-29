<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One photograph of a colour (FinishImages): its manifest, its place in the colour's order and its alt text.
 *
 * @property int $id
 * @property int $wheel_finish_id
 * @property int $position
 * @property array<string, mixed> $manifest
 * @property string $alt_de
 */
class WheelFinishImage extends Model
{
    protected $fillable = ['wheel_finish_id', 'position', 'manifest', 'alt_de'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['manifest' => 'array', 'position' => 'integer'];
    }

    /** @return BelongsTo<WheelFinish, $this> */
    public function finish(): BelongsTo
    {
        return $this->belongsTo(WheelFinish::class, 'wheel_finish_id');
    }
}
