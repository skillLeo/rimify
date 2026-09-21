<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Support\GermanFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The dashboard: six tiles, a revenue line and the open-conflict queue.
 *
 * Every figure is a real query. A dashboard with invented numbers teaches the people who run this
 * business to distrust it, and they only need to catch it once.
 */
class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Admin/Dashboard/Index', [
            'tiles' => $this->tiles(),
            'revenue' => $this->revenue(),
            'conflicts' => $this->conflicts(),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function tiles(): array
    {
        $paid = array_map(
            static fn (OrderStatus $s): string => $s->value,
            array_filter(OrderStatus::cases(), static fn (OrderStatus $s): bool => $s->isPaid()),
        );

        $monthRevenue = (int) DB::table('orders')
            ->whereIn('status', $paid)
            ->where('placed_at', '>=', now()->startOfMonth())
            ->sum('total_cents');

        $openOrders = DB::table('orders')
            ->whereIn('status', [OrderStatus::Paid->value, OrderStatus::InFulfilment->value])
            ->count();

        return [
            [
                'key' => 'revenue',
                'label' => 'Umsatz (Monat)',
                'value' => GermanFormat::money($monthRevenue),
            ],
            [
                'key' => 'orders',
                'label' => 'Offene Bestellungen',
                'value' => GermanFormat::integer($openOrders),
            ],
            [
                'key' => 'conflicts',
                'label' => 'Offene Konflikte',
                'value' => GermanFormat::integer(
                    DB::table('fitment_conflicts')->where('status', 'open')->count(),
                ),
            ],
            [
                'key' => 'documents',
                'label' => 'Gutachten',
                'value' => GermanFormat::integer(
                    DB::table('approval_documents')->where('status', 'published')->count(),
                ),
            ],
            [
                'key' => 'fitments',
                'label' => 'Freigaben',
                'value' => GermanFormat::integer(
                    DB::table('fitments')->where('status', 'published')->count(),
                ),
            ],
            [
                // A vehicle the importer could not characterise can never produce a positive
                // verdict, so this tile is the queue that turns silence back into sales (R-03).
                'key' => 'review',
                'label' => 'Fahrzeuge in Prüfung',
                'value' => GermanFormat::integer(
                    DB::table('vehicles')->whereNull('deleted_at')->where('needs_review', true)->count(),
                ),
            ],
        ];
    }

    /**
     * Twelve months of paid revenue. Months with no orders are present as zero rather than
     * missing, so the line has a shape instead of a gap.
     *
     * @return list<array{label: string, value: int}>
     */
    private function revenue(): array
    {
        $paid = array_map(
            static fn (OrderStatus $s): string => $s->value,
            array_filter(OrderStatus::cases(), static fn (OrderStatus $s): bool => $s->isPaid()),
        );

        $rows = DB::table('orders')
            ->selectRaw("DATE_FORMAT(placed_at, '%Y-%m') as period, SUM(total_cents) as cents")
            ->whereIn('status', $paid)
            ->whereNotNull('placed_at')
            ->where('placed_at', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('period')
            ->get();

        $byPeriod = [];

        foreach ($rows as $row) {
            $byPeriod[(string) $row->period] = (int) $row->cents;
        }

        $series = [];

        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $period = $month->format('Y-m');

            $series[] = [
                'label' => $month->format('m.y'),
                'value' => $byPeriod[$period] ?? 0,
            ];
        }

        return $series;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function conflicts(): array
    {
        $rows = DB::table('fitment_conflicts as fc')
            ->join('vehicles as v', 'v.id', '=', 'fc.vehicle_id')
            ->where('fc.status', 'open')
            ->orderByDesc('fc.blocking')
            ->orderBy('fc.id')
            ->limit(10)
            ->get(['fc.id', 'fc.kind', 'fc.blocking', 'v.make', 'v.model', 'v.variant', 'v.hsn', 'v.tsn']);

        $conflicts = [];

        foreach ($rows as $row) {
            $conflicts[] = [
                'id' => (int) $row->id,
                'kind' => (string) $row->kind,
                'blocking' => (bool) $row->blocking,
                'vehicle' => trim($row->make.' '.$row->variant),
                'keyNumbers' => GermanFormat::keyNumbers((string) $row->hsn, (string) $row->tsn),
            ];
        }

        return $conflicts;
    }
}
