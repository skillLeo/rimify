<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A duty a document always states (the corrections memo §4, `gutachten_pflichthinweis`): the torque check
 * after 50 km, the TPMS note, correcting the papers. Shown with every verdict the document gives, as the
 * whole sentence (R-15).
 *
 * @property int $id
 * @property int $approval_document_id
 * @property string $text_de
 * @property int|null $source_page
 * @property int $sort_order
 */
class DocumentNotice extends Model
{
    protected $fillable = ['approval_document_id', 'text_de', 'source_page', 'sort_order'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'source_page' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }
}
