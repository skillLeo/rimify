<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Enums\DocumentStatus;
use App\Enums\OrderStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Order;
use App\Services\Admin\AuditDescriber;
use App\Services\Admin\Orders\OrderList;
use App\Support\GermanFormat;
use App\Support\VehicleName;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * What the Übersicht lists rather than counts: the newest orders, what this role has to do, today's
 * sentences, and the last changes in the panel (docs/admin/rest-build-plan.md, „Übersicht und Shell“
 * step C).
 *
 * Every row leads to a page that exists and that this role may open. A kind of work whose page is
 * not built yet (Konflikte, Produkte ohne Foto) joins the list the day that page does — until then
 * its figure is on the Gutachten tiles, not a row that goes nowhere.
 *
 * @phpstan-type OrderRow array{id: int, number: string, customer: string, total: int, payment: array{label: string, tone: string}, fulfilment: array{label: string, tone: string}, ago: string|null, iso: string|null, demo: bool, href: string, customerHref: string|null}
 * @phpstan-type TodoItem array{key: string, type: string, title: string, detail: string|null, ago: string|null, iso: string|null, href: string}
 * @phpstan-type TodaySentence array{key: string, sentence: string, action: string, href: string}
 * @phpstan-type Activity array{id: int, person: string, sentence: string, ago: string|null, iso: string|null}
 */
final class WorkLists
{
    public const ROWS = 8;

    public function __construct(private readonly OrderList $orders, private readonly AuditDescriber $describer) {}

    /** @return list<OrderRow> */
    public function recentOrders(): array
    {
        $orders = $this->orders->query([
            'q' => null, 'status' => null, 'von' => null, 'bis' => null, 'zahlart' => null, 'versandart' => null,
            'min' => null, 'max' => null, 'auflagen' => false, 'sort' => 'datum', 'richtung' => 'ab',
        ])->whereNotNull('orders.placed_at')->limit(self::ROWS)->get();

        $rows = [];

        foreach ($orders as $order) {
            $row = $this->orders->row($order);
            $fulfilment = $row['fulfilment'];

            // Nothing to ship said in words, quietly: not yet (a checkout still open), or not at all.
            if ($fulfilment['label'] === '–') {
                $fulfilment = ['label' => $order->status === OrderStatus::PendingPayment ? 'noch nicht versandt' : 'entfällt', 'tone' => 'none'];
            }

            $email = is_string($row['email'] ?? null) ? $row['email'] : null;

            $rows[] = [
                'id' => $row['id'],
                'number' => $row['number'],
                'customer' => (string) ($row['customer'] ?? $email ?? '–'),
                'total' => $row['total'],
                'payment' => $row['payment'],
                'fulfilment' => $fulfilment,
                'ago' => GermanFormat::ago($order->placed_at, null, 99),
                'iso' => $order->placed_at?->toIso8601String(),
                'demo' => $row['demo'],
                // The order's own page arrives with the order detail; until then the list opens on it.
                'href' => '/admin/bestellungen?'.http_build_query(['q' => $row['number']]),
                // A row action: every order of the same person.
                'customerHref' => $email === null ? null : '/admin/bestellungen?'.http_build_query(['q' => $email]),
            ];
        }

        return $rows;
    }

