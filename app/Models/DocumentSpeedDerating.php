<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One cell of a document's table of tyre load at speed (ABE 55255, p. 6): at `speed_kmh`, a tyre of
 * `symbol` may carry `percent` of its load index — or, NULL, may not be used at all (the table's „–“).
 *
 * @property int $id
 * @property int $approval_document_id
 * @property int $speed_kmh
 * @property string $symbol
 * @property int|null $percent
 * @property int|null $source_page
 * @property string|null $seeded_from where the demo seed took the table from; NULL = typed from this document
 */
class DocumentSpeedDerating extends Model
{
    protected $fillable = ['approval_document_id', 'speed_kmh', 'symbol', 'percent', 'source_page', 'seeded_from'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'speed_kmh' => 'integer',
            'percent' => 'integer',
            'source_page' => 'integer',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }
}
