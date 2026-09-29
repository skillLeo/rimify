<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Approval\SupersedeChain;
use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Events\ApprovalDocumentPublished;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\ApprovalDocumentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

/**
 * The approval document — ABE, Nachtrag, Teilegutachten, EG-Typgenehmigung or ECE.
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
 * @property int|null $supplement_to_id the base this Nachtrag supplements, when we hold it
 * @property string|null $supplement_to_number the base we do not hold, as the Nachtrag names it
 * @property CarbonImmutable|null $test_date
 * @property CarbonImmutable|null $revision_date
 * @property CarbonImmutable|null $valid_from_production the first day of the month a wheel must be made from
 */
class ApprovalDocument extends Model
{
    /** @use HasFactory<ApprovalDocumentFactory> */
    use HasFactory;

    protected $fillable = [
        'kind', 'kba_number', 'approval_mark', 'report_number', 'issuer', 'issued_on',
        'revision', 'supersedes_id', 'valid_from', 'valid_to',
        'supplement_to_id', 'supplement_to_number', 'annex', 'test_report_number', 'copy_number',
        'designation_number', 'test_site', 'test_date', 'revision_date', 'valid_from_production',
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
            'test_date' => 'immutable_date',
            'revision_date' => 'immutable_date',
            'valid_from_production' => 'immutable_date',
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

    /**
     * Make this revision the published one. The single entry point for a publish: every cache
     * that depends on published documents is forgotten and every subscriber whose vehicle this
     * document names is told, through the event — never by a caller that remembers to.
     */
    public function publish(?CarbonInterface $from = null): void
    {
        $this->forceFill([
            'status' => DocumentStatus::Published->value,
            'valid_from' => ($from ?? now())->toDateString(),
        ])->save();

        ApprovalDocumentPublished::dispatch($this);
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

    /**
     * The document's own Auflagenverzeichnis: the codes it prints, in the order it prints them.
     *
     * @return HasMany<DocumentCondition, $this>
     */
    public function conditions(): HasMany
    {
        return $this->hasMany(DocumentCondition::class)->orderBy('id');
    }

    /** @return BelongsTo<ApprovalDocument, $this> the base this Nachtrag supplements, when we hold it */
    public function supplementTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supplement_to_id');
    }

    /** @return HasMany<DocumentFastener, $this> */
    public function fasteners(): HasMany
    {
        return $this->hasMany(DocumentFastener::class)->orderBy('number');
    }

    /** @return HasMany<DocumentNotice, $this> */
    public function notices(): HasMany
    {
        return $this->hasMany(DocumentNotice::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The document's own table of tyre load at speed (ABE 55255, p. 6), cell by cell.
     *
     * @return HasMany<DocumentSpeedDerating, $this>
     */
    public function speedDeratings(): HasMany
    {
        return $this->hasMany(DocumentSpeedDerating::class)->orderBy('speed_kmh')->orderBy('id');
    }

    /**
     * The sentence for a Nachtrag whose base we do not hold (the corrections memo §4) — said on the
     * record, in the Abdeckung and to the customer; null for any other document.
     */
    public function baseMissingDe(): ?string
    {
        if ($this->kind !== ApprovalKind::Nachtrag || $this->supplement_to_id !== null) {
            return null;
        }

        $base = trim((string) $this->supplement_to_number);

        return 'Grundgutachten '.($base === '' ? 'dieses Nachtrags' : $base).' liegt uns nicht vor – dieser Nachtrag allein ist nicht die ganze Freigabe.';
    }

    /** `Gilt für Felgen, die ab 03/2021 gefertigt wurden.` — null when the document names no month. */
    public function productionFromDe(): ?string
    {
        return $this->valid_from_production === null ? null : 'Gilt für Felgen, die ab '.$this->valid_from_production->format('m/Y').' gefertigt wurden.';
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }
}
