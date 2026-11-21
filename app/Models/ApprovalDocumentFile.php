<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One PDF of a Gutachten as the customer may open it (D-494): the paper's own (`is_main`, its file on the paper) or a further
 * one — Nachtrag, Anlage, older version — with its own file. Hidden or shown, never deleted.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property string $label
 * @property Carbon|null $dated_on
 * @property int $position
 * @property bool $is_main
 * @property string|null $file_key
 * @property string|null $sha256
 * @property int|null $bytes
 * @property Carbon|null $hidden_at
 * @property int|null $hidden_by
 * @property int|null $created_by
 */
class ApprovalDocumentFile extends Model
{
    public const LABELS = ['Gutachten', 'Nachtrag', 'Anlage', 'Ältere Fassung'];

    protected $fillable = ['approval_document_id', 'label', 'dated_on', 'position', 'is_main', 'file_key', 'sha256', 'bytes', 'created_by'];

    protected function casts(): array
    {
        return [
            'dated_on' => 'date',
            'is_main' => 'boolean',
            'hidden_at' => 'datetime',
            'position' => 'integer',
            'bytes' => 'integer',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }

    public function isVisible(): bool
    {
        return $this->hidden_at === null;
    }
}
