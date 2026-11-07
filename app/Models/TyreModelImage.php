<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One photograph of a tyre model, with the sentence a screen reader hears for it (the Gutachten rework §9).
 *
 * @property int $id
 * @property int $tyre_model_id
 * @property int $position
 * @property array<string, mixed> $manifest
 * @property string $alt_de
 */
class TyreModelImage extends Model
{
    protected $fillable = ['tyre_model_id', 'position', 'manifest', 'alt_de'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['manifest' => 'array', 'position' => 'integer'];
    }

    /** @return BelongsTo<TyreModel, $this> */
    public function model(): BelongsTo
    {
        return $this->belongsTo(TyreModel::class, 'tyre_model_id');
    }
}