    /**
     * Everything waiting on this role, oldest first — what the Übersicht is opened for.
     *
     * @return list<TodoItem>
     */
    public function todo(AdminUser $admin): array
    {
        $items = [];

        if ($admin->may(PermissionModule::Orders, PermissionAction::View)) {
            $open = Order::query()
                ->whereIn('status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::open()))
                ->orderByRaw('COALESCE(paid_at, placed_at) asc')
                ->limit(self::ROWS)
                ->get();

            foreach ($open as $order) {
                $since = $order->paid_at ?? $order->placed_at;
                $items[] = [
                    'key' => 'order-'.$order->id,
                    'type' => 'Versand',
                    // The chip already says Versand: the title is the number and the verb.
                    'title' => "{$order->order_number} versenden",
                    'detail' => GermanFormat::money($order->total_cents).($order->vehicle_label ? ' · '.$order->vehicle_label : ''),
                    'ago' => GermanFormat::ago($since),
                    'iso' => $since?->toIso8601String(),
                    'href' => '/admin/bestellungen?'.http_build_query(['q' => $order->order_number]),
                ];
            }
        }

        if ($admin->may(PermissionModule::Approvals, PermissionAction::View)) {
            $drafts = DB::table('approval_documents')
                ->where('status', DocumentStatus::Draft->value)
                ->orderBy('created_at')
                ->limit(self::ROWS)
                ->get(['id', 'report_number', 'issuer', 'created_at']);

            foreach ($drafts as $draft) {
                $since = $draft->created_at === null ? null : CarbonImmutable::parse((string) $draft->created_at, 'UTC');
                $items[] = [
                    'key' => 'document-'.$draft->id,
                    'type' => 'Gutachten',
                    'title' => "{$draft->report_number} prüfen",
                    'detail' => (string) $draft->issuer,
                    'ago' => GermanFormat::ago($since),
                    'iso' => $since?->toIso8601String(),
                    'href' => '/admin/gutachten',
                ];
            }

            // Customers waiting on a document, one row per car, the longest wait first.
            $waiting = DB::table('fitment_subscriptions as s')
                ->join('vehicles as v', 'v.id', '=', 's.vehicle_id')
                ->whereNotNull('s.confirmed_at')
                ->whereNull('s.unsubscribed_at')
                ->whereNull('s.notified_at')
                ->groupBy('s.vehicle_id', 'v.make', 'v.model', 'v.variant')
                ->selectRaw('s.vehicle_id, v.make, v.model, v.variant, COUNT(*) as n, MIN(s.confirmed_at) as since')
                ->orderBy('since')
                ->limit(self::ROWS)
                ->get();

            foreach ($waiting as $row) {
                $since = CarbonImmutable::parse((string) $row->since, 'UTC');
                $count = (int) $row->n;
                $items[] = [
                    'key' => 'anfrage-'.$row->vehicle_id,
                    'type' => 'Anfrage',
                    'title' => VehicleName::from($row),
                    'detail' => $count === 1 ? '1 Person wartet auf ein Gutachten' : "{$count} Personen warten auf ein Gutachten",
                    'ago' => GermanFormat::ago($since),
                    'iso' => $since->toIso8601String(),
                    'href' => '/admin/anfragen',
                ];
            }
        }

        if ($admin->may(PermissionModule::Settings, PermissionAction::View)) {
            $failed = DB::table('failed_jobs')->count();

            if ($failed > 0) {
                $since = CarbonImmutable::parse((string) DB::table('failed_jobs')->min('failed_at'), 'UTC');
                $items[] = [
                    'key' => 'jobs',
                    'type' => 'System',
                    'title' => $failed === 1 ? '1 Hintergrundaufgabe fehlgeschlagen' : "{$failed} Hintergrundaufgaben fehlgeschlagen",
                    'detail' => 'Im Systemzustand steht, welche.',
                    'ago' => GermanFormat::ago($since),
                    'iso' => $since->toIso8601String(),
                    'href' => '/admin/system',
                ];
            }
        }

        usort($items, static fn (array $a, array $b): int => strcmp((string) $a['iso'], (string) $b['iso']));

        return array_slice($items, 0, self::ROWS);
    }

    /**
     * At most three sentences: what this role should do now, each with the button that starts it.
     *
     * @return list<TodaySentence>
     */
    public function today(AdminUser $admin): array
    {
        $sentences = [];

        if ($admin->may(PermissionModule::Orders, PermissionAction::View)) {
            $open = DB::table('orders')->whereIn('status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::open()))->count();

            if ($open > 0) {
                $sentences[] = [
                    'key' => 'versand',
                    'sentence' => $open === 1 ? 'Eine bezahlte Bestellung wartet auf den Versand.' : "{$open} bezahlte Bestellungen warten auf den Versand.",
                    'action' => 'Bestellungen öffnen',
                    'href' => '/admin/bestellungen?'.http_build_query(['status' => OrderList::OPEN, 'sort' => 'datum', 'richtung' => 'auf']),
                ];
            }
        }

        if ($admin->may(PermissionModule::Approvals, PermissionAction::View)) {
            $drafts = DB::table('approval_documents')->where('status', DocumentStatus::Draft->value)->count();

            if ($drafts > 0) {
                $sentences[] = [
                    'key' => 'gutachten',
                    'sentence' => $drafts === 1 ? 'Ein Gutachten wartet auf Prüfung.' : "{$drafts} Gutachten warten auf Prüfung.",
                    'action' => 'Gutachten öffnen',
                    'href' => '/admin/gutachten',
                ];
            }

            $people = DB::table('fitment_subscriptions')->whereNotNull('confirmed_at')->whereNull('unsubscribed_at')->whereNull('notified_at')->count();

            if ($people > 0) {
                $sentences[] = [
                    'key' => 'anfragen',
                    'sentence' => $people === 1 ? 'Eine Kundin oder ein Kunde wartet auf ein Gutachten für ihr Auto.' : "{$people} Kundinnen und Kunden warten auf ein Gutachten für ihr Auto.",
                    'action' => 'Anfragen öffnen',
                    'href' => '/admin/anfragen',
                ];
            }
        }

        return array_slice($sentences, 0, 3);
    }

    /**
     * The last six changes in the panel, in words (the Protokoll's describer).
     *
     * @return list<Activity>
     */
    public function activity(): array
    {
        $entries = AuditLog::query()
            ->where('description', '!=', 'permission.denied')
            ->orderByDesc('id')
            ->limit(6)
            ->get();

        $names = DB::table('admin_users')->pluck('name', 'id')->all();
        $rows = [];

        foreach ($entries as $entry) {
            $text = $this->describer->describe($entry);
            $person = is_numeric($entry->causer_id) && isset($names[(int) $entry->causer_id])
                ? (string) $names[(int) $entry->causer_id]
                : (is_string($entry->actor_email) && $entry->actor_email !== '' ? $entry->actor_email : 'Unbekannt');

            $rows[] = [
                'id' => (int) $entry->id,
                'person' => $person,
                'sentence' => $text['sentence'],
                'ago' => GermanFormat::ago($entry->created_at),
                'iso' => $entry->created_at?->toIso8601String(),
            ];
        }

        return $rows;
    }
}
