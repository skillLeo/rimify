<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A code on a row of a Gutachten's Verwendungsbereich, as the document prints it (`A01`, `K1c`).
 *
 * It names no sentence of its own: the sentence, the kind and the page are what the row's own document
 * defines under that code (DocumentCondition). A code the document does not define is unresolved, and the
 * row's verdict is UNKNOWN until it is (the corrections memo §1).
 *
 * Read through the row; written and removed only by FitmentRows, as whole sets.
 *
 * @property int $fitment_id
 * @property string $code
 * @property string|null $note_de
 */
class FitmentCondition extends Model
{
    protected $table = 'fitment_conditions';

    protected $primaryKey = 'fitment_id';

    public $incrementing = false;

    protected $fillable = ['fitment_id', 'code', 'note_de'];

    /** @return BelongsTo<Fitment, $this> */
    public function fitment(): BelongsTo
    {
        return $this->belongsTo(Fitment::class);
    }
}
