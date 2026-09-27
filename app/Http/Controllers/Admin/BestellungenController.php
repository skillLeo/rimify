<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BestellungenExportRequest;
use App\Http\Requests\Admin\BestellungenFilterRequest;
use App\Http\Requests\Admin\OrderViewRequest;
use App\Models\Order;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\ListExport;
use App\Services\Admin\Lists\AdminLists;
use App\Services\Admin\Lists\ListViews;
use App\Services\Admin\Orders\OrderDetail;
use App\Services\Admin\Orders\OrderList;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Verkauf › Bestellungen — every order, found by what the team knows about it (docs/admin/
 * rest-build-plan.md, step 2.1).
 *
 * The filters live in the URL, so a view is a link; the list is paged on the server; the export
 * takes exactly the set on screen, from the same query (OrderList). Every row says in words how the
 * order stands — paid or not, sent or not — and whether it is seeded demonstration data.
 */
class BestellungenController extends Controller
{
    /** The export's columns, in order. */
    public const EXPORT_HEADER = [
        'Bestellnummer', 'Datum', 'Kundin oder Kunde', 'E-Mail', 'Fahrzeug', 'Status', 'Zahlung', 'Versand',
        'Zahlart', 'Versandart', 'Summe (EUR)', 'Mit Auflagen', 'Demodaten',
    ];

    public function __construct(private readonly OrderList $list, private readonly ListViews $views) {}

    public function index(BestellungenFilterRequest $request): Response|RedirectResponse
    {
        $filters = $request->filters();
        $canonical = $request->canonical();
        $admin = $request->admin();
        $lists = $this->views->for($admin, AdminLists::BESTELLUNGEN, $request->view());
        // The pages of a view stay in it: the view rides along in their links, never in the export.
        $paged = $lists['views']['active'] === null ? $canonical : [...$canonical, 'ansicht' => (string) $lists['views']['active']];

        $page = $this->list->query($filters)->paginate(OrderList::PER_PAGE, ['*'], 'seite', $request->page());

        // A page past the end (an old link, a filter that shrank the set) opens the last real one.
        if ($page->isEmpty() && $page->total() > 0) {
            return redirect()->to(self::url($paged, $page->lastPage()));
        }

        /** @var list<Order> $orders */
        $orders = array_values($page->items());
        $filtered = array_diff_key($canonical, ['sort' => true, 'richtung' => true]) !== [];
        $canExport = $admin->may(PermissionModule::Orders, PermissionAction::Export);

        return Inertia::render('Admin/Bestellungen/Index', [
            'orders' => array_map($this->list->row(...), $orders),
            'filters' => [
                'q' => $canonical['q'] ?? '',
                'status' => $canonical['status'] ?? '',
                'zeitraum' => $canonical['zeitraum'] ?? '',
                'von' => $canonical['von'] ?? '',
                'bis' => $canonical['bis'] ?? '',
                'zahlart' => $canonical['zahlart'] ?? '',
                'versandart' => $canonical['versandart'] ?? '',
                'min' => $canonical['min'] ?? '',
                'max' => $canonical['max'] ?? '',
                'auflagen' => $filters['auflagen'],
                'sort' => $filters['sort'],
                'richtung' => $filters['richtung'],
            ],
            'options' => $this->list->options(),
            'filtered' => $filtered,
            // "12 Bestellungen insgesamt — die Filter schließen sie alle aus" needs the figure before them.
            'totalAll' => $filtered ? Order::query()->count() : $page->total(),
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'prev' => $page->currentPage() > 1 ? self::url($paged, $page->currentPage() - 1) : null,
                'next' => $page->hasMorePages() ? self::url($paged, $page->currentPage() + 1) : null,
            ],
            'query' => $canonical,
            // Gespeicherte Ansichten and the Spaltenwahl (step 2.2).
            'views' => $lists['views'],
            'columns' => $lists['columns'],
            'exportUrls' => $canExport ? [
                'csv' => self::url([...$canonical, 'format' => 'csv'], 1, '/admin/bestellungen/export'),
                'xlsx' => self::url([...$canonical, 'format' => 'xlsx'], 1, '/admin/bestellungen/export'),
            ] : null,
            // Presentation only: the export refuses on the server regardless (R-11).
            'can' => ['export' => $canExport],
        ]);
    }

    /** One order, with the frozen verdict of every wheel line (OrderDetail). */
    public function show(OrderViewRequest $request, Order $order, OrderDetail $detail): Response
    {
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, $order->order_number);

        return Inertia::render('Admin/Bestellungen/Show', $detail->for($order));
    }

    /**
     * The orders on screen, as a file. The export itself is recorded — who took a copy of customer
     * data, when, and with which filters — before the first byte leaves.
     */
    public function export(BestellungenExportRequest $request): StreamedResponse
    {
        $filters = $request->filters();
        $format = $request->fileFormat();
        $query = $this->list->query($filters);
        $count = (clone $query)->toBase()->getCountForPagination();

        AuditTrail::record($request->admin(), 'orders.exported', [
            'format' => $format,
            'filters' => $request->canonical(),
            'count' => $count,
        ]);

        $list = $this->list;
        $rows = (static function () use ($query, $list): \Generator {
            foreach ($query->lazy(500) as $order) {
                $row = $list->row($order);

                yield [
                    $row['number'],
                    (string) $row['at'],
                    (string) ($row['customer'] ?? ''),
                    (string) ($row['email'] ?? ''),
                    (string) ($row['vehicle'] ?? ''),
                    $row['statusLabel'],
                    $row['payment']['label'],
                    $row['fulfilment']['label'] === '–' ? '' : $row['fulfilment']['label'],
                    (string) ($row['paymentMethod'] ?? ''),
                    (string) ($row['shippingMethod'] ?? ''),
                    // Cents become euros once, here at the edge, so a spreadsheet can sum the column.
                    $order->total_cents / 100,
                    $row['conditions'] ? 'ja' : 'nein',
                    $row['demo'] ? 'ja' : 'nein',
                ];
            }
        })();

        $basename = 'bestellungen-'.CarbonImmutable::now(GermanFormat::TIMEZONE)->format('Y-m-d');

        return ListExport::download($basename, $format, self::EXPORT_HEADER, $rows);
    }

    /** @param  array<string, string>  $query */
    private static function url(array $query, int $page, string $path = '/admin/bestellungen'): string
    {
        if ($page > 1) {
            $query['seite'] = (string) $page;
        }

        return $query === [] ? $path : $path.'?'.http_build_query($query);
    }
}
