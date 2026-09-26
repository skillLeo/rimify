<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\ConflictStatus;
use App\Enums\OrderStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Orders\OrderList;
use App\Support\GermanFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Übersicht — the panel's first page: the figures that say how the shop is doing, and nothing else
 * yet.
 *
 * The brief allows exactly this much before its dashboards step (docs/admin/BRIEF.md §7): a row of
 * real numbers. Charts and work lists wait for the data and the pages behind them.
 *
 * Every figure is a real query, and a role sees only the figures of the areas it may open — a
 * support agent is not shown the month's revenue because the page happens to be shared. A figure
 * links to its list where that list exists; the others are plain, because a link to nowhere is
 * worse than no link.
 */
class UebersichtController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $admin = $request->user('admin');

        if (! $admin instanceof AdminUser) {
            abort(403);
        }

        return Inertia::render('Admin/Uebersicht/Index', [
            'tiles' => $this->tiles($admin),
            'asOf' => GermanFormat::dateTime(now()),
        ]);
    }

    /**
     * Each figure with the one sentence that says what it counts, and the list it comes from.
     *
     * The list is named here for every figure, built or not; tile() links it only once the page is
     * in AdminNavigation::BUILT. So the day Bestellungen is built its figure links itself, and until
     * then no figure points at a page that is not there.
     *
     * @return list<array{key: string, label: string, value: string, hint: string, href: string|null}>
     */
    private function tiles(AdminUser $admin): array
    {
        $tiles = [];

        if ($admin->may(PermissionModule::Reports, PermissionAction::View)) {
            $tiles[] = $this->tile(
                'revenue',
                'Umsatz im Monat',
                GermanFormat::money($this->monthRevenue()),
                'Gesamtbetrag aller bezahlten Bestellungen seit dem 1. des Monats.',
                '/admin/verkaeufe',
            );
        }

        if ($admin->may(PermissionModule::Orders, PermissionAction::View)) {
            $tiles[] = $this->tile(
                'orders',
                'Offene Bestellungen',
                GermanFormat::integer(DB::table('orders')->whereIn('status', [OrderStatus::Paid->value, OrderStatus::InFulfilment->value])->count()),
                'Bezahlt oder in Bearbeitung, aber noch nicht versendet.',
                '/admin/bestellungen',
                // The list opens on exactly the orders the figure counts.
                ['status' => OrderList::OPEN],
            );
        }

        if ($admin->may(PermissionModule::Approvals, PermissionAction::View)) {
            $tiles[] = $this->tile(
                'documents',
                'Veröffentlichte Gutachten',
                GermanFormat::integer(DB::table('approval_documents')->where('status', 'published')->count()),
                'Gutachten, nach denen der Shop gerade Felgen zeigt. Entwürfe zählen nicht mit.',
                '/admin/gutachten',
            );

            $tiles[] = $this->tile(
                'fitments',
                'Veröffentlichte Freigaben',
                GermanFormat::integer(DB::table('fitments')->where('status', 'published')->count()),
                'Eine Freigabe ist eine Zeile eines Gutachtens: diese Felge an diesem Fahrzeug.',
                '/admin/abdeckung',
            );

            $tiles[] = $this->tile(
                'conflicts',
                'Offene Konflikte',
                GermanFormat::integer(DB::table('fitment_conflicts')->where('status', ConflictStatus::Open->value)->count()),
                'Zwei Gutachten sagen über dieselbe Felge am selben Fahrzeug Verschiedenes.',
                '/admin/konflikte',
            );
        }

        if ($admin->may(PermissionModule::Vehicles, PermissionAction::View)) {
            // A vehicle the importer could not characterise can never produce a positive verdict,
            // so this figure is the queue that turns silence back into sales (R-03).
            $tiles[] = $this->tile(
                'review',
                'Fahrzeuge zur Prüfung',
                GermanFormat::integer(DB::table('vehicles')->whereNull('deleted_at')->where('needs_review', true)->count()),
                'Ohne lesbare Achslast oder Höchstgeschwindigkeit. Für sie zeigt der Shop keine Felgen.',
                '/admin/fahrzeuge/pruefung',
            );
        }

        return $tiles;
    }

    /**
     * @param  array<string, string>  $filter  the list's own filter for exactly what the figure counts
     * @return array{key: string, label: string, value: string, hint: string, href: string|null}
     */
    private function tile(string $key, string $label, string $value, string $hint, string $list, array $filter = []): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'value' => $value,
            'hint' => $hint,
            'href' => in_array($list, AdminNavigation::BUILT, true) ? $list.($filter === [] ? '' : '?'.http_build_query($filter)) : null,
        ];
    }

    private function monthRevenue(): int
    {
        $paid = array_map(
            static fn (OrderStatus $s): string => $s->value,
            array_values(array_filter(OrderStatus::cases(), static fn (OrderStatus $s): bool => $s->isPaid())),
        );

        return (int) DB::table('orders')
            ->whereIn('status', $paid)
            ->where('placed_at', '>=', now()->startOfMonth())
            ->sum('total_cents');
    }
}
