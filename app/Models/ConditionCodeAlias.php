<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ConditionCodeAliasFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Maps a document's own printed code onto a stable internal key, because two manufacturers number
 * the same obligation differently and the customer must still read one consistent sentence.
 */
class ConditionCodeAlias extends Model
{
    /** @use HasFactory<ConditionCodeAliasFactory> */
    use HasFactory;

    protected $fillable = ['condition_code_id', 'approval_document_id', 'printed_code', 'issuer'];

    /** @return BelongsTo<ConditionCode, $this> */
    public function conditionCode(): BelongsTo
    {
        return $this->belongsTo(ConditionCode::class);
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function approvalDocument(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class);
    }
}
