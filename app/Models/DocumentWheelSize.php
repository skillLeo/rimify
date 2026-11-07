<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A version of the wheel a Gutachten covers: a dimension of its one wheel model (the client's answer: one paper is for one
 * specific wheel), which stands in the paper's wheel combinations. Every colour of that dimension inherits what is entered below
 * it — colour plays no part in an approval.
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
 */
class DocumentWheelSize extends Model
{
    /** The columns that make a dimension — a row of `wheel_configs` less its colour. */
    public const DIMENSION = ['wheel_model_id', 'diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'];

    protected $fillable = ['approval_document_id', ...self::DIMENSION];

    /**
     * A dimension as one string, however the driver hands the numbers back: what tells two rows of the catalogue are one version.
     *
     * @param  array<string, mixed>  $attributes
     */
    public static function keyOf(array $attributes): string
    {
        return implode('|', array_map(static fn (string $column): string => number_format((float) ($attributes[$column] ?? 0), 2, '.', ''), self::DIMENSION));
    }

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
