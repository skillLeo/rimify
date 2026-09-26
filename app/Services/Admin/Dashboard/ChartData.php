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
 * The Übersicht's three charts, aggregated on the server (BRIEF §5: "all aggregation on the
 * server, formatted German in Europe/Berlin"): every point arrives with its value for the scale and
 * its German text for the tooltip and the table view, so the browser draws and never formats money.
 *
 * @phpstan-type Point array{key: string, label: string, value: int, text: string}
 * @phpstan-type Revenue array{points: list<Point>, previous: list<Point>|null, total: string}
 * @phpstan-type Week array{key: string, label: string, range: string, values: array<string, int>, total: int}
 * @phpstan-type Verdicts array{series: list<array{key: string, label: string}>, weeks: list<Week>, since: string|null}
 * @phpstan-type Bar array{key: string, label: string, value: int, text: string}
 */
final class ChartData
{
    /** The four verdict states, in the order the stack is built, with their words. */
    public const VERDICTS = [
        VerdictStatus::Permitted->value => 'Freigegeben',
        VerdictStatus::Conditional->value => 'Mit Auflagen',
        VerdictStatus::NotPermitted->value => 'Nicht freigegeben',
        VerdictStatus::Unknown->value => 'Unbekannt',
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

        $points = self::points($daily['days'], $daily['revenue']);
        $previous = null;

        if ($compare) {
            $before = $this->sales->daily($period->previous());
            $previous = self::points($before['days'], $before['revenue']);
        }

        return ['points' => $points, 'previous' => $previous, 'total' => GermanFormat::money(array_sum($daily['revenue']))];
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

        $since = DB::table('verdict_tallies')->min('day');

        return [
            'series' => array_map(static fn (string $key, string $label): array => ['key' => $key, 'label' => $label], array_keys(self::VERDICTS), array_values(self::VERDICTS)),
            'weeks' => array_values($weeks),
            'since' => is_string($since) ? GermanFormat::date(CarbonImmutable::createFromFormat('!Y-m-d', $since, GermanFormat::TIMEZONE) ?: null) : null,
        ];
    }

    /**
     * The Felgen most ordered in the period — by paid orders that hold them, not by units, so one
     * set of four counts once.
     *
     * @return list<Bar>
     */
    public function topWheels(Period $period, int $limit = 8): array
    {
        $rows = DB::table('order_lines as l')
            ->join('orders as o', 'o.id', '=', 'l.order_id')
            ->join('wheel_configs as c', 'c.id', '=', 'l.wheel_config_id')
            ->join('wheel_models as m', 'm.id', '=', 'c.wheel_model_id')
            ->join('brands as b', 'b.id', '=', 'm.brand_id')
            ->where('l.kind', OrderLineKind::Wheel->value)
            ->whereIn('o.status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue()))
            ->where('o.placed_at', '>=', $period->startUtc())
            ->where('o.placed_at', '<', $period->endUtc())
            ->groupBy('m.id', 'm.name', 'b.name')
            ->selectRaw('m.id, m.name, b.name as brand, COUNT(DISTINCT o.id) as orders')
            ->orderByDesc('orders')
            ->orderBy('m.name')
            ->limit($limit)
            ->get();

        return $rows->map(static fn (object $row): array => [
            'key' => 'm'.$row->id,
            'label' => trim($row->brand.' '.$row->name),
            'value' => (int) $row->orders,
            'text' => ((int) $row->orders === 1 ? '1 Bestellung' : GermanFormat::integer((int) $row->orders).' Bestellungen'),
        ])->values()->all();
    }

    /**
     * @param  list<string>  $days
     * @param  list<int>  $values
     * @return list<Point>
     */
    private static function points(array $days, array $values): array
    {
        $points = [];

        foreach ($days as $i => $day) {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $day, GermanFormat::TIMEZONE);
            $points[] = [
                'key' => $day,
                'label' => $date === null ? $day : (string) GermanFormat::date($date),
                'value' => $values[$i] ?? 0,
                'text' => GermanFormat::money($values[$i] ?? 0),
            ];
        }

        return $points;
    }
}
