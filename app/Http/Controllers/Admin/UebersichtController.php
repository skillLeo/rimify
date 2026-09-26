<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UebersichtRequest;
use App\Models\AdminUser;
use App\Services\Admin\Dashboard\ChartData;
use App\Services\Admin\Dashboard\Coverage;
use App\Services\Admin\Dashboard\Demand;
use App\Services\Admin\Dashboard\Period;
use App\Services\Admin\Dashboard\RoleFigures;
use App\Services\Admin\Dashboard\SalesFigures;
use App\Services\Admin\Dashboard\Variant;
use App\Services\Admin\Dashboard\WorkLists;
use App\Services\Admin\ListExport;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Übersicht — the admin's first screen (docs/admin/rest-build-plan.md, „Übersicht und Shell“).
 *
 * One Zeitraum for the whole page, remembered per person. Every figure is a real query, every figure
 * links to the list it counts, and a role sees the figures of what it opens the admin for (Variant):
 * Verkauf the sales tiles (money only with the reports right), Katalog stock and data quality,
 * Gutachten documents, conflicts and demand, Support the customers waiting and asking. A figure with
 * nothing to count says so in a sentence, never as a zero.
 *
 * @phpstan-import-type Tile from SalesFigures
 */
class UebersichtController extends Controller
{
    public function __invoke(UebersichtRequest $request, SalesFigures $sales, WorkLists $lists, ChartData $charts, Coverage $coverage, Demand $demand, RoleFigures $roles): Response|RedirectResponse
    {
        $admin = $request->admin();
        ['period' => $period, 'compare' => $compare] = $request->choice();

        // One layout, the figures of what this role opens the admin for (Variant).
        $variant = Variant::for($admin);
        $sold = in_array($variant, [Variant::Verkauf, Variant::Support], true) ? $sales->for($period, $compare) : null;

        $kpis = match ($variant) {
            Variant::Verkauf => $this->allowed($admin, $sold['tiles'] ?? []),
            Variant::Katalog => $roles->catalogue(),
            Variant::Gutachten => $roles->compliance($admin, $period),
            // The customers waiting and asking, then the order figures — without money.
            Variant::Support => [...$roles->support($period, $compare), ...$this->allowed($admin, $sold['tiles'] ?? [])],
            Variant::Keine => [],
        };
        $demo = $variant === Variant::Verkauf && ($sold['demo'] ?? false);

        return Inertia::render('Admin/Uebersicht/Index', [
            'asOf' => GermanFormat::dateTime(now()),
            'period' => [...$period->toArray(), 'compare' => $compare],
            'variant' => $variant->value,
            'kpis' => $kpis,
            'demo' => $demo,
            // Katalog: what is missing from the Felgen in the shop, beside the to-dos.
            'quality' => $variant === Variant::Katalog ? $roles->incomplete() : null,
            // Lists, each only for a role that may open what its rows lead to.
            'recentOrders' => $admin->may(PermissionModule::Orders, PermissionAction::View) ? $lists->recentOrders() : null,
            'todo' => $lists->todo($admin),
            'today' => $lists->today($admin),
            'activity' => $admin->may(PermissionModule::AuditLog, PermissionAction::View) ? $lists->activity() : null,
            // The charts come a moment after the figures, each in its own skeleton meanwhile: the
            // page is never held up by its heaviest query. Each chart only for a role that may see
            // what it draws; `false` means "not for you", `null` "nothing to draw yet".
            'charts' => Inertia::defer(fn (): array => [
                // Revenue is the selling roles' curve; Katalog and Gutachten see their own figures instead.
                'revenue' => $variant === Variant::Verkauf && $admin->may(PermissionModule::Reports, PermissionAction::View) ? $charts->revenue($period, $compare) : false,
                'verdicts' => $admin->may(PermissionModule::Approvals, PermissionAction::View) || $admin->may(PermissionModule::Reports, PermissionAction::View)
                    ? $charts->verdicts($period)
                    : false,
                'topWheels' => $admin->may(PermissionModule::Orders, PermissionAction::View) || $admin->may(PermissionModule::Reports, PermissionAction::View)
                    ? $charts->topWheels($period)
                    : false,
                // What the shop may show, by make and rim size — not a period figure: coverage is now.
                'coverage' => $admin->may(PermissionModule::Approvals, PermissionAction::View) ? $coverage->matrix() : false,
                // Beside it, the cars asked for that it does not cover yet: the open ones, the five
                // most in demand.
                'demand' => $admin->may(PermissionModule::Approvals, PermissionAction::View) ? $demand->ranked($period, 'offen', null, 5) : false,
            ]),
            'can' => [
                'export' => $admin->may(PermissionModule::Reports, PermissionAction::Export),
            ],
        ]);
    }

    /** The period's figures day by day, as a CSV a German spreadsheet opens as it is. */
    public function export(UebersichtRequest $request, SalesFigures $sales): StreamedResponse
    {
        abort_unless($request->admin()->may(PermissionModule::Reports, PermissionAction::Export), 403);

        ['period' => $period] = $request->choice();
        $daily = $sales->daily($period);

        $rows = (static function () use ($daily): \Generator {
            foreach ($daily['days'] as $i => $day) {
                $revenue = $daily['revenue'][$i];
                $count = $daily['count'][$i];

                yield [
                    (string) GermanFormat::date(CarbonImmutable::createFromFormat('!Y-m-d', $day, GermanFormat::TIMEZONE) ?: null),
                    // Cents become euros once, here at the edge, so a spreadsheet can sum the column.
                    $revenue / 100,
                    $count,
                    $count > 0 ? intdiv($revenue, $count) / 100 : null,
                ];
            }
        })();

        return ListExport::download(
            'uebersicht-'.$period->from->format('Y-m-d').'-bis-'.$period->to->format('Y-m-d'),
            'csv',
            ['Datum', 'Umsatz (EUR)', 'Bestellungen', 'Ø Bestellwert (EUR)'],
            $rows,
        );
    }

    /**
     * The sales tiles this role may see: money needs the reports right, the order counts the orders
     * right; a tile whose list this role cannot open keeps its figure but loses its link.
     *
     * @param  list<Tile>  $tiles
     * @return list<Tile>
     */
    private function allowed(AdminUser $admin, array $tiles): array
    {
        $orders = $admin->may(PermissionModule::Orders, PermissionAction::View);
        $reports = $admin->may(PermissionModule::Reports, PermissionAction::View);
        $kept = [];

        foreach ($tiles as $tile) {
            $money = in_array($tile['key'], ['umsatz', 'bestellwert'], true);

            if (($money && ! $reports) || (! $money && ! $orders)) {
                continue;
            }

            if (! $orders) {
                $tile['href'] = null;
            }

            $kept[] = $tile;
        }

        return $kept;
    }
}
