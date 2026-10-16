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
 * @property bool|null $papers_correction_required § 15 FZV: false = no correction of the papers; null = not said
 * @property string|null $missing_annexes the Anlagen or ranges of its Verwendungsbereich we do not hold („1–15“)
 * @property string|null $completeness complete | partial | unknown, asserted at release; null = not answered (D-227)
 * @property int|null $completeness_by
 * @property CarbonImmutable|null $completeness_at
 * @property int|null $completeness_revision
 * @property int|null $counted_codes Auflagen codes its Verwendungsbereich prints for the vehicles entered (ADMIN-GEFUNDEN 511)
 * @property int|null $counted_codes_page
 * @property int|null $counted_sizes tyre sizes it names for them
 * @property int|null $counted_sizes_page
 * @property int|null $counted_axle_limit_kg the axle-load limit it names; null once counted = none
 * @property int|null $counted_axle_limit_page
 * @property string|null $counted_abnahme all | some | none
 * @property int|null $counted_abnahme_page
 * @property bool $counted_before_entry the count was taken while the document had no row
 * @property int|null $counted_by
 * @property CarbonImmutable|null $counted_at
 */
class ApprovalDocument extends Model
{
    /** @use HasFactory<ApprovalDocumentFactory> */
    use HasFactory;

    /** Every Anlage and every vehicle of the document is entered: only then is a car its rows do not name refused (D-227). */
    public const COMPLETE = 'complete';

    /** These Anlagen or ranges are missing — said in `missing_annexes`. */
    public const PARTIAL = 'partial';

    /** Nobody can say. */
    public const UNKNOWN = 'unknown';

    public const COMPLETENESS = [self::COMPLETE, self::PARTIAL, self::UNKNOWN];

    protected $fillable = [
        'kind', 'kba_number', 'approval_mark', 'report_number', 'issuer', 'issued_on',
        'revision', 'supersedes_id', 'valid_from', 'valid_to',
        'supplement_to_id', 'supplement_to_number', 'annex', 'test_report_number', 'copy_number',
        'designation_number', 'test_site', 'test_date', 'revision_date', 'valid_from_production',
        'papers_correction_required', 'missing_annexes',
        'completeness', 'completeness_by', 'completeness_at', 'completeness_revision',
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
            'papers_correction_required' => 'boolean',
            'completeness_at' => 'immutable_datetime',
            'completeness_revision' => 'integer',
            'counted_codes' => 'integer',
            'counted_codes_page' => 'integer',
            'counted_sizes' => 'integer',
            'counted_sizes_page' => 'integer',
            'counted_axle_limit_kg' => 'integer',
            'counted_axle_limit_page' => 'integer',
            'counted_abnahme_page' => 'integer',
            'counted_before_entry' => 'boolean',
            'counted_at' => 'immutable_datetime',
        ];
    }

    /** Whether its Verwendungsbereich has been counted from the PDF (ADMIN-GEFUNDEN 511). */
    public function isCounted(): bool
    {
        return $this->counted_at !== null;
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
     * The document's own „Bereifungskombinationen“, in its numbering (D-256): where there are any, the only tyres the shop
     * offers on it.
     *
     * @return HasMany<DocumentTyreCombination, $this>
     */
    public function tyreCombinations(): HasMany
    {
        return $this->hasMany(DocumentTyreCombination::class)->orderBy('number')->orderBy('id');
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

    /**
     * Whether the papers must be corrected (§ 15 FZV), as this document says — or, for a Nachtrag that says nothing of
     * its own, as the base it supplements says: the ABE's point 10 covers every combination its Verwendungsbereich
     * approves, the Nachtrag's included. A base counts only once a person has released it: a draft's facts, not yet
     * checked against its PDF, never reach a customer. Null when nothing released says anything: nothing is claimed.
     */
    public function papersCorrectionRequired(): ?bool
    {
        if ($this->papers_correction_required !== null) {
            return (bool) $this->papers_correction_required;
        }

        $base = $this->kind === ApprovalKind::Nachtrag ? $this->supplementTo : null;

        if ($base === null || $base->status !== DocumentStatus::Published || $base->papers_correction_required === null) {
            return null;
        }

        return (bool) $base->papers_correction_required;
    }

    /**
     * `Verwendungsbereich unvollständig – Anlagen 1–15 liegen nicht vor.` — for the record and the Abdeckung; null
     * while every Anlage is held.
     */
    public function scopeIncompleteDe(): ?string
    {
        $missing = $this->missingAnnexesDe();

        return $missing === null ? null : 'Verwendungsbereich unvollständig – '.$missing.' liegen nicht vor.';
    }

    /**
     * What is missing, said one way everywhere: „Anlagen 1–15“ for the range as the document prints it („1–15“), and
     * whatever someone wrote in words („Anlagen 1–15“, „Anlage BMW15“) as written. Null when nothing is named.
     */
    public function missingAnnexesDe(): ?string
    {
        $missing = trim((string) $this->missing_annexes);

        return match (true) {
            $missing === '' => null,
            preg_match('/^\d/', $missing) === 1 => 'Anlagen '.$missing,
            default => $missing,
        };
    }

    /**
     * The answer to „Sind alle Anlagen und alle Fahrzeuge erfasst?“, in the admin's words (D-227) — „nicht beantwortet“
     * while nobody has answered, which the shop reads as partial.
     */
    public function completenessDe(): string
    {
        $missing = $this->missingAnnexesDe();

        return match ($this->completeness) {
            self::COMPLETE => 'Alle Anlagen und alle Fahrzeuge erfasst',
            self::PARTIAL => 'Teilweise erfasst'.($missing === null ? '' : ' – es fehlen: '.$missing),
            self::UNKNOWN => 'Nicht bekannt, ob alles erfasst ist',
            default => 'Nicht beantwortet – der Shop liest es als teilweise erfasst',
        };
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
