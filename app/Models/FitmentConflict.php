<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ConflictKind;
use App\Enums\ConflictStatus;
use Database\Factories\FitmentConflictFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An unresolved disagreement between two documents, stored as a row with a status so it appears
 * on the dashboard until someone deals with it — never a toast that scrolls away.
 *
 * @property ConflictKind $kind
 * @property ConflictStatus $status
 * @property array<string, mixed> $detail
 */
class FitmentConflict extends Model
{
    /** @use HasFactory<FitmentConflictFactory> */
    use HasFactory;

    protected $fillable = [
        'kind', 'status', 'vehicle_id', 'wheel_config_id',
        'candidate_fitment_id', 'existing_fitment_id', 'detail', 'blocking',
        'detected_by', 'resolved_by', 'resolved_at', 'resolution_note',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => ConflictKind::class,
            'status' => ConflictStatus::class,
            'detail' => 'array',
            'blocking' => 'boolean',
            'resolved_at' => 'immutable_datetime',
        ];
    }

    /**
     * @param  Builder<FitmentConflict>  $query
     * @return Builder<FitmentConflict>
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', ConflictStatus::Open->value);
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

    /** @return BelongsTo<Fitment, $this> */
    public function existingFitment(): BelongsTo
    {
        return $this->belongsTo(Fitment::class, 'existing_fitment_id');
    }

    /** @return BelongsTo<Fitment, $this> */
    public function candidateFitment(): BelongsTo
    {
        return $this->belongsTo(Fitment::class, 'candidate_fitment_id');
    }
}
