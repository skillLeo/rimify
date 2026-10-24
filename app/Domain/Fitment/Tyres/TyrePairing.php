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
        /**
         * The row of the document's own list it was entered as (`document_tyre_combinations.id`, D-256) — what an order
         * line freezes as the combination it was sold in (D-335). Null for a pair read from an Auflage's sentence.
         */
        public ?int $id = null,
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

    /** The same size front and rear: Kombination 1 of BBS's Anlage BMW15, 225/40 R18 on both axles. */
    public function sameSize(): bool
    {
        return $this->front->matches($this->rear);
    }
}
