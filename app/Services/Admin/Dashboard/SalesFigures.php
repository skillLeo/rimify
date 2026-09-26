<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Admin\Orders\OrderList;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The Übersicht's four sales tiles: Umsatz, Bestellungen, Durchschnittlicher Bestellwert, Offene
 * Bestellungen (docs/admin/rest-build-plan.md, „Übersicht und Shell“ step B).
 *
 * Every figure comes from the orders table and links to the list that shows exactly the orders it
 * counts. Umsatz and Bestellungen count what was paid and not refunded, placed in the period's
 * Berlin days; the orders are bucketed into days in PHP rather than with a database time-zone
 * function, so the answer is the same on MySQL and on MariaDB without time-zone tables, across a
 * clock change included.
 *
 * A tile with nothing to count says so in a sentence; it never shows a zero that reads like a
 * result. A change needs a previous period with something in it: "+∞ %" is not a number.
 *
 * @phpstan-type Delta array{value: float, direction: 'up'|'down'|'flat', label: string}
 * @phpstan-type Tile array{key: string, label: string, hint: string, value: string|null, empty: string|null, delta: Delta|null, deltaNote: string|null, series: list<int|float|null>, note: string|null, href: string|null}
 */
final class SalesFigures
{
    /** @return array{tiles: list<Tile>, demo: bool} */
    public function for(Period $period, bool $compare): array
    {
        $current = $this->buckets($period);
        $previous = $compare ? $this->buckets($period->previous()) : null;

        $revenue = array_sum($current['revenue']);
        $count = array_sum($current['count']);
        $average = $count > 0 ? intdiv($revenue, $count) : null;

        $prevRevenue = $previous === null ? null : array_sum($previous['revenue']);
        $prevCount = $previous === null ? null : array_sum($previous['count']);
        $prevAverage = $prevCount !== null && $prevCount > 0 && $prevRevenue !== null ? intdiv($prevRevenue, $prevCount) : null;

        $list = static fn (array $extra = []): string => '/admin/bestellungen?'.http_build_query([
            'status' => OrderList::PAID,
            'von' => $period->from->format('Y-m-d'),
            'bis' => $period->to->format('Y-m-d'),
            ...$extra,
        ]);

        // A curve 40 px high reads days up to a month; beyond that, weeks — ninety daily points of a
        // young shop are a comb of spikes, not a trend.
        $step = $period->days() > 31 ? 7 : 1;
        $sparkRevenue = self::fold($current['revenue'], $step);
        $sparkCount = self::fold($current['count'], $step);

        $averageSeries = array_map(
            static fn (int $r, int $c): ?int => $c > 0 ? intdiv($r, $c) : null,
            $sparkRevenue,
            $sparkCount,
        );

        $tiles = [
            $this->tile(
                'umsatz',
                'Umsatz',
                'Summe der bezahlten, nicht erstatteten Bestellungen, nach Bestelldatum.',
                $count > 0 ? GermanFormat::money($revenue) : null,
                'Noch keine bezahlte Bestellung in diesem Zeitraum.',
                $count > 0 ? self::delta($revenue, $prevRevenue) : null,
                $compare,
                $sparkRevenue,
                $list(),
            ),
            $this->tile(
                'bestellungen',
                'Bestellungen',
                'Bezahlte, nicht erstattete Bestellungen im Zeitraum.',
                $count > 0 ? GermanFormat::integer($count) : null,
                'Noch keine Bestellungen in diesem Zeitraum.',
                $count > 0 ? self::delta($count, $prevCount) : null,
                $compare,
                $sparkCount,
                $list(),
            ),
            $this->tile(
                'bestellwert',
                'Ø Bestellwert',
                'Umsatz geteilt durch die Zahl der Bestellungen.',
                $average === null ? null : GermanFormat::money($average),
                'Ohne Bestellung gibt es keinen Durchschnitt.',
                $average === null ? null : self::delta($average, $prevAverage),
                $compare,
                $averageSeries,
                $list(['sort' => 'summe']),
            ),
            $this->openTile(),
        ];

        return ['tiles' => $tiles, 'demo' => $this->hasDemo($period)];
    }

    /**
     * Revenue in cents and paid orders, per Berlin day of the period — the export's rows, and the
     * curve under the Umsatz chart.
     *
     * @return array{days: list<string>, revenue: list<int>, count: list<int>}
     */
    public function daily(Period $period): array
    {
        return ['days' => $period->dayKeys(), ...$this->buckets($period)];
    }

