<?php

declare(strict_types=1);

namespace App\Services\Admin\Orders;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Verkauf › Bestellungen: the one query behind the list and its exports (docs/admin/rest-build-plan.md,
 * step 2.1). The page and the file are built from the same filters by the same code, so an export can
 * never hold a different set of orders than the screen it was taken from.
 *
 * Parameter binding only (R-14): a search term is escaped for LIKE and bound, a day becomes a UTC
 * instant, a status a value from the enum; nothing typed reaches the SQL as text.
 *
 * @phpstan-type Filters array{q: string|null, status: string|null, von: string|null, bis: string|null, zahlart: string|null, versandart: string|null, min: int|null, max: int|null, auflagen: bool, sort: string, richtung: string}
 */
final class OrderList
{
    public const PER_PAGE = 25;

    /** `status=offen`: paid and not yet sent — the Übersicht's "Offene Bestellungen". */
    public const OPEN = 'offen';

    /** `status=bezahlt`: every order whose money stayed with the shop — the Übersicht's Umsatz. */
    public const PAID = 'bezahlt';

    /** The sorts the list offers, by their URL name. */
    public const SORTS = ['datum', 'summe', 'status'];

    /**
     * Stripe's names for how an order was paid, in the words a German customer uses. A method not
     * listed here is shown under its own name rather than hidden.
     *
     * @var array<string, string>
     */
    public const PAYMENT_METHODS = [
        'card' => 'Kreditkarte',
        'paypal' => 'PayPal',
        'klarna' => 'Klarna',
        'sepa_debit' => 'SEPA-Lastschrift',
        'sofort' => 'Sofortüberweisung',
        'giropay' => 'giropay',
        'apple_pay' => 'Apple Pay',
        'google_pay' => 'Google Pay',
        'bank_transfer' => 'Überweisung',
        // The review's stand-in for a provider (App\Payments\SandboxGateway): no money moved.
        'sandbox' => 'Testzahlung',
    ];

    /**
     * The orders the filters select, with everything a row shows loaded in the same query.
     *
     * @param  Filters  $filters
     * @return Builder<Order>
     */
    public function query(array $filters): Builder
    {
        $query = Order::query()
            ->select('orders.*')
            ->withDemoFlag()
            ->addSelect(['has_conditions' => DB::table('order_lines as cl')
                ->join('order_line_fitments as cf', 'cf.order_line_id', '=', 'cl.id')
                ->whereColumn('cl.order_id', 'orders.id')
                ->where('cf.has_conditions', true)
                ->selectRaw('1')
                ->limit(1)])
            ->with('customer:id,email,firstname,lastname');

        $this->filter($query, $filters);
        $this->sort($query, $filters['sort'], $filters['richtung']);

        return $query;
    }

