<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Verdict\Condition;

/**
 * One front/rear pair a Gutachten's combination table permits (#20, D-105): `Nr. 8: 235/45R19 – 255/40R19`
 * is two pairs, 235/45 front with 255/40 rear and 235/45 front with 265/40 rear — never the other way round.
 */
final readonly class TyrePairing
{
    /**
     * @param  list<Condition>  $conditions  the combination's own Auflagen (D-451)
     * @param  list<RowFilter>  $filters  a body-form or drive code typed beside the combination: it narrows the combination
     */
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
        /**
         * The Auflagen typed beside this combination in step 4 (the client's review of 11.11, A; D-451): they apply to it alone,
         * on both its axles — never to another combination that shares one of its sizes.
         */
        public array $conditions = [],
        public array $filters = [],
    ) {}

    /**
     * Whether the combination may be offered to this car: every code that narrows it admits the car. One it cannot place — the
     * car's body form or drive unknown — keeps it out (fails closed); the other combinations stand.
     */
    public function admits(VehicleRecord $vehicle): bool
    {
        return $this->filters === [] || RowFilter::admitAll($this->filters, $vehicle) === true;
    }

    /** The same pair, its Auflagen joined with another's for the same pair: two documents' lists read together, toward caution. */
    public function joinedWith(self $other): self
    {
        return new self($this->number, $this->front, $this->rear, $this->id, Condition::union($this->conditions, $other->conditions), [...$this->filters, ...$other->filters]);
    }

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
