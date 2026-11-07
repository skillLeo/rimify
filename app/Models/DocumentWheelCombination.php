<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A wheel combination of a Gutachten: one version of its wheel in front, one behind, the same one by default (the client's change
 * of 07.11.2026). Cars take their tyres per combination; the writer puts them on the tables the shop reads.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property int $front_wheel_size_id
 * @property int $rear_wheel_size_id
 * @property int $position
 */
class DocumentWheelCombination extends Model
{
    protected $fillable = ['approval_document_id', 'front_wheel_size_id', 'rear_wheel_size_id', 'position'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }

    /** @return BelongsTo<DocumentWheelSize, $this> */
    public function front(): BelongsTo
    {
        return $this->belongsTo(DocumentWheelSize::class, 'front_wheel_size_id');
    }

    /** @return BelongsTo<DocumentWheelSize, $this> */
    public function rear(): BelongsTo
    {
        return $this->belongsTo(DocumentWheelSize::class, 'rear_wheel_size_id');
    }

    /** @return HasMany<DocumentCarEntry, $this> */
    public function entries(): HasMany
    {
        return $this->hasMany(DocumentCarEntry::class)->orderBy('position')->orderBy('id');
    }

    /** The same version front and rear. */
    public function same(): bool
    {
        return $this->front_wheel_size_id === $this->rear_wheel_size_id;
    }
}
