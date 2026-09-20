<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Data;

use App\Support\GermanFormat;

/**
 * A sellable tyre.
 *
 * `speedRank` is the integer the filter compares; `speedSymbol` is display only. There is no
 * method here that compares symbols as letters, because H sits between U and V and letter
 * comparison is wrong in the permissive direction.
 */
final readonly class TyreRecord
{
    public function __construct(
        public int $id,
        public int $widthMm,
        public int $aspect,
        public float $diameterIn,
        public int $loadIndex,
        public string $speedSymbol,
        public int $speedRank,
        public int $priceCents,
        public int $stockQty,
        public ?string $brandName = null,
        public ?string $name = null,
        public ?string $season = null,
    ) {}

    public function size(): TyreSize
    {
        return new TyreSize($this->widthMm, $this->aspect, $this->diameterIn);
    }

    public function isInStock(): bool
    {
        return $this->stockQty > 0;
    }

    /** Does this tyre satisfy an axle's minimum? Both halves, by number, never by letter. */
    public function satisfies(?int $minLoadIndex, ?int $minSpeedRank): bool
    {
        // A null minimum is not "no minimum" — it is the engine failing to derive one, and
        // nothing may be offered against it (R-03).
        if ($minLoadIndex === null || $minSpeedRank === null) {
            return false;
        }

        return $this->loadIndex >= $minLoadIndex && $this->speedRank >= $minSpeedRank;
    }

    /** `245/45 R18 92Y` */
    public function label(): string
    {
        return GermanFormat::tyreSize(
            $this->widthMm,
            $this->aspect,
            $this->diameterIn,
            $this->loadIndex,
            $this->speedSymbol,
        );
    }
}
