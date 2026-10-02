<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreSize;

/**
 * One front/rear pair a Gutachten's combination table permits (#20, D-105): `Nr. 8: 235/45R19 – 255/40R19`
 * is two pairs, 235/45 front with 255/40 rear and 235/45 front with 265/40 rear — never the other way round.
 */
final readonly class TyrePairing
{
    public function __construct(
        /** The entry's number as the document prints it (`Nr. 8`). */
        public int $number,
        public TyreSize $front,
        public TyreSize $rear,
    ) {}

    /** `235/45/19|255/40/19` — the pair's identity, front first. */
    public function key(): string
    {
        return self::keyOf($this->front->key(), $this->rear->key());
    }

    public static function keyOf(string $frontKey, string $rearKey): string
    {
        return $frontKey.'|'.$rearKey;
    }
}
