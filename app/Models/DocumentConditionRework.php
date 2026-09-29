<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\GermanFormat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The millimetres of a „Nacharbeit mit Maßen“ code (the corrections memo §4, `auflage_nacharbeit`): for a
 * vehicle type and an axle, where the arch rework begins and ends and how far it is flared — the figures a
 * workshop needs, as the document states them.
 *
 * @property int $id
 * @property int $document_condition_id
 * @property string $vehicle_type
 * @property string $axle
 * @property float|null $from_mm
 * @property float|null $to_mm
 * @property float|null $flare_mm
 * @property string|null $note_de
 */
class DocumentConditionRework extends Model
{
    protected $fillable = ['document_condition_id', 'vehicle_type', 'axle', 'from_mm', 'to_mm', 'flare_mm', 'note_de'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'from_mm' => 'float',
            'to_mm' => 'float',
            'flare_mm' => 'float',
        ];
    }

    /** @return BelongsTo<DocumentCondition, $this> */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(DocumentCondition::class, 'document_condition_id');
    }

    /** `von 15 bis 30 mm · aufgeweitet um 5 mm`, the German way (R-10): the unit never breaks from its number. */
    public function measureDe(): string
    {
        $mm = static fn (float $v): string => GermanFormat::trimmedDecimal($v, 1).GermanFormat::NBSP.'mm';
        $parts = [];

        if ($this->from_mm !== null || $this->to_mm !== null) {
            $parts[] = trim(($this->from_mm === null ? '' : 'von '.($this->to_mm === null ? $mm($this->from_mm) : GermanFormat::trimmedDecimal($this->from_mm, 1)).' ')
                .($this->to_mm === null ? '' : 'bis '.$mm($this->to_mm)));
        }

        if ($this->flare_mm !== null) {
            $parts[] = 'aufgeweitet um '.$mm($this->flare_mm);
        }

        return implode(' · ', $parts);
    }
}
