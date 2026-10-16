<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One of a Gutachten's own „Bereifungskombinationen“ (D-256): `Kombination 2: vorn 225/40 R18, hinten 245/35 R18`, as
 * the document prints it, on `source_page`. The document's list is closed — the shop offers no other tyres on it.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property int $number
 * @property int $front_width_mm
 * @property int $front_aspect
 * @property float $front_diameter_in
 * @property int $rear_width_mm
 * @property int $rear_aspect
 * @property float $rear_diameter_in
 * @property int|null $source_page
 */
class DocumentTyreCombination extends Model
{
    protected $fillable = [
        'approval_document_id', 'number',
        'front_width_mm', 'front_aspect', 'front_diameter_in',
        'rear_width_mm', 'rear_aspect', 'rear_diameter_in',
        'source_page',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'front_width_mm' => 'integer',
            'front_aspect' => 'integer',
            'front_diameter_in' => 'float',
            'rear_width_mm' => 'integer',
            'rear_aspect' => 'integer',
            'rear_diameter_in' => 'float',
            'source_page' => 'integer',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }
}