    /**
     * @param  Builder<Order>  $query
     * @param  Filters  $filters
     */
    private function filter(Builder $query, array $filters): void
    {
        $term = $filters['q'];

        if ($term !== null) {
            $like = '%'.addcslashes($term, '%_\\').'%';
            $prefix = addcslashes($term, '%_\\').'%';
            // An order number with or without its dashes (his admin item 18, D-354): „2611-10487“ and „261110487“ find the
            // same order, and so do „RMF-2026-0006“ and „RMF20260006“.
            $bare = addcslashes(str_replace([' ', '-'], '', $term), '%_\\');

            $query->where(static function (Builder $where) use ($like, $prefix, $bare): void {
                $where->where('orders.order_number', 'like', $prefix)
                    ->when($bare !== '', static fn (Builder $number) => $number->orWhereRaw("REPLACE(orders.order_number, '-', '') LIKE ?", ['%'.$bare.'%']))
                    ->orWhere('orders.vehicle_label', 'like', $like)
                    ->orWhereHas('customer', static function (Builder $customer) use ($like): void {
                        $customer->where('email', 'like', $like)
                            ->orWhere('firstname', 'like', $like)
                            ->orWhere('lastname', 'like', $like)
                            ->orWhereRaw("CONCAT_WS(' ', firstname, lastname) LIKE ?", [$like]);
                    });
            });
        }

        $status = $filters['status'];

        if ($status === self::OPEN) {
            $query->whereIn('orders.status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::open()));
        } elseif ($status === self::PAID) {
            $query->whereIn('orders.status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue()));
        } elseif ($status !== null) {
            $query->where('orders.status', $status);
        }

        if ($filters['von'] !== null) {
            $query->where('orders.placed_at', '>=', self::berlinMidnight($filters['von']));
        }

        if ($filters['bis'] !== null) {
            // Up to the end of that day in Berlin: before the next one begins there.
            $query->where('orders.placed_at', '<', self::berlinMidnight($filters['bis'], 1));
        }

        if ($filters['zahlart'] !== null) {
            $query->where('orders.payment_method', $filters['zahlart']);
        }

        if ($filters['versandart'] !== null) {
            $query->where('orders.shipping_method', $filters['versandart']);
        }

        if ($filters['min'] !== null) {
            $query->where('orders.total_cents', '>=', $filters['min']);
        }

        if ($filters['max'] !== null) {
            $query->where('orders.total_cents', '<=', $filters['max']);
        }

        if ($filters['auflagen']) {
            $query->whereExists(static function ($exists): void {
                $exists->selectRaw('1')
                    ->from('order_lines as al')
                    ->join('order_line_fitments as af', 'af.order_line_id', '=', 'al.id')
                    ->whereColumn('al.order_id', 'orders.id')
                    ->where('af.has_conditions', true);
            });
        }
    }

    /** @param  Builder<Order>  $query */
    private function sort(Builder $query, string $sort, string $direction): void
    {
        $dir = $direction === 'auf' ? 'asc' : 'desc';

        match ($sort) {
            'summe' => $query->orderBy('orders.total_cents', $dir),
            // The order an order moves through, not the alphabet of its codes.
            'status' => $query->orderByRaw(
                'FIELD(orders.status, '.implode(', ', array_fill(0, count(OrderStatus::cases()), '?')).') '.$dir,
                OrderStatus::values(),
            ),
            // A draft has not been placed yet; it sorts by when it was begun.
            default => $query->orderByRaw('COALESCE(orders.placed_at, orders.created_at) '.$dir),
        };

        $query->orderBy('orders.id', $dir);
    }

    /**
     * One row as the list shows it.
     *
     * @return array<string, mixed>
     */
    public function row(Order $order): array
    {
        $customer = $order->customer;
        $name = $customer === null ? null : trim(($customer->firstname ?? '').' '.($customer->lastname ?? ''));
        $at = $order->placed_at ?? ($order->created_at === null ? null : CarbonImmutable::instance($order->created_at));

        return [
            'id' => (int) $order->id,
            'number' => $order->order_number,
            'placed' => $order->placed_at !== null,
            'date' => GermanFormat::date($at),
            'at' => GermanFormat::dateTime($at),
            'iso' => $at?->toIso8601String(),
            'customer' => $name === null || $name === '' ? null : $name,
            'email' => $customer?->email,
            'vehicle' => $order->vehicle_label,
            // Minor units: the page writes the amount (num.ts formatMoney), the export sums the column.
            'total' => (int) $order->total_cents,
            'currency' => $order->currency ?? 'EUR',
            'status' => $order->status->value,
            'statusLabel' => $order->status->labelDe(),
            'payment' => $order->status->paymentState(),
            'fulfilment' => $order->status->fulfilmentState($order->shipped_at !== null, $order->delivered_at !== null),
            'paymentMethod' => self::paymentLabel($order->payment_method),
            'shippingMethod' => self::shippingLabel($order->shipping_method),
            'conditions' => (bool) ($order->getAttribute('has_conditions') ?? false),
            // Born demo, or a demo wheel on it (Order::isDemo, one rule in one query).
            'demo' => (bool) $order->getAttribute('is_demo') || (bool) ($order->getAttribute('shows_demo') ?? false),
            // Paid with the review's test payment: no money moved, whatever the status says (§5).
            'test' => $order->payment_method === 'sandbox',
            'href' => '/admin/bestellungen/'.$order->id,
        ];
    }

    /**
     * What the filters can offer: every status with how many orders carry it, and only the payment
     * and shipping methods some order actually has — an option that finds nothing by construction
     * is a dead end.
     *
     * @return array{statuses: list<array{value: string, label: string, count: int}>, payment: list<array{value: string, label: string}>, shipping: list<array{value: string, label: string}>}
     */
    public function options(): array
    {
        $counts = DB::table('orders')->select('status')->selectRaw('COUNT(*) as n')->groupBy('status')->pluck('n', 'status');
        $open = 0;

        foreach (OrderStatus::open() as $status) {
            $open += (int) ($counts[$status->value] ?? 0);
        }

        $paid = 0;

        foreach (OrderStatus::revenue() as $status) {
            $paid += (int) ($counts[$status->value] ?? 0);
        }

        $statuses = [
            ['value' => self::OPEN, 'label' => 'Zu versenden (bezahlt)', 'count' => $open],
            ['value' => self::PAID, 'label' => 'Bezahlt, nicht erstattet', 'count' => $paid],
        ];

        foreach (OrderStatus::cases() as $status) {
            $statuses[] = ['value' => $status->value, 'label' => $status->labelDe(), 'count' => (int) ($counts[$status->value] ?? 0)];
        }

        $methods = static fn (string $column, callable $label): array => DB::table('orders')
            ->whereNotNull($column)
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->map(static fn (mixed $value): array => ['value' => (string) $value, 'label' => (string) $label((string) $value)])
            ->values()
            ->all();

        return [
            'statuses' => $statuses,
            'payment' => $methods('payment_method', self::paymentLabel(...)),
            'shipping' => $methods('shipping_method', self::shippingLabel(...)),
        ];
    }

    public static function paymentLabel(?string $method): ?string
    {
        if ($method === null || $method === '') {
            return null;
        }

        return self::PAYMENT_METHODS[$method] ?? self::spelled($method);
    }

    /** Shipping methods are the shop's own names (Einstellungen › Versand), shown as they were given. */
    public static function shippingLabel(?string $method): ?string
    {
        return $method === null || $method === '' ? null : self::spelled($method);
    }

    private static function spelled(string $code): string
    {
        return ucfirst(str_replace('_', ' ', $code));
    }

    /** Midnight in Berlin on that calendar day (plus `$days`), as the UTC instant the table stores. */
    private static function berlinMidnight(string $day, int $days = 0): string
    {
        $date = CarbonImmutable::createFromFormat('!Y-m-d', $day, GermanFormat::TIMEZONE);

        return $date instanceof CarbonImmutable ? $date->addDays($days)->utc()->format('Y-m-d H:i:s') : $day;
    }
}
