<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Support;

use DateTimeImmutable;

/**
 * A car's build period as its record states it (D-516): the start's year and month, the end's year and month. A month the
 * record does not know is null — never a December or a January put in its place. An end without a year is a car still
 * built (R-02).
 *
 * Two windows follow from it, and only these two:
 *
 *   - **certain**: from the latest the car can have started to the earliest it can have ended. A Gutachten row whose window
 *     overlaps this one applies whatever the unknown months are — what `build_from` / `build_to` hold, and what every
 *     comparison in SQL and in the resolver reads. Inside one year with unknown months it can be empty (start after end):
 *     then nothing about the months is certain, and no window but an open one overlaps it for sure.
 *   - **possible**: from the earliest start to the latest end. A row that overlaps this one but not the certain one depends
 *     on the month the record does not know — the answer is „Noch nicht bestätigt“, never a yes and never a no
 *     (FitmentResolver, the governing rule).
 */
final readonly class BuildPeriod
{
    public function __construct(
        public ?int $fromYear,
        public ?int $fromMonth,
        public ?int $toYear,
        public ?int $toMonth,
    ) {}

    /** Read from the two stored dates alone, months known — a car typed by hand or from a Gutachten. */
    public static function fromDates(?DateTimeImmutable $from, ?DateTimeImmutable $to): self
    {
        return new self(
            $from === null ? null : (int) $from->format('Y'),
            $from === null ? null : (int) $from->format('n'),
            $to === null ? null : (int) $to->format('Y'),
            $to === null ? null : (int) $to->format('n'),
        );
    }

    /** Whether a month the record does not know can change which Gutachten rows reach the car. */
    public function hasUnknownMonth(): bool
    {
        return ($this->fromYear !== null && $this->fromMonth === null) || ($this->toYear !== null && $this->toMonth === null);
    }

    /** The latest day the car can have started: its month's first day, or December's where the month is unknown. */
    public function certainFrom(): ?DateTimeImmutable
    {
        return $this->fromYear === null ? null : self::first($this->fromYear, $this->fromMonth ?? 12);
    }

    /** The earliest day the car can have ended: its month's last day, or January's where the month is unknown. Null: still built. */
    public function certainTo(): ?DateTimeImmutable
    {
        return $this->toYear === null ? null : self::last($this->toYear, $this->toMonth ?? 1);
    }

    /** The earliest day the car can have started. */
    public function possibleFrom(): ?DateTimeImmutable
    {
        return $this->fromYear === null ? null : self::first($this->fromYear, $this->fromMonth ?? 1);
    }

    /** The latest day the car can have ended. Null: still built. */
    public function possibleTo(): ?DateTimeImmutable
    {
        return $this->toYear === null ? null : self::last($this->toYear, $this->toMonth ?? 12);
    }

    /** The certain window as BuildWindow reads it — possibly empty (start after end), see the class note. */
    public function certainWindow(): BuildWindow
    {
        return BuildWindow::core($this->certainFrom(), $this->certainTo());
    }

    public function possibleWindow(): BuildWindow
    {
        return new BuildWindow($this->possibleFrom(), $this->possibleTo());
    }

    /**
     * `12/1999 – 01/2004`, `1999 – 2004`, `1999 – 01/2004`, `seit 10/2020`, `seit 2020`, `bis 01/2004`: what the record knows,
     * and not a digit more.
     */
    public function label(): string
    {
        $start = self::part($this->fromYear, $this->fromMonth);
        $end = self::part($this->toYear, $this->toMonth);

        return match (true) {
            $start === null && $end === null => 'Bauzeitraum unbekannt',
            $start === null => 'bis '.$end,
            $end === null => 'seit '.$start,
            default => $start."\u{00A0}\u{2013} ".$end,
        };
    }

    /** `10/2020`, or `2020` where the month is unknown. */
    public static function part(?int $year, ?int $month): ?string
    {
        if ($year === null) {
            return null;
        }

        return $month === null ? (string) $year : sprintf('%02d/%04d', $month, $year);
    }

    private static function first(int $year, int $month): DateTimeImmutable
    {
        return new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month));
    }

    private static function last(int $year, int $month): DateTimeImmutable
    {
        return self::first($year, $month)->modify('last day of this month');
    }
}
