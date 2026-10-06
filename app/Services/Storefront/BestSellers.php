<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Enums\CatalogueStatus;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * What the shop has actually sold in the last 90 days, per wheel model (the client's #5, D-110, the operator's brief
 * „THE 34“): the paid order lines that hold the model — as a Felge or as a Komplettrad — counted by the day they were
 * paid. Demonstration orders never count, nor an order that was never paid or was cancelled — nor one paid with a test
 * payment, the review's sandbox or Stripe in test mode (D-147): no money moved, and the invoice and the order's own tag
 * already call it a test.
 *
 * The homepage's shelf is „Meistgekaufte Felgen“ only while this has something to say; until then it is „Neu im Shop“,
 * newest first — never a bestseller claim without a sale behind it.
 */
final class BestSellers
{
    /** How far back a sale counts. */
    public const WINDOW_DAYS = 90;

    /** The review's stand-in for a payment provider (App\Payments\SandboxGateway). */
    private const SANDBOX = 'sandbox';

    /**
     * Read fresh on every call, never kept on the instance: a controller holding this service outlives one request
     * (the route keeps its controller), and a sale must show on the next page view.
     *
     * @return array<int, int> model id → paid order lines that hold it in the window, most first
     */
    public function counts(): array
    {
        return self::query()
            ->groupBy('c.wheel_model_id')
            ->selectRaw('c.wheel_model_id AS model, COUNT(l.id) AS line_count')
            ->orderByDesc('line_count')
            ->pluck('line_count', 'model')
            ->mapWithKeys(static fn (mixed $lines, mixed $model): array => [(int) $model => (int) $lines])
            ->all();
    }

    /** Whether anything has been sold in the window — the moment „Meistgekaufte Felgen“ becomes true. */
    public function any(): bool
    {
        return self::query()->exists();
    }

    /**
     * The subquery the catalogue orders by — the model `wm` of ProductCards::catalogue(), its paid order lines in the
     * window — with its values bound in order (R-14: only the placeholders are generated).
     *
     * @return array{0: string, 1: list<string>}
     */
    public static function orderSql(): array
    {
        $statuses = self::statuses();

        return [
            '(SELECT COUNT(l.id) FROM order_lines l JOIN orders o ON o.id = l.order_id JOIN wheel_configs c ON c.id = l.wheel_config_id'
            .' WHERE c.wheel_model_id = wm.id AND l.kind IN (?, ?) AND o.is_demo = 0'
            .' AND (o.payment_method IS NULL OR o.payment_method <> ?)'
            .' AND NOT EXISTS (SELECT 1 FROM payment_events pe WHERE pe.order_id = o.id AND pe.livemode = ?)'
            .' AND COALESCE(o.paid_at, o.placed_at) >= ?'
            .' AND o.status IN ('.implode(', ', array_fill(0, count($statuses), '?')).')) DESC',
            [OrderLineKind::Wheel->value, OrderLineKind::Package->value, self::SANDBOX, '0', self::since(), ...$statuses],
        ];
    }

    /** The first moment that still counts, as the database stores it (UTC). */
    private static function since(): string
    {
        return CarbonImmutable::now('UTC')->subDays(self::WINDOW_DAYS)->format('Y-m-d H:i:s');
    }

    private static function query(): Builder
    {
        // Only wheels the shelf can show: a model sold and since unpublished must not make „Meistgekaufte Felgen“ true.
        return DB::table('order_lines as l')
            ->join('orders as o', 'o.id', '=', 'l.order_id')
            ->join('wheel_configs as c', 'c.id', '=', 'l.wheel_config_id')
            ->join('wheel_models as m', 'm.id', '=', 'c.wheel_model_id')
            ->whereIn('l.kind', [OrderLineKind::Wheel->value, OrderLineKind::Package->value])
            ->where('o.is_demo', false)
            ->where(static fn (Builder $paid): Builder => $paid->whereNull('o.payment_method')->orWhere('o.payment_method', '<>', self::SANDBOX))
            ->whereNotExists(static fn (Builder $event): Builder => $event->from('payment_events as pe')->whereColumn('pe.order_id', 'o.id')->where('pe.livemode', false))
            ->whereIn('o.status', self::statuses())
            ->whereRaw('COALESCE(o.paid_at, o.placed_at) >= ?', [self::since()])
            ->where('m.status', CatalogueStatus::Published->value)
            ->whereNull('m.deleted_at');
    }

    /** @return list<string> */
    private static function statuses(): array
    {
        return array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue());
    }
}
