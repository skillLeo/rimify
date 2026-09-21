<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use Carbon\CarbonImmutable;
use Spatie\Holidays\Holidays;

/**
 * Whether someone answers the phone right now, and when they next will.
 *
 * Computed in Europe/Berlin from the hours in config/rimify.php and the public holidays of the
 * state the office is in — a line saying "Jetzt erreichbar" on Fronleichnam would be the kind of
 * small untruth that makes every other line on the page less believable.
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

        [$from, $to] = $this->hoursOf($now);

        if ($from !== null && $to !== null && $now->greaterThanOrEqualTo($from) && $now->lessThan($to)) {
            return [
                'open' => true,
                'label' => 'Jetzt erreichbar – bis '.$this->clock($to).' Uhr',
                'until' => $to->toIso8601String(),
            ];
        }

        // The next opening, at most two weeks out — beyond that the configuration is wrong.
        for ($offset = 0; $offset < 14; $offset++) {
            $day = $now->addDays($offset);
            [$open] = $this->hoursOf($day);

            if ($open === null || $open->lessThanOrEqualTo($now)) {
                continue;
            }

            return [
                'open' => false,
                'label' => 'Wieder erreichbar ab '.$this->when($now, $open).', '.$this->clock($open).' Uhr',
                'until' => $open->toIso8601String(),
            ];
        }

        return ['open' => false, 'label' => 'Derzeit nicht erreichbar', 'until' => $now->toIso8601String()];
    }

    /**
     * The opening window of a day, or nulls when the office is closed that day.
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
        [$toH, $toM] = $this->parts((string) config('rimify.service.to', '18:00'));

        return [$day->setTime($fromH, $fromM), $day->setTime($toH, $toM)];
    }

    private function isHoliday(CarbonImmutable $day): bool
    {
        $region = (string) config('rimify.service.region', 'DE-NW');

        return Holidays::for('de', year: $day->year, region: $region)->isHoliday($day);
    }

    /** "heute" is never said: the label already reads "bis 18:00 Uhr" while open. */
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
