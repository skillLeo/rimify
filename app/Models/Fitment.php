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
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
 * @property Axle $axle
 * @property FitmentStatus $status
 * @property bool $requires_entry
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

    /** @return HasMany<FitmentTyreSize, $this> */
    public function tyreSizes(): HasMany
    {
        return $this->hasMany(FitmentTyreSize::class);
    }

    /** @return BelongsToMany<ConditionCode, $this> */
    public function conditions(): BelongsToMany
    {
        return $this->belongsToMany(ConditionCode::class, 'fitment_conditions')
            ->withPivot('note_de')
            ->withTimestamps();
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }
}
