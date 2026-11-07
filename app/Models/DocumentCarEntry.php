<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * One car on one of a Gutachten's wheel combinations, as staff ticked it: its lines of tyres, the general codes of its row, its page.
 * Nothing stands for a group of cars — the client's change of 05.11.2026: „All groupings should be removed“ — and nothing
 * joins by itself later.
 *
 * `wheel_config_id` and `axle` are set only on rows entered before this flow (one colour alone, one axle alone); a new
 * entry leaves them at every colour and both axles.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property int $document_wheel_combination_id
 * @property int $vehicle_id
 * @property int|null $wheel_config_id
 * @property string $axle
 * @property int|null $source_page
 * @property Carbon|null $build_from
 * @property Carbon|null $build_to
 * @property float|null $permitted_width_min
 * @property float|null $permitted_width_max
 * @property int|null $permitted_et_min
 * @property int|null $permitted_et_max
 * @property float|null $centre_bore_mm
 * @property string|null $entry_note_de
 * @property string|null $entry_override
 * @property string|null $entry_override_reason
 * @property int|null $entry_override_by
 * @property Carbon|null $entry_override_at
 * @property int|null $copied_from_id
 * @property int $position
 */
class DocumentCarEntry extends Model
{
    protected $fillable = [
        'approval_document_id', 'document_wheel_combination_id', 'vehicle_id', 'wheel_config_id', 'axle', 'source_page',
        'build_from', 'build_to', 'permitted_width_min', 'permitted_width_max', 'permitted_et_min', 'permitted_et_max',
        'centre_bore_mm', 'entry_note_de', 'entry_override', 'entry_override_reason', 'entry_override_by', 'entry_override_at',
        'copied_from_id', 'position',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'source_page' => 'integer',
            'build_from' => 'date',
            'build_to' => 'date',
            'permitted_width_min' => 'float',
            'permitted_width_max' => 'float',
            'permitted_et_min' => 'integer',
            'permitted_et_max' => 'integer',
            'centre_bore_mm' => 'float',
            'entry_override_at' => 'datetime',
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }

    /** @return BelongsTo<DocumentWheelCombination, $this> */
    public function combination(): BelongsTo
    {
        return $this->belongsTo(DocumentWheelCombination::class, 'document_wheel_combination_id');
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class)->withTrashed();
    }

    /** @return BelongsTo<WheelConfig, $this> */
    public function wheelConfig(): BelongsTo
    {
        return $this->belongsTo(WheelConfig::class)->withTrashed();
    }

    /** @return BelongsTo<self, $this> */
    public function copiedFrom(): BelongsTo
    {
        return $this->belongsTo(self::class, 'copied_from_id');
    }

    /** @return HasMany<DocumentTyreLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(DocumentTyreLine::class)->orderBy('position')->orderBy('id');
    }

    /** @return HasMany<DocumentCarEntryCode, $this> */
    public function codes(): HasMany
    {
        return $this->hasMany(DocumentCarEntryCode::class)->orderBy('id');
    }
}
