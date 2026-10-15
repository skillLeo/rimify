<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The Übersicht's three charts, aggregated on the server in Europe/Berlin days. Every figure goes out
 * as a number — money in minor units — and the page writes it (num.ts), in the chart, its table and
 * its CSV alike.
 *
 * @phpstan-type Point array{key: string, label: string, value: int, orders: int}
 * @phpstan-type Revenue array{points: list<Point>, previous: list<Point>|null, total: int}
 * @phpstan-type Week array{key: string, label: string, range: string, values: array<string, int>, total: int}
 * @phpstan-type Verdicts array{series: list<array{key: string, label: string}>, weeks: list<Week>, since: string|null, checks: int, permitted: int}
 * @phpstan-type Bar array{key: string, label: string, brand: string, name: string, size: string|null, value: int}
 */
final class ChartData
{
    /** The four verdict states, in the order the stack is built, with their words. */
    public const VERDICTS = [
        VerdictStatus::Permitted->value => 'Freigegeben',
        VerdictStatus::Conditional->value => 'Mit Auflagen',
        VerdictStatus::NotPermitted->value => 'Nicht freigegeben',
        VerdictStatus::Unknown->value => 'Noch nicht bestätigt',
    ];

    public function __construct(private readonly SalesFigures $sales) {}

    /**
     * Umsatz per Berlin day; with comparing on, the previous period day for day beside it (one
     * measure, one axis — never a second one).
     *
     * @return Revenue|null null while the period holds no paid order
     */
    public function revenue(Period $period, bool $compare): ?array
    {
        $daily = $this->sales->daily($period);

        if (array_sum($daily['count']) === 0) {
            return null;
        }

        $points = self::points($daily['days'], $daily['revenue'], $daily['count']);
        $previous = null;

        if ($compare) {
            $before = $this->sales->daily($period->previous());
            $previous = self::points($before['days'], $before['revenue'], $before['count']);
        }

        // The same sum as the Umsatz tile's, to the cent: both add the same days.
        return ['points' => $points, 'previous' => $previous, 'total' => array_sum($daily['revenue'])];
    }

    /**
     * Verdicts shown per week (Monday to Sunday in Berlin) within the period, stacked by state.
     *
     * @return Verdicts|null null while nothing has been counted in the period
     */
    public function verdicts(Period $period): ?array
    {
        $rows = DB::table('verdict_tallies')
            ->whereBetween('day', [$period->from->format('Y-m-d'), $period->to->format('Y-m-d')])
            ->selectRaw('day, status, SUM(n) as n')
            ->groupBy('day', 'status')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $weeks = [];

        for ($start = $period->from->startOfWeek(CarbonImmutable::MONDAY); $start <= $period->to; $start = $start->addWeek()) {
            $key = $start->format('o-\WW');
            $from = $start < $period->from ? $period->from : $start;
            $end = $start->addDays(6);
            $to = $end > $period->to ? $period->to : $end;

            $weeks[$key] = [
                'key' => $key,
                'label' => 'KW '.$start->isoWeek(),
                'range' => $from->format('d.m.').GermanFormat::ENDASH.$to->format('d.m.Y'),
                'values' => array_fill_keys(array_keys(self::VERDICTS), 0),
                'total' => 0,
            ];
        }

        foreach ($rows as $row) {
            $key = CarbonImmutable::createFromFormat('!Y-m-d', (string) $row->day, GermanFormat::TIMEZONE)?->format('o-\WW');
            $status = (string) $row->status;

            if ($key !== null && isset($weeks[$key]) && array_key_exists($status, self::VERDICTS)) {
                $weeks[$key]['values'][$status] += (int) $row->n;
                $weeks[$key]['total'] += (int) $row->n;
            }
        }

        // „Gezählt seit …“ only when the counting began inside the Zeitraum: before it, the whole
        // period was counted, and the sentence would only raise a doubt.
        $since = DB::table('verdict_tallies')->min('day');
        $since = is_string($since) && $since > $period->from->format('Y-m-d') ? $since : null;
        $checks = array_sum(array_column($weeks, 'total'));

        return [
            'series' => array_map(static fn (string $key, string $label): array => ['key' => $key, 'label' => $label], array_keys(self::VERDICTS), array_values(self::VERDICTS)),
            'weeks' => array_values($weeks),
            'since' => is_string($since) ? GermanFormat::date(CarbonImmutable::createFromFormat('!Y-m-d', $since, GermanFormat::TIMEZONE) ?: null) : null,
            // The period's Prüfungen and how many were freigegeben: the Freigabequote is the one ÷ the other.
            'checks' => $checks,
            'permitted' => array_sum(array_map(static fn (array $week): int => $week['values'][VerdictStatus::Permitted->value], $weeks)),
        ];
    }

    /**
     * The seven Felgen most ordered in the period — by paid orders that hold them, not by units, so
     * one set of four counts once — each with the size most of those orders took (`8,5J × 19`).
     *
     * @return list<Bar>
     */
    public function topWheels(Period $period, int $limit = 7): array
    {
        $lines = fn () => DB::table('order_lines as l')
            ->join('orders as o', 'o.id', '=', 'l.order_id')
            ->join('wheel_configs as c', 'c.id', '=', 'l.wheel_config_id')
            ->where('l.kind', OrderLineKind::Wheel->value)
            ->whereIn('o.status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue()))
            ->where('o.placed_at', '>=', $period->startUtc())
            ->where('o.placed_at', '<', $period->endUtc());

        $rows = $lines()
            ->join('wheel_models as m', 'm.id', '=', 'c.wheel_model_id')
            ->join('brands as b', 'b.id', '=', 'm.brand_id')
            ->groupBy('m.id', 'm.name', 'b.name')
            ->selectRaw('m.id, m.name, b.name as brand, COUNT(DISTINCT o.id) as orders')
            ->orderByDesc('orders')
            ->orderBy('m.name')
            ->limit($limit)
            ->get();

        // Each model's leading size, the largest first among equals.
        $sizes = [];

        foreach ($lines()->whereIn('c.wheel_model_id', $rows->pluck('id'))
            ->groupBy('c.wheel_model_id', 'c.width_in', 'c.diameter_in')
            ->selectRaw('c.wheel_model_id AS model, c.width_in, c.diameter_in, COUNT(DISTINCT o.id) AS orders')
            ->orderByDesc('orders')->orderByDesc('c.diameter_in')->orderByDesc('c.width_in')
            ->get() as $size) {
            $sizes[(int) $size->model] ??= GermanFormat::rimSize((string) $size->width_in, (string) $size->diameter_in);
        }

        return $rows->map(static fn (object $row): array => [
            'key' => 'm'.$row->id,
            'label' => trim($row->brand.' '.$row->name),
            'brand' => (string) $row->brand,
            'name' => (string) $row->name,
            'size' => $sizes[(int) $row->id] ?? null,
            'value' => (int) $row->orders,
        ])->values()->all();
    }

    /**
     * @param  list<string>  $days
     * @param  list<int>  $values
     * @param  list<int>  $orders
     * @return list<Point>
     */
    private static function points(array $days, array $values, array $orders): array
    {
        $points = [];

        foreach ($days as $i => $day) {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $day, GermanFormat::TIMEZONE);
            $points[] = [
                'key' => $day,
                'label' => $date === null ? $day : (string) GermanFormat::date($date),
                'value' => $values[$i] ?? 0,
                'orders' => $orders[$i] ?? 0,
            ];
        }

        return $points;
    }
}
