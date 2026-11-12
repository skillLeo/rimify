<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One of a Gutachten's own „Bereifungskombinationen“ (D-256): `Kombination 2: vorn 225/40 R18, hinten 245/35 R18`, as
 * the document prints it, on `source_page`. The document's list is closed — the shop offers no other tyres on it.
 * Since his admin item 19 (D-358) each row belongs to one entry of the document's Verwendungsbereich, named by its
 * EG type-approval number as printed; `carried_over` marks a row moved there from the document-wide list —
 * „übernommen, bitte prüfen“. Since his round of 08.11 (§2, D-447) a row names the car it was entered for: the shop reads a car's
 * own rows, and matches by field K only the rows that name no car.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property int|null $vehicle_id
 * @property string|null $eg_number
 * @property string|null $eg_number_norm
 * @property bool $carried_over
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
        'approval_document_id', 'vehicle_id', 'eg_number', 'eg_number_norm', 'carried_over', 'number',
        'front_width_mm', 'front_aspect', 'front_diameter_in',
        'rear_width_mm', 'rear_aspect', 'rear_diameter_in',
        'source_page',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'vehicle_id' => 'integer',
            'carried_over' => 'boolean',
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

    /**
     * The combination's own Auflagen (D-451): typed beside it, for it alone.
     *
     * @return HasMany<DocumentTyreCombinationCondition, $this>
     */
    public function conditions(): HasMany
    {
        return $this->hasMany(DocumentTyreCombinationCondition::class)->orderBy('id');
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }
}
