<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Axle;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use Carbon\CarbonImmutable;
use Database\Factories\FitmentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One row per legally distinct combination: this document permits this wheel configuration on
 * this vehicle variant, within this build window, in these width and offset ranges, subject to
 * these conditions, requiring entry — yes or no.
 *
 * No SoftDeletes and no global scopes: compliance rows must never be hidden by a default the
 * reader cannot see.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property Axle $axle
 * @property FitmentStatus $status
 * @property bool $requires_entry derived from the codes (or overridden) — written by FitmentRows, never typed
 * @property string|null $entry_override required | not_required, against the derived value
 * @property string|null $entry_override_reason
 * @property int|null $entry_override_by
 * @property CarbonImmutable|null $entry_override_at
 * @property CarbonImmutable|null $build_from
 * @property CarbonImmutable|null $build_to
 * @property float|null $permitted_width_min
 * @property float|null $permitted_width_max
 * @property int|null $permitted_et_min
 * @property int|null $permitted_et_max
 * @property float|null $centre_bore_mm the bore this document states for THIS vehicle; NULL = none stated
 * @property int $vehicle_id
 * @property int $wheel_config_id
 * @property int|null $source_page
 * @property string|null $entry_note_de
 */
class Fitment extends Model
{
    /** @use HasFactory<FitmentFactory> */
    use HasFactory;

    protected $fillable = [
        'approval_document_id', 'vehicle_id', 'wheel_config_id', 'axle',
        'build_from', 'build_to',
        'permitted_width_min', 'permitted_width_max', 'permitted_et_min', 'permitted_et_max',
        'centre_bore_mm',
        'requires_entry', 'entry_note_de', 'source_page', 'status', 'created_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'axle' => Axle::class,
            'status' => FitmentStatus::class,
            'build_from' => 'immutable_date',
            'build_to' => 'immutable_date',
            'permitted_width_min' => 'float',
            'permitted_width_max' => 'float',
            'permitted_et_min' => 'integer',
            'permitted_et_max' => 'integer',
            // MySQL hands DECIMAL back as a string; the engine compares bores as numbers.
            'centre_bore_mm' => 'float',
            'requires_entry' => 'boolean',
            'source_page' => 'integer',
            'entry_override_at' => 'immutable_datetime',
        ];
    }

    /**
     * Published rows of published, currently valid documents — the only rows a customer may ever
     * be shown. Written as an explicit scope rather than a global scope so that the admin panel
     * can see everything without fighting a hidden default.
     *
     * @param  Builder<Fitment>  $query
     * @return Builder<Fitment>
     */
    public function scopeVisibleToCustomers(Builder $query): Builder
    {
        return $query
            ->where('fitments.status', FitmentStatus::Published->value)
            ->whereHas('approvalDocument', function (Builder $document): void {
                $document
                    ->where('status', DocumentStatus::Published->value)
                    ->where(function (Builder $validity): void {
                        $validity->whereNull('valid_to')->orWhere('valid_to', '>=', now()->toDateString());
                    })
                    ->where(function (Builder $validity): void {
                        $validity->whereNull('valid_from')->orWhere('valid_from', '<=', now()->toDateString());
                    });
            });
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function approvalDocument(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class);
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /** @return BelongsTo<WheelConfig, $this> */
    public function wheelConfig(): BelongsTo
    {
        return $this->belongsTo(WheelConfig::class);
    }

    /**
     * In the order they were entered, as the verdict names them — never the order a database plan happens to give, so a
     * verdict is the same answer every time (LevelsChangeNoAnswerTest on MySQL, 24.10.2026).
     *
     * @return HasMany<FitmentTyreSize, $this>
     */
    public function tyreSizes(): HasMany
    {
        return $this->hasMany(FitmentTyreSize::class)->orderBy('id');
    }

    /**
     * The codes on the row, as the document prints them; their sentences are the document's own
     * (DocumentCondition), read through `approvalDocument.conditions`.
     *
     * @return HasMany<FitmentCondition, $this>
     */
    public function conditionCodes(): HasMany
    {
        return $this->hasMany(FitmentCondition::class)->orderBy('code');
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function entryOverrideBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'entry_override_by');
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }
}
