<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Support;

use DateTimeImmutable;
use DateTimeInterface;
use InvalidArgumentException;

/**
 * An open-ended date window: the PHP twin of what `build_from` / `build_to` mean in the database.
 *
 * NULL on either side is UNBOUNDED on that side. A null end means the model is still in
 * production — it does not mean "ends today", and coercing it to today silently expires every car
 * still being built (R-02).
 *
 * Overlap lives here and in `RangeSql`, and nowhere else. A second hand-written copy that gets one
 * NULL branch wrong is the single most likely defect this design can produce, so both are tested
 * against all nine NULL combinations and against each other.
 */
final readonly class BuildWindow
{
    public function __construct(
        public ?DateTimeImmutable $from = null,
        public ?DateTimeImmutable $to = null,
    ) {
        if ($from !== null && $to !== null && $from > $to) {
            throw new InvalidArgumentException(sprintf(
                'A build window cannot end before it starts: [%s] to [%s].',
                $from->format('Y-m-d'),
                $to->format('Y-m-d'),
            ));
        }
    }

    /** Both sides unbounded: the document does not scope the fitment by build window at all. */
    public static function unbounded(): self
    {
        return new self;
    }

    public static function fromDates(?DateTimeInterface $from, ?DateTimeInterface $to): self
    {
        return new self(
            $from === null ? null : DateTimeImmutable::createFromInterface($from),
            $to === null ? null : DateTimeImmutable::createFromInterface($to),
        );
    }

    /**
     * Do two windows share at least one day?
     *
     * Each null bound removes one of the two comparisons, which is exactly why the null branches
     * must be written once: `a.from <= b.to AND b.from <= a.to`, with an unbounded side making
     * its comparison vacuously true.
     */
    public function overlaps(self $other): bool
    {
        $startsBeforeOtherEnds = $this->from === null || $other->to === null || $this->from <= $other->to;
        $otherStartsBeforeThisEnds = $other->from === null || $this->to === null || $other->from <= $this->to;

        return $startsBeforeOtherEnds && $otherStartsBeforeThisEnds;
    }

    public function contains(DateTimeInterface $date): bool
    {
        $moment = DateTimeImmutable::createFromInterface($date);

        return ($this->from === null || $this->from <= $moment)
            && ($this->to === null || $this->to >= $moment);
    }

    /** Still in production: no end at all. */
    public function isOpenEnded(): bool
    {
        return $this->to === null;
    }

    public function isUnbounded(): bool
    {
        return $this->from === null && $this->to === null;
    }

    /** `03/2018–11/2019` · `12/2019–heute` — the customer-facing form. */
    public function labelDe(): string
    {
        if ($this->from === null && $this->to === null) {
            return 'Bauzeitraum unbekannt';
        }

        if ($this->from === null) {
            // Both-null is handled above, so `to` is non-null here.
            return 'bis '.$this->to->format('m/Y');
        }

        return $this->from->format('m/Y')."\u{2013}".($this->to?->format('m/Y') ?? 'heute');
    }
}
