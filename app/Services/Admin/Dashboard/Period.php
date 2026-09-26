<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Support\GermanFormat;
use Carbon\CarbonImmutable;

/**
 * The Übersicht's Zeitraum: whole calendar days in Europe/Berlin, today included, and the period of
 * the same length right before it — the one every „vs. Vorperiode“ is measured against.
 *
 * Days, not instants: "the last 7 days" on a Monday morning in Berlin means Tuesday to Monday there,
 * whatever the server's clock says, and a day that lost an hour to the clock change is still one day.
 */
final class Period
{
    public const PRESETS = ['7', '30', '90'];

    /** The longest own range: a year and a day, so a year compares with the year before. */
    public const MAX_DAYS = 366;

    private function __construct(
        public readonly string $key,
        public readonly CarbonImmutable $from,
        public readonly CarbonImmutable $to,
    ) {}

    public static function preset(string $key, ?CarbonImmutable $today = null): self
    {
        $today ??= CarbonImmutable::now(GermanFormat::TIMEZONE)->startOfDay();
        $days = in_array($key, self::PRESETS, true) ? (int) $key : 30;

        return new self((string) $days, $today->subDays($days - 1), $today);
    }

    /** An own range, `Y-m-d` to `Y-m-d`, both Berlin days, both included. */
    public static function between(string $from, string $to): self
    {
        $start = CarbonImmutable::createFromFormat('!Y-m-d', $from, GermanFormat::TIMEZONE);
        $end = CarbonImmutable::createFromFormat('!Y-m-d', $to, GermanFormat::TIMEZONE);

        if (! $start instanceof CarbonImmutable || ! $end instanceof CarbonImmutable || $end < $start) {
            return self::preset('30');
        }

        if ($start->diffInDays($end) + 1 > self::MAX_DAYS) {
            $start = $end->subDays(self::MAX_DAYS - 1);
        }

        return new self('eigen', $start, $end);
    }

    public function days(): int
    {
        return (int) $this->from->diffInDays($this->to) + 1;
    }

    /** The same number of days, ending the day before this one starts. */
    public function previous(): self
    {
        $end = $this->from->subDay();

        return new self($this->key, $end->subDays($this->days() - 1), $end);
    }

    /** The first instant of the period, as the UTC the tables store. */
    public function startUtc(): string
    {
        return $this->from->startOfDay()->utc()->format('Y-m-d H:i:s');
    }

    /** The first instant after the period — the next day's Berlin midnight — as UTC. */
    public function endUtc(): string
    {
        return $this->to->addDay()->startOfDay()->utc()->format('Y-m-d H:i:s');
    }

    /**
     * Every day of the period, `Y-m-d`, oldest first.
     *
     * @return list<string>
     */
    public function dayKeys(): array
    {
        $keys = [];

        for ($day = $this->from; $day <= $this->to; $day = $day->addDay()) {
            $keys[] = $day->format('Y-m-d');
        }

        return $keys;
    }

    /** `Letzte 30 Tage` or `Eigener Zeitraum`. */
    public function label(): string
    {
        return $this->key === 'eigen' ? 'Eigener Zeitraum' : "Letzte {$this->key} Tage";
    }

    /** `28.08.–26.09.2026`, or `01.12.2025–15.01.2026` across a year. */
    public function rangeLabel(): string
    {
        $sameYear = $this->from->year === $this->to->year;

        return $this->from->format($sameYear ? 'd.m.' : 'd.m.Y').GermanFormat::ENDASH.$this->to->format('d.m.Y');
    }

    /** @return array{key: string, von: string, bis: string, label: string, range: string, previousRange: string, days: int} */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'von' => $this->from->format('Y-m-d'),
            'bis' => $this->to->format('Y-m-d'),
            'label' => $this->label(),
            'range' => $this->rangeLabel(),
            'previousRange' => $this->previous()->rangeLabel(),
            'days' => $this->days(),
        ];
    }
}
