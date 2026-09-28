<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A code on one tyre size of a row, as the document prints it: both real documents hang Auflagen off the
 * (vehicle × tyre size) pair, so one size can need an Abnahme where another does not (the corrections
 * memo §2). Resolved against the row's own document, like the row's codes.
 *
 * @property int $fitment_tyre_size_id
 * @property string $code
 */
class FitmentTyreSizeCondition extends Model
{
    protected $table = 'fitment_tyre_size_conditions';

    protected $primaryKey = 'fitment_tyre_size_id';

    public $incrementing = false;

    protected $fillable = ['fitment_tyre_size_id', 'code'];

    /** @return BelongsTo<FitmentTyreSize, $this> */
    public function tyreSize(): BelongsTo
    {
        return $this->belongsTo(FitmentTyreSize::class, 'fitment_tyre_size_id');
    }
}
