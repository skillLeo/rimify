<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * The verdict as the customer saw it, frozen onto the order line (R-12).
 *
 * Written once inside the checkout transaction and never again. The database enforces that with
 * two triggers; this model refuses first, so the failure surfaces as a clear application error
 * with a stack trace pointing at the caller, rather than as a SQLSTATE from deep inside a
 * transaction that has already done other work.
 *
 * @property array<string, mixed> $verdict
 */
class OrderLineFitment extends Model
{
    protected $primaryKey = 'order_line_id';

    protected $keyType = 'int';

    public $incrementing = false;

    /** `computed_at` is the only timestamp, and it is supplied by the engine, not by Eloquent. */
    public $timestamps = false;

    protected $fillable = [
        'order_line_id', 'vehicle_id', 'wheel_config_id', 'fitment_id',
        'approval_document_id', 'document_revision',
        'verdict', 'verdict_status', 'requires_entry',
        'pdf_sha256', 'engine_version', 'computed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'verdict' => 'array',
            'requires_entry' => 'boolean',
            'document_revision' => 'integer',
            'computed_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (): never {
            throw self::appendOnly();
        });

        static::deleting(function (): never {
            throw self::appendOnly();
        });
    }

    /**
     * Eloquent's `save()` on an existing row routes through `updating`, but `saveQuietly()` and a
     * direct query-builder update do not — those are caught by the database triggers.
     */
    private static function appendOnly(): LogicException
    {
        return new LogicException(
            'order_line_fitments is append-only: it records what the customer was shown at the '
            .'moment of purchase, and a record that can change has no evidential value.'
        );
    }

    /** @return BelongsTo<OrderLine, $this> */
    public function orderLine(): BelongsTo
    {
        return $this->belongsTo(OrderLine::class, 'order_line_id');
    }

    /**
     * The document revision this line was sold against, which may since have been superseded.
     *
     * @return BelongsTo<ApprovalDocument, $this>
     */
    public function approvalDocument(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }
}
