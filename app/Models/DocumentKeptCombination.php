<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A row of a Gutachten's list of combinations entered before the five steps that no car on the paper carries: neither shown
 * as a line nor offered to anyone, but kept. Dropping it could leave a closed list with no row at all, which reads as no
 * list — and four of one size would be offered where none was (DocumentEntryWriter).
 *
 * @property int $id
 * @property int $approval_document_id
 * @property int|null $vehicle_id
 * @property string|null $eg_number
 * @property string|null $eg_number_norm
 * @property int $number
 * @property int $front_width_mm
 * @property int $front_aspect
 * @property float $front_diameter_in
 * @property int $rear_width_mm
 * @property int $rear_aspect
 * @property float $rear_diameter_in
 * @property int|null $source_page
 * @property bool $carried_over
 */
class DocumentKeptCombination extends Model
{
    protected $fillable = [
        'approval_document_id', 'vehicle_id', 'eg_number', 'eg_number_norm', 'number',
        'front_width_mm', 'front_aspect', 'front_diameter_in',
        'rear_width_mm', 'rear_aspect', 'rear_diameter_in',
        'source_page', 'carried_over',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'vehicle_id' => 'integer',
            'number' => 'integer',
            'front_width_mm' => 'integer',
            'front_aspect' => 'integer',
            'front_diameter_in' => 'float',
            'rear_width_mm' => 'integer',
            'rear_aspect' => 'integer',
            'rear_diameter_in' => 'float',
            'source_page' => 'integer',
            'carried_over' => 'boolean',
        ];
    }
}
