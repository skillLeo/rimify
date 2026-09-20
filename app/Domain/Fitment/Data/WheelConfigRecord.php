<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Support\GermanFormat;

/**
 * The sellable unit, as the engine sees it: one model, one finish, one geometry.
 *
 * `widthIn` and `diameterIn` are floats here even though MySQL hands DECIMAL back as strings —
 * the permitted-range check is numeric, and comparing '10.00' against '9.00' as strings would
 * silently exclude a 10J wheel from a 9–11J range.
 */
final readonly class WheelConfigRecord
{
    public function __construct(
        public int $id,
        public int $wheelModelId,
        public int $wheelFinishId,
        public float $diameterIn,
        public float $widthIn,
        public int $etMm,
        public int $boltHoles,
        public float $boltCircleMm,
        public float $centreBoreMm,
        public int $priceCents,
        public int $stockQty,
        public string $sku = '',
        public ?string $modelName = null,
        public ?string $brandName = null,
        public ?string $finishNameDe = null,
    ) {}

    public function isInStock(): bool
    {
        return $this->stockQty > 0;
    }

    /** `8,5J × 18 · ET 35 · 5/112 · 66,6 mm` */
    public function label(): string
    {
        return GermanFormat::wheelLabel(
            $this->widthIn,
            $this->diameterIn,
            $this->etMm,
            $this->boltHoles,
            $this->boltCircleMm,
            $this->centreBoreMm,
        );
    }

    /** `BORBET Havanna · Graphite matt` */
    public function productLabel(): string
    {
        return trim(implode(' ', array_filter([$this->brandName, $this->modelName])))
            .($this->finishNameDe === null ? '' : ' · '.$this->finishNameDe);
    }
}
