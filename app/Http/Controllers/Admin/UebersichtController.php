<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\ConflictStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UebersichtRequest;
use App\Models\AdminUser;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Dashboard\Period;
use App\Services\Admin\Dashboard\SalesFigures;
use App\Services\Admin\ListExport;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Übersicht — the admin's first screen (docs/admin/rest-build-plan.md, „Übersicht und Shell“).
 *
 * One Zeitraum for the whole page, remembered per person. Every figure is a real query, every figure
 * links to the list it counts, and a role sees only the figures of the areas it may open: the sales
 * tiles need the orders right (and the reports right for money), a role without them sees the
 * Gutachten figures instead. A figure with nothing to count says so in a sentence, never as a zero.
 *
 * @phpstan-import-type Tile from SalesFigures
 */
class UebersichtController extends Controller
{
    public function __invoke(UebersichtRequest $request, SalesFigures $sales): Response|RedirectResponse
    {
        $admin = $request->admin();
        ['period' => $period, 'compare' => $compare] = $request->choice();

        $kpis = [];
        $demo = false;

        if ($this->seesSales($admin)) {
            $figures = $sales->for($period, $compare);
            $kpis = $this->allowed($admin, $figures['tiles']);
            $demo = $figures['demo'];
        }

        if ($kpis === [] && $admin->may(PermissionModule::Approvals, PermissionAction::View)) {
            $kpis = $this->complianceTiles($admin);
        }

        return Inertia::render('Admin/Uebersicht/Index', [
            'asOf' => GermanFormat::dateTime(now()),
            'period' => [...$period->toArray(), 'compare' => $compare],
            'kpis' => $kpis,
            'demo' => $demo,
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

    private function seesSales(AdminUser $admin): bool
    {
        return $admin->may(PermissionModule::Orders, PermissionAction::View)
            || $admin->may(PermissionModule::Reports, PermissionAction::View);
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

    /**
     * What a Gutachten role opens the admin for, as figures: published documents and their rows,
     * open conflicts, vehicles waiting for review. States, not periods — each says so.
     *
     * @return list<Tile>
     */
    private function complianceTiles(AdminUser $admin): array
    {
        $tiles = [
            $this->stateTile('documents', 'Veröffentlichte Gutachten', 'Gutachten, nach denen der Shop gerade Felgen zeigt. Entwürfe zählen nicht mit.',
                DB::table('approval_documents')->where('status', 'published')->count(), 'Noch kein Gutachten veröffentlicht.', '/admin/gutachten'),
            $this->stateTile('fitments', 'Veröffentlichte Freigaben', 'Eine Freigabe ist eine Zeile eines Gutachtens: diese Felge an diesem Fahrzeug.',
                DB::table('fitments')->where('status', 'published')->count(), 'Noch keine Freigabe veröffentlicht.', '/admin/abdeckung'),
            $this->stateTile('conflicts', 'Offene Konflikte', 'Zwei Gutachten sagen über dieselbe Felge am selben Fahrzeug Verschiedenes.',
                DB::table('fitment_conflicts')->where('status', ConflictStatus::Open->value)->count(), 'Kein offener Konflikt.', '/admin/konflikte'),
        ];

        if ($admin->may(PermissionModule::Vehicles, PermissionAction::View)) {
            // A vehicle the importer could not characterise can never produce a positive verdict, so
            // this figure is the queue that turns silence back into sales (R-03).
            $tiles[] = $this->stateTile('review', 'Fahrzeuge zur Prüfung', 'Ohne lesbare Achslast oder Höchstgeschwindigkeit. Für sie zeigt der Shop keine Felgen.',
                DB::table('vehicles')->whereNull('deleted_at')->where('needs_review', true)->count(), 'Kein Fahrzeug wartet auf Prüfung.', '/admin/fahrzeuge/pruefung');
        }

        return $tiles;
    }

    /** @return Tile */
    private function stateTile(string $key, string $label, string $hint, int $count, string $empty, string $list): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'hint' => $hint,
            'value' => $count > 0 ? GermanFormat::integer($count) : null,
            'empty' => $count > 0 ? null : $empty,
            'delta' => null,
            'deltaNote' => null,
            'series' => [],
            'note' => 'Stand jetzt',
            // Linked once that list exists (AdminNavigation::BUILT); never a link to a page that is not there.
            'href' => in_array($list, AdminNavigation::BUILT, true) ? $list : null,
        ];
    }
}