    /**
     * Revenue in cents and paid orders, per Berlin day of the period.
     *
     * @return array{revenue: list<int>, count: list<int>}
     */
    private function buckets(Period $period): array
    {
        $days = $period->dayKeys();
        $revenue = array_fill_keys($days, 0);
        $count = array_fill_keys($days, 0);

        $rows = DB::table('orders')
            ->whereIn('status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue()))
            ->where('placed_at', '>=', $period->startUtc())
            ->where('placed_at', '<', $period->endUtc())
            ->select(['placed_at', 'total_cents'])
            ->cursor();

        foreach ($rows as $row) {
            $day = CarbonImmutable::parse((string) $row->placed_at, 'UTC')->setTimezone(GermanFormat::TIMEZONE)->format('Y-m-d');

            if (isset($revenue[$day])) {
                $revenue[$day] += (int) $row->total_cents;
                $count[$day]++;
            }
        }

        return ['revenue' => array_values($revenue), 'count' => array_values($count)];
    }

    /**
     * The one tile that is a state, not a period: how many paid orders wait to be sent right now, and
     * how long the oldest has waited. It has no change and no curve — the table keeps no history of
     * how many were open on a past day, and a guessed one would be invented.
     *
     * @return Tile
     */
    private function openTile(): array
    {
        $open = DB::table('orders')->whereIn('status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::open()));
        $count = (clone $open)->count();
        $oldest = $count > 0 ? (clone $open)->min(DB::raw('COALESCE(paid_at, placed_at)')) : null;
        $note = null;

        if (is_string($oldest)) {
            $days = (int) CarbonImmutable::parse($oldest, 'UTC')->diffInDays(CarbonImmutable::now('UTC'));
            $note = match (true) {
                $days < 1 => 'älteste seit heute',
                $days === 1 => 'älteste seit 1 Tag',
                default => "älteste seit {$days} Tagen",
            };
        }

        return [
            'key' => 'offen',
            'label' => 'Offene Bestellungen',
            'hint' => 'Bezahlt oder in Bearbeitung, noch nicht versendet — Stand jetzt, unabhängig vom Zeitraum.',
            'value' => $count > 0 ? GermanFormat::integer($count) : null,
            'empty' => 'Alles versendet. Keine Bestellung wartet.',
            'delta' => null,
            'deltaNote' => null,
            'series' => [],
            'note' => $note,
            'href' => '/admin/bestellungen?'.http_build_query(['status' => OrderList::OPEN, 'sort' => 'datum', 'richtung' => 'auf']),
        ];
    }

    /**
     * @param  Delta|null  $delta
     * @param  list<int|float|null>  $series
     * @return Tile
     */
    private function tile(string $key, string $label, string $hint, ?string $value, string $empty, ?array $delta, bool $compare, array $series, string $href): array
    {
        $note = null;

        if ($compare && $value !== null && $delta === null) {
            $note = 'Im Vorzeitraum keine Bestellung';
        }

        return [
            'key' => $key,
            'label' => $label,
            'hint' => $hint,
            'value' => $value,
            'empty' => $value === null ? $empty : null,
            'delta' => $delta,
            'deltaNote' => $note,
            'series' => $value === null ? [] : $series,
            'note' => null,
            'href' => $href,
        ];
    }

    /**
     * Sums of consecutive runs of `step` days, counted back from the last day, so the final point
     * is always a whole week ending today.
     *
     * @param  list<int>  $values
     * @return list<int>
     */
    public static function fold(array $values, int $step): array
    {
        if ($step <= 1) {
            return $values;
        }

        $folded = [];

        for ($end = count($values); $end > 0; $end -= $step) {
            $start = max(0, $end - $step);
            $days = $end - $start;
            $sum = array_sum(array_slice($values, $start, $days));

            // The first run may be a few days short of a week (90 days are 12 weeks and 6 days): it is
            // drawn at a whole week's rate, so a short run never shows as a dip the data does not have.
            $folded[] = $days < $step ? (int) round($sum * $step / $days) : $sum;
        }

        return array_reverse($folded);
    }

    /** @return Delta|null */
    public static function delta(int $current, ?int $previous): ?array
    {
        if ($previous === null || $previous === 0) {
            return null;
        }

        $change = round(($current - $previous) / $previous * 100, 1);

        return [
            'value' => $change,
            'direction' => $change > 0 ? 'up' : ($change < 0 ? 'down' : 'flat'),
            'label' => GermanFormat::percent($change).' zum Vorzeitraum',
        ];
    }

    /** Whether seeded demonstration orders are among the ones counted — the page then says so. */
    private function hasDemo(Period $period): bool
    {
        return Order::query()
            ->whereIn('status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue()))
            ->where('placed_at', '>=', $period->startUtc())
            ->where('placed_at', '<', $period->endUtc())
            ->whereDemo()
            ->exists();
    }
}
