<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use Carbon\CarbonImmutable;
use Spatie\Holidays\Countries\Germany;
use Spatie\Holidays\Holidays;

/**
 * Whether the service hours are running right now, and when they next start.
 *
 * Computed in Europe/Berlin from the hours in config/rimify.php and the public holidays of the
 * state the office is in. Contact is by e-mail, so the line speaks of the Servicezeit — the hours
 * in which the mailbox is looked after — and never of someone picking up, and it promises no reply
 * time.
 *
 * The state is not confirmed yet (`rimify.service.region` is null). A holiday is then only known
 * to close the office when it is a holiday everywhere in Germany. On a day that is a holiday in
 * any single state the office may be open or closed, so the line makes no live claim at all and
 * shows the hours instead: it may be silent, never confidently wrong.
 */
final readonly class ServiceStatus
{
    private const DAYS = [
        1 => 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
    ];

    /**
     * @return array{open: bool, label: string, until: string}
     */
    public function now(?CarbonImmutable $at = null): array
    {
        $timezone = (string) config('rimify.service.timezone', 'Europe/Berlin');
        $now = ($at ?? CarbonImmutable::now())->setTimezone($timezone);

        if ($this->unsure($now)) {
            return $this->hoursOnly($now);
        }

        [$from, $to] = $this->hoursOf($now);

        if ($from !== null && $to !== null && $now->greaterThanOrEqualTo($from) && $now->lessThan($to)) {
            return [
                'open' => true,
                'label' => 'Servicezeit – heute bis '.$this->clock($to).' Uhr',
                'until' => $to->toIso8601String(),
            ];
        }

        // The next opening, at most two weeks out — beyond that the configuration is wrong.
        for ($offset = 0; $offset < 14; $offset++) {
            $day = $now->addDays($offset);

            // A day the office may or may not be open ends the search: naming the day after it
            // could skip an opening, and naming it could promise one that is not there.
            if ($this->unsure($day)) {
                return $this->hoursOnly($now);
            }

            [$open] = $this->hoursOf($day);

            if ($open === null || $open->lessThanOrEqualTo($now)) {
                continue;
            }

            return [
                'open' => false,
                'label' => 'Nächste Servicezeit: '.$this->when($now, $open).' ab '.$this->clock($open).' Uhr',
                'until' => $open->toIso8601String(),
            ];
        }

        return $this->hoursOnly($now);
    }

    /**
     * The opening window of a day, or nulls when the office is certainly closed that day.
     *
     * @return array{0: CarbonImmutable|null, 1: CarbonImmutable|null}
     */
    private function hoursOf(CarbonImmutable $day): array
    {
        /** @var list<int> $weekdays */
        $weekdays = config('rimify.service.weekdays', [1, 2, 3, 4, 5]);

        if (! in_array($day->dayOfWeekIso, $weekdays, true) || $this->isHoliday($day)) {
            return [null, null];
        }

        [$fromH, $fromM] = $this->parts((string) config('rimify.service.from', '09:00'));
        [$toH, $toM] = $this->parts((string) config('rimify.service.to', '17:00'));

        return [$day->setTime($fromH, $fromM), $day->setTime($toH, $toM)];
    }

    /** A holiday of the configured state, or — with no state configured — a nationwide one. */
    private function isHoliday(CarbonImmutable $day): bool
    {
        return Holidays::for('de', year: $day->year, region: $this->region())->isHoliday($day);
    }

    /**
     * Whether the office's state decides this day: no state is configured, and the day is a
     * working day that is a public holiday in at least one German state.
     */
    private function unsure(CarbonImmutable $day): bool
    {
        if ($this->region() !== null) {
            return false;
        }

        /** @var list<int> $weekdays */
        $weekdays = config('rimify.service.weekdays', [1, 2, 3, 4, 5]);

        if (! in_array($day->dayOfWeekIso, $weekdays, true)) {
            return false;
        }

        return isset($this->anyStateHolidays($day->year)[$day->format('Y-m-d')]);
    }

    /**
     * Every date that is a public holiday in at least one of the sixteen states, once per year and
     * process: the status line is part of every page's shared props.
     *
     * @return array<string, true>
     */
    private function anyStateHolidays(int $year): array
    {
        /** @var array<int, array<string, true>> $cache */
        static $cache = [];

        if (! isset($cache[$year])) {
            $dates = [];

            foreach (Germany::regions() as $state) {
                foreach (Holidays::for('de', year: $year, region: $state)->get() as $holiday) {
                    $dates[$holiday->date->format('Y-m-d')] = true;
                }
            }

            $cache[$year] = $dates;
        }

        return $cache[$year];
    }

    /**
     * No live claim: the hours as the client gave them.
     *
     * @return array{open: bool, label: string, until: string}
     */
    private function hoursOnly(CarbonImmutable $now): array
    {
        return [
            'open' => false,
            'label' => 'Servicezeiten: '.(string) config('rimify.contact.hours', 'Mo–Fr 9:00–17:00 Uhr'),
            'until' => $now->toIso8601String(),
        ];
    }

    /** The configured state, or null — also for a value that names no German state (a typo fails closed). */
    private function region(): ?string
    {
        $region = config('rimify.service.region');

        return is_string($region) && in_array($region, Germany::regions(), true) ? $region : null;
    }

    /** "heute" only before the day's opening; "morgen", then the weekday. */
    private function when(CarbonImmutable $now, CarbonImmutable $open): string
    {
        if ($open->isSameDay($now)) {
            return 'heute';
        }

        if ($open->isSameDay($now->addDay())) {
            return 'morgen';
        }

        return self::DAYS[$open->dayOfWeekIso];
    }

    private function clock(CarbonImmutable $time): string
    {
        return $time->format('G:i');
    }

    /** @return array{0: int, 1: int} */
    private function parts(string $clock): array
    {
        [$h, $m] = array_pad(explode(':', $clock, 2), 2, '0');

        return [max(0, min(23, (int) $h)), max(0, min(59, (int) $m))];
    }
}
