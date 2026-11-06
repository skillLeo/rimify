<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The wheel size a Gutachten covers (the client's answer: one paper is one wheel in one size): a dimension of one wheel
 * model. Every colour of that dimension inherits what is entered below it — colour plays no part in an approval.
 *
 * `printed_*` is what the paper itself prints for the wheel, typed by staff and only ever compared with the size they
 * chose, for a warning.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property int $wheel_model_id
 * @property float $diameter_in
 * @property float $width_in
 * @property int $et_mm
 * @property int $bolt_holes
 * @property float $bolt_circle_mm
 * @property float $centre_bore_mm
 * @property string|null $printed_type
 * @property float|null $printed_width_in
 * @property float|null $printed_diameter_in
 * @property int|null $printed_et_mm
 * @property int|null $printed_bolt_holes
 * @property float|null $printed_bolt_circle_mm
 */
class DocumentWheelSize extends Model
{
    /** The columns that make a dimension — a row of `wheel_configs` less its colour. */
    public const DIMENSION = ['wheel_model_id', 'diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'];

    protected $fillable = [
        'approval_document_id', ...self::DIMENSION,
        'printed_type', 'printed_width_in', 'printed_diameter_in', 'printed_et_mm', 'printed_bolt_holes', 'printed_bolt_circle_mm',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'diameter_in' => 'float',
            'width_in' => 'float',
            'et_mm' => 'integer',
            'bolt_holes' => 'integer',
            'bolt_circle_mm' => 'float',
            'centre_bore_mm' => 'float',
            'printed_width_in' => 'float',
            'printed_diameter_in' => 'float',
            'printed_et_mm' => 'integer',
            'printed_bolt_holes' => 'integer',
            'printed_bolt_circle_mm' => 'float',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }

    /** @return BelongsTo<WheelModel, $this> */
    public function wheelModel(): BelongsTo
    {
        return $this->belongsTo(WheelModel::class);
    }

    /** @return HasMany<DocumentCarEntry, $this> */
    public function carEntries(): HasMany
    {
        return $this->hasMany(DocumentCarEntry::class)->orderBy('position')->orderBy('id');
    }

    /**
     * Every live colour of this dimension, by the same columns the dimension is made of.
     *
     * @return Builder<WheelConfig>
     */
    public function configs(): Builder
    {
        $query = WheelConfig::query();

        foreach (self::DIMENSION as $column) {
            $query->where($column, $this->getAttribute($column));
        }

        return $query;
    }
}
