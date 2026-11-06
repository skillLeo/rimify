<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Fitment\Data\TyreSize;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One line of tyres for one car: a size in front, a size behind — the client's change of 05.11.2026: „There should only be
 * fields for tire size combinations“. A size printed for both axles is the same size on both sides. The load index and
 * speed symbol stand as the paper prints them; null is „the paper is silent“, never a guess (R-06).
 *
 * A line with one side comes only from rows entered before this flow: a size scoped to one axle.
 *
 * @property int $id
 * @property int $document_car_entry_id
 * @property int $position
 * @property int|null $front_width_mm
 * @property int|null $front_aspect
 * @property float|null $front_diameter_in
 * @property int|null $front_load_index
 * @property string|null $front_speed_symbol
 * @property string|null $front_marker
 * @property string|null $front_unread
 * @property bool $front_on_rim
 * @property int|null $rear_width_mm
 * @property int|null $rear_aspect
 * @property float|null $rear_diameter_in
 * @property int|null $rear_load_index
 * @property string|null $rear_speed_symbol
 * @property string|null $rear_marker
 * @property string|null $rear_unread
 * @property bool $rear_on_rim
 * @property int|null $kw_min
 * @property int|null $kw_max
 * @property bool $from_rows
 * @property bool|null $in_list
 * @property string|null $list_entry
 * @property int|null $list_number
 * @property int|null $list_page
 * @property bool $list_carried_over
 */
class DocumentTyreLine extends Model
{
    protected $fillable = [
        'document_car_entry_id', 'position',
        'front_width_mm', 'front_aspect', 'front_diameter_in', 'front_load_index', 'front_speed_symbol', 'front_marker', 'front_unread', 'front_on_rim',
        'rear_width_mm', 'rear_aspect', 'rear_diameter_in', 'rear_load_index', 'rear_speed_symbol', 'rear_marker', 'rear_unread', 'rear_on_rim',
        'kw_min', 'kw_max', 'from_rows', 'in_list', 'list_entry', 'list_number', 'list_page', 'list_carried_over',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'front_width_mm' => 'integer',
            'front_aspect' => 'integer',
            'front_diameter_in' => 'float',
            'front_load_index' => 'integer',
            'rear_width_mm' => 'integer',
            'rear_aspect' => 'integer',
            'rear_diameter_in' => 'float',
            'rear_load_index' => 'integer',
            'kw_min' => 'integer',
            'kw_max' => 'integer',
            'front_on_rim' => 'boolean',
            'rear_on_rim' => 'boolean',
            'from_rows' => 'boolean',
            'in_list' => 'boolean',
            'list_number' => 'integer',
            'list_page' => 'integer',
            'list_carried_over' => 'boolean',
        ];
    }

    /** @return BelongsTo<DocumentCarEntry, $this> */
    public function carEntry(): BelongsTo
    {
        return $this->belongsTo(DocumentCarEntry::class, 'document_car_entry_id');
    }

    /** @return HasMany<DocumentTyreLineCode, $this> */
    public function codes(): HasMany
    {
        return $this->hasMany(DocumentTyreLineCode::class)->orderBy('id');
    }

    public function front(): ?TyreSize
    {
        return $this->front_width_mm === null ? null : new TyreSize($this->front_width_mm, (int) $this->front_aspect, (float) $this->front_diameter_in);
    }

    public function rear(): ?TyreSize
    {
        return $this->rear_width_mm === null ? null : new TyreSize($this->rear_width_mm, (int) $this->rear_aspect, (float) $this->rear_diameter_in);
    }

    /** Whether something typed on this line does not read yet: the release waits for it. */
    public function unread(): bool
    {
        return $this->front_unread !== null || $this->rear_unread !== null;
    }
}
