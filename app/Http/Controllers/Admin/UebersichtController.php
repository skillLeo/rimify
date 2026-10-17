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
use App\Support\Money;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

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

        // Every figure is computed when it is asked for. The charts come in a request of their own (deferred, below), and
        // that request asks for the charts alone: it no longer computes every figure of the page again only to drop them
        // (D-280). The sales figures two props share are computed once.
        $soldOnce = null;
        $sold = static function () use (&$soldOnce, $variant, $sales, $period, $compare): ?array {
            if (! in_array($variant, [Variant::Verkauf, Variant::Support], true)) {
                return null;
            }

            return $soldOnce ??= $sales->for($period, $compare);
        };

        $approvals = $admin->may(PermissionModule::Approvals, PermissionAction::View);
        $reports = $admin->may(PermissionModule::Reports, PermissionAction::View);

        // Each chart only for a role that may see what it draws; `false` means "not for you".
        $plan = [
            // Revenue is the selling roles' curve; Katalog and Gutachten see their own figures instead.
            'revenue' => $variant === Variant::Verkauf && $reports ? fn () => $charts->revenue($period, $compare) : false,
            'verdicts' => $approvals || $reports ? fn () => $charts->verdicts($period) : false,
            // What the shop may show, by make and rim size — not a period figure: coverage is now.
            'coverage' => $approvals ? fn () => $coverage->matrix() : false,
            // Beside it, the cars asked for that it does not cover yet: the open ones, the five most in demand.
            'demand' => $approvals ? fn () => $demand->ranked($period, 'offen', null, 5) : false,
        ];

        return Inertia::render('Admin/Uebersicht/Index', [
            'asOf' => GermanFormat::dateTime(now()),
            'period' => [...$period->toArray(), 'compare' => $compare],
            'variant' => $variant->value,
            'kpis' => fn (): array => match ($variant) {
                Variant::Verkauf => $this->allowed($admin, $sold()['tiles'] ?? []),
                Variant::Katalog => $roles->catalogue(),
                Variant::Gutachten => $roles->compliance($admin, $period),
                // The customers waiting and asking, then the order figures — without money.
                Variant::Support => [...$roles->support($period, $compare), ...$this->allowed($admin, $sold()['tiles'] ?? [])],
                Variant::Keine => [],
            },
            'demo' => fn (): bool => $variant === Variant::Verkauf && ($sold()['demo'] ?? false),
            // Katalog: what is missing from the Felgen in the shop, beside the to-dos.
            'quality' => fn () => $variant === Variant::Katalog ? $roles->incomplete() : null,
            // Lists, each only for a role that may open what its rows lead to.
            'recentOrders' => fn () => $admin->may(PermissionModule::Orders, PermissionAction::View) ? $lists->recentOrders() : null,
            'todo' => fn () => $lists->todo($admin),
            'today' => fn () => $lists->today($admin),
            'activity' => fn () => $admin->may(PermissionModule::AuditLog, PermissionAction::View) ? $lists->activity() : null,
            // Top-Felgen with the page, not deferred: one short query, and a ranking whose names wrap
            // has no skeleton that could match it — so the card is never a skeleton (M1-06).
            'topWheels' => fn () => $admin->may(PermissionModule::Orders, PermissionAction::View) || $reports ? $charts->topWheels($period) : null,
            // The charts come a moment after the figures, each in its own skeleton meanwhile: the
            // page is never held up by its heaviest query. Which charts this role gets is known at
            // once (`chartKeys`), so the first frame already has the right boxes in the right places.
            'chartKeys' => array_keys(array_filter($plan, static fn (mixed $chart): bool => $chart !== false)),
            'charts' => Inertia::defer(fn (): array => self::each($plan), 'default', true),
            // The matrix's size before it arrives: one row per make, so its skeleton is exactly as tall
            // as the matrix that replaces it and nothing under it moves (a count, not the matrix).
            'coverageRows' => fn (): int => $approvals ? DB::table('vehicles')->whereNull('deleted_at')->distinct()->count('make') : 0,
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
                    // Amounts the spreadsheet can sum, written from their integer cents (ListExport).
                    Money::fromMinor((int) $revenue),
                    $count,
                    $count > 0 ? Money::fromMinor(intdiv((int) $revenue, (int) $count)) : null,
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
     * Every chart on its own: one whose query fails is reported, left empty and named in `failed`, so
     * its widget says so and offers „Erneut versuchen“ while the others still draw — a failing query
     * never takes the Übersicht down with it (and `rescue` catches anything outside the charts).
     * `false` stays `false`: not for this role.
     *
     * @param  array<string, (callable(): mixed)|false>  $charts
     * @return array<string, mixed>
     */
    private static function each(array $charts): array
    {
        $out = ['failed' => []];

        foreach ($charts as $key => $chart) {
            if ($chart === false) {
                $out[$key] = false;

                continue;
            }

            try {
                $out[$key] = $chart();
            } catch (Throwable $e) {
                report($e);
                $out[$key] = null;
                $out['failed'][] = $key;
            }
        }

        return $out;
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
