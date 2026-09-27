<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Services\Admin\Dashboard\ChartData;
use App\Services\Admin\Dashboard\Period;
use App\Services\Admin\Dashboard\SalesFigures;
use App\Services\Admin\Dashboard\WorkLists;
use App\Services\Demo\DemoDashboard;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ApprovalSeeder;
use Illuminate\Support\Facades\DB;

/*
 * The demo set tells one story: every widget of the Übersicht agrees with every other (the brief's
 * cross-widget invariants), read through the same services the page reads.
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
    $this->seed(AccessSeeder::class);
    $this->seed(ApprovalSeeder::class);
    app(DemoDashboard::class)->seed(CarbonImmutable::now('Europe/Berlin')->startOfDay(), 0.25);
});

it('counts in Heute exactly the paid orders not yet sent', function (): void {
    $open = DB::table('orders')->whereIn('status', [OrderStatus::Paid->value, OrderStatus::InFulfilment->value])->count();
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $today = collect(app(WorkLists::class)->today($admin))->firstWhere('key', 'versand');

    expect($open)->toBeGreaterThan(0)
        ->and($today['sentence'] ?? '')->toStartWith($open === 1 ? 'Eine bezahlte Bestellung' : "{$open} bezahlte Bestellungen");

    $tile = collect(app(SalesFigures::class)->for(Period::preset('30'), true)['tiles'])->firstWhere('key', 'offen');
    expect($tile['value'])->toBe($open);
});

it('leads Top-Felgen with the Felge on the most order lines in the period', function (): void {
    $period = Period::preset('30');
    $leader = DB::table('order_lines as l')
        ->join('orders as o', 'o.id', '=', 'l.order_id')
        ->join('wheel_configs as c', 'c.id', '=', 'l.wheel_config_id')
        ->where('l.kind', 'WHEEL')
        ->whereIn('o.status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue()))
        ->where('o.placed_at', '>=', $period->startUtc())
        ->where('o.placed_at', '<', $period->endUtc())
        ->groupBy('c.wheel_model_id')
        ->selectRaw('c.wheel_model_id AS model, COUNT(*) AS n')
        ->pluck('n', 'model')
        ->map(static fn (mixed $n): int => (int) $n);

    $top = app(ChartData::class)->topWheels($period);

    // The leader has the most lines (equals may share the top; the chart then names them by name).
    expect($top)->not->toBeEmpty()
        ->and($top[0]['value'])->toBe($leader->max())
        ->and($leader[(int) substr($top[0]['key'], 1)])->toBe($leader->max());
});

it('makes the Umsatz tile the sum of the chart\'s days, to the cent', function (): void {
    $period = Period::preset('30');
    $tile = collect(app(SalesFigures::class)->for($period, true)['tiles'])->firstWhere('key', 'umsatz');
    $chart = app(ChartData::class)->revenue($period, true);

    expect($chart)->not->toBeNull()
        ->and(array_sum(array_column($chart['points'], 'value')))->toBe($tile['value'])
        ->and($chart['total'])->toBe($tile['value']);
});

it('makes the Freigabequote the freigegeben checks over all checks', function (): void {
    $period = Period::preset('30');
    $chart = app(ChartData::class)->verdicts($period);
    $counts = DB::table('verdict_tallies')->whereBetween('day', [$period->from->format('Y-m-d'), $period->to->format('Y-m-d')])
        ->groupBy('status')->selectRaw('status, SUM(n) AS n')->pluck('n', 'status');

    expect($chart['checks'])->toBe((int) $counts->sum())
        ->and($chart['permitted'])->toBe((int) ($counts['PERMITTED'] ?? 0))
        ->and($chart['permitted'] / $chart['checks'])->toBeGreaterThan(0.55)->toBeLessThan(0.7);
});
