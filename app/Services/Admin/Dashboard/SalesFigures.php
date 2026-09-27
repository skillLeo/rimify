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
 * A tile is a figure, its unit and exactly one line under it (the brief's density pass). Zero is a
 * figure like any other: `0 €`, `0`. Only a figure that cannot be computed — an average of nothing —
 * has none, and then the line says why in a few words. The line is the change against the previous
 * period while comparing (or why there is none), otherwise one fact about the figure's own orders.
 * The figure goes out as a number and is written by the page (num.ts: whole euros on a tile).
 *
 * @phpstan-type Delta array{value: float, direction: 'up'|'down'|'flat', label: string}
 * @phpstan-type Sub array{text: string, kind: 'delta'|'note'|'reason', direction: 'up'|'down'|'flat'|null}
 * @phpstan-type Tile array{key: string, label: string, hint: string, value: int|null, unit: 'EUR'|null, sub: Sub, series: list<int|float|null>, href: string|null}
 */
final class SalesFigures
{
    /** Why an average of no orders has no figure. */
    public const NO_ORDERS = 'noch keine bezahlte Bestellung';

    /** Why a change cannot be given: nothing to compare with. */
    public const NO_PREVIOUS = 'Vorzeitraum ohne bezahlte Bestellung';

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

        // Each tile's second line: one fact about the figure's own orders, as „älteste seit 74 Tagen“
        // is for the open ones — where the money came from, how fresh the last order is, how far the
        // average is from the biggest.
        $extremes = $count > 0 ? $this->extremes($period) : null;

        $tiles = [
            self::tile(
                'umsatz',
                'Umsatz',
                'Summe der bezahlten, nicht erstatteten Bestellungen, nach Bestelldatum.',
                $revenue,
                'EUR',
                self::sub($compare, self::delta($revenue, $prevRevenue), $count > 0 ? self::strongestDay($period, $current['revenue']) : null, 'keine bezahlte Bestellung'),
                $sparkRevenue,
                $list(),
            ),
            self::tile(
                'bestellungen',
                'Bestellungen',
                'Bezahlte, nicht erstattete Bestellungen im Zeitraum.',
                $count,
                null,
                // Only paid ones are counted: „keine Bestellungen“ would be untrue beside unpaid ones.
                self::sub($compare, self::delta($count, $prevCount), $extremes === null ? null : self::latest($extremes['latest'], $period), 'keine bezahlte Bestellung'),
                $sparkCount,
                $list(),
            ),
            self::tile(
                'bestellwert',
                'Ø Bestellwert',
                'Umsatz geteilt durch die Zahl der Bestellungen.',
                $average,
                'EUR',
                $average === null
                    ? ['text' => self::NO_ORDERS, 'kind' => 'reason', 'direction' => null]
                    : self::sub($compare, self::delta($average, $prevAverage), $extremes === null ? null : 'höchster Bestellwert '.GermanFormat::money($extremes['largest']), self::NO_ORDERS),
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

        return self::tile(
            'offen',
            'Offene Bestellungen',
            'Bezahlt oder in Bearbeitung, noch nicht versendet — Stand jetzt, unabhängig vom Zeitraum.',
            $count,
            null,
            ['text' => $note ?? 'alles versendet', 'kind' => 'note', 'direction' => null],
            [],
            '/admin/bestellungen?'.http_build_query(['status' => OrderList::OPEN, 'sort' => 'datum', 'richtung' => 'auf']),
        );
    }

    /**
     * The biggest paid order of the period and when the last one was placed — the Bestellungen and
     * Ø Bestellwert tiles' second lines.
     *
     * @return array{largest: int, latest: CarbonImmutable}|null
     */
    private function extremes(Period $period): ?array
    {
        $row = DB::table('orders')
            ->whereIn('status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue()))
            ->where('placed_at', '>=', $period->startUtc())
            ->where('placed_at', '<', $period->endUtc())
            ->selectRaw('MAX(total_cents) AS largest, MAX(placed_at) AS latest')
            ->first();

        if ($row === null || $row->largest === null || ! is_string($row->latest)) {
            return null;
        }

        return ['largest' => (int) $row->largest, 'latest' => CarbonImmutable::parse($row->latest, 'UTC')];
    }

    /**
     * The Berlin day that brought the most revenue — the latest of equals — with what it brought:
     * `stärkster Tag 24.09. · 1.425,00 €`.
     *
     * @param  list<int>  $revenue  per day of the period, in cents
     */
    private static function strongestDay(Period $period, array $revenue): ?string
    {
        $best = null;

        foreach ($period->dayKeys() as $i => $day) {
            $cents = $revenue[$i] ?? 0;

            if ($cents > 0 && ($best === null || $cents >= $best[1])) {
                $best = [$day, $cents];
            }
        }

        if ($best === null) {
            return null;
        }

        // A range of a whole year can hold the same day and month twice: then the year says which.
        $date = CarbonImmutable::parse($best[0], GermanFormat::TIMEZONE);
        $day = $period->days() > 365 ? GermanFormat::date($date) : GermanFormat::dayMonth($date);

        return "stärkster Tag {$day} ".GermanFormat::MIDDOT.' '.GermanFormat::money($best[1]);
    }

    /**
     * When the last paid order came in, as a colleague says it: `letzte vor 2 Std.`, `letzte gestern`.
     * In a range that ended before today, the date: „letzte vor 40 Tagen“ would read as „none since“.
     */
    private static function latest(CarbonImmutable $at, Period $period): string
    {
        if ($period->to->lt(CarbonImmutable::now(GermanFormat::TIMEZONE)->startOfDay())) {
            return 'letzte am '.GermanFormat::date($at);
        }

        $ago = (string) GermanFormat::ago($at, null, 90);

        return 'letzte '.match (true) {
            // „letzte gerade eben“ reads as „letzte Gerade“ first; the helper's words are fine elsewhere.
            $ago === 'gerade eben' => 'vor Sekunden',
            // Past 90 days `ago` gives the date itself.
            preg_match('/^\d/', $ago) === 1 => "am {$ago}",
            default => $ago,
        };
    }

    /**
     * @param  'EUR'|null  $unit
     * @param  Sub  $sub
     * @param  list<int|float|null>  $series
     * @return Tile
     */
    public static function tile(string $key, string $label, string $hint, ?int $value, ?string $unit, array $sub, array $series, ?string $href): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'hint' => $hint,
            'value' => $value,
            'unit' => $unit,
            'sub' => $sub,
            // A curve of nothing is a flat line along the floor: none is drawn.
            'series' => $value === null || array_sum(array_map(static fn (int|float|null $v): float => (float) $v, $series)) === 0.0 ? [] : $series,
            'href' => $href,
        ];
    }

    /**
     * A tile's one line: comparing, the change — or why there is none; otherwise the fact, or what
     * stands for it when there is nothing to tell.
     *
     * @param  Delta|null  $delta
     * @return Sub
     */
    public static function sub(bool $compare, ?array $delta, ?string $fact, string $none, string $noPrevious = self::NO_PREVIOUS): array
    {
        if ($compare) {
            return $delta === null
                ? ['text' => $noPrevious, 'kind' => 'reason', 'direction' => null]
                : ['text' => $delta['label'], 'kind' => 'delta', 'direction' => $delta['direction']];
        }

        return ['text' => $fact ?? $none, 'kind' => 'note', 'direction' => null];
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
