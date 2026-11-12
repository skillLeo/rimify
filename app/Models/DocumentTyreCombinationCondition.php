<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One code of a tyre combination's own Auflagen (D-451), as staff typed it beside the combination in step 4 — for one wheel of the
 * cell it was typed in.
 *
 * @property int $id
 * @property int $document_tyre_combination_id
 * @property int $wheel_config_id
 * @property string $code
 */
class DocumentTyreCombinationCondition extends Model
{
    protected $fillable = ['document_tyre_combination_id', 'wheel_config_id', 'code'];

    /** @return BelongsTo<DocumentTyreCombination, $this> */
    public function combination(): BelongsTo
    {
        return $this->belongsTo(DocumentTyreCombination::class, 'document_tyre_combination_id');
    }
}
