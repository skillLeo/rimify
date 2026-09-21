<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Approval\SupersedeChain;
use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use Carbon\CarbonImmutable;
use Database\Factories\ApprovalDocumentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

/**
 * The approval document — ABE, Teilegutachten, ECE or EC.
 *
 * Revisions supersede, never overwrite: `supersedes_id` points at the revision this one replaces,
 * and the older row stays readable so an order placed against it can still be explained.
 *
 * @property int $id
 * @property ApprovalKind $kind
 * @property DocumentStatus $status
 * @property int $revision
 * @property string|null $pdf_sha256
 * @property CarbonImmutable|null $issued_on
 * @property CarbonImmutable|null $valid_from
 * @property CarbonImmutable|null $valid_to
 * @property int|null $supersedes_id
 */
class ApprovalDocument extends Model
{
    /** @use HasFactory<ApprovalDocumentFactory> */
    use HasFactory;

    protected $fillable = [
        'kind', 'kba_number', 'approval_mark', 'report_number', 'issuer', 'issued_on',
        'revision', 'supersedes_id', 'valid_from', 'valid_to',
        'pdf_key', 'pdf_sha256', 'page_count', 'status', 'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => ApprovalKind::class,
            'status' => DocumentStatus::class,
            'issued_on' => 'immutable_date',
            'valid_from' => 'immutable_date',
            'valid_to' => 'immutable_date',
            'revision' => 'integer',
            'page_count' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // Three layers guard the supersession chain, because none of them alone is enough:
        //   1. here, so the application fails loudly and early;
        //   2. a BEFORE UPDATE trigger, which catches raw SQL the application never sees
        //      (MySQL refuses a CHECK on an AUTO_INCREMENT column, error 3818);
        //   3. SupersedeChain, which catches A → B → A — a cycle, not a self-reference.
        static::saving(function (self $document): void {
            if ($document->supersedes_id === null) {
                return;
            }

            if ($document->exists && $document->supersedes_id === $document->id) {
                throw new LogicException('Ein Dokument kann sich nicht selbst ablösen.');
            }

            if ($document->exists) {
                SupersedeChain::fromConfig()->assertLinkIsSafe($document->id, $document->supersedes_id);
            }
        });
    }

    /**
     * Published and inside its validity window. A superseded, withdrawn or draft document is
     * invisible to every customer-facing surface.
     *
     * @param  Builder<ApprovalDocument>  $query
     * @return Builder<ApprovalDocument>
     */
    public function scopeCurrentlyValid(Builder $query): Builder
    {
        $today = now()->toDateString();

        return $query
            ->where('status', DocumentStatus::Published->value)
            ->where(fn (Builder $q) => $q->whereNull('valid_from')->orWhere('valid_from', '<=', $today))
            ->where(fn (Builder $q) => $q->whereNull('valid_to')->orWhere('valid_to', '>=', $today));
    }

    /** The human-readable identifier, whichever kind of document this is. */
    public function number(): ?string
    {
        return $this->kba_number ?? $this->approval_mark ?? $this->report_number;
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supersedes_id');
    }

    /** @return HasMany<ApprovalDocument, $this> */
    public function supersededBy(): HasMany
    {
        return $this->hasMany(self::class, 'supersedes_id');
    }

    /** @return HasMany<Fitment, $this> */
    public function fitments(): HasMany
    {
        return $this->hasMany(Fitment::class);
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }
}
