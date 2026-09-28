<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A bolt or nut a document names (the corrections memo §4, `befestigungsmittel`): its number as printed,
 * thread, seat, torque, shaft length, article number and the vehicle types it is for — the set the shop
 * offers with the wheel.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property string $number
 * @property string $thread
 * @property string $seat
 * @property int|null $torque_nm
 * @property int|null $shaft_length_mm
 * @property string|null $article_number
 * @property string|null $vehicle_types
 * @property int|null $source_page
 */
class DocumentFastener extends Model
{
    protected $fillable = ['approval_document_id', 'number', 'thread', 'seat', 'torque_nm', 'shaft_length_mm', 'article_number', 'vehicle_types', 'source_page'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'torque_nm' => 'integer',
            'shaft_length_mm' => 'integer',
            'source_page' => 'integer',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }
}
