<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Enums\CatalogueStatus;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * What the shop has actually sold, per wheel model (the client's #5, D-110): paid orders that hold the model — as a
 * Felge or as a Komplettrad — each order once, so a set of four counts once, as the admin's „Meistbestellte Felgen“
 * counts. Demonstration orders never count, nor an order that was never paid or was cancelled — nor one paid with a
 * test payment, the review's sandbox or Stripe in test mode (D-147): no money moved, and the invoice and the order's
 * own tag already call it a test.
 *
 * The homepage calls its first shelf „Meistgekauft“ only while this has something to say; until the first sale it
 * keeps the order it can prove — the most approvals — and says so.
 */
final class BestSellers
{
    /** The review's stand-in for a payment provider (App\Payments\SandboxGateway). */
    private const SANDBOX = 'sandbox';

    /**
     * Read fresh on every call, never kept on the instance: a controller holding this service outlives one request
     * (the route keeps its controller), and a sale must show on the next page view.
     *
     * @return array<int, int> model id → paid orders that hold it, most first
     */
    public function counts(): array
    {
        return self::query()
            ->groupBy('c.wheel_model_id')
            ->selectRaw('c.wheel_model_id AS model, COUNT(DISTINCT o.id) AS orders')
            ->orderByDesc('orders')
            ->pluck('orders', 'model')
            ->mapWithKeys(static fn (mixed $orders, mixed $model): array => [(int) $model => (int) $orders])
            ->all();
    }

    /** Whether anything has been sold yet — the moment „Meistgekauft“ becomes true. */
    public function any(): bool
    {
        return self::query()->exists();
    }

    /**
     * The subquery the catalogue orders by — the model `wm` of ProductCards::catalogue(), its paid orders — with its
     * values bound in order (R-14: only the placeholders are generated).
     *
     * @return array{0: string, 1: list<string>}
     */
    public static function orderSql(): array
    {
        $statuses = self::statuses();

        return [
            '(SELECT COUNT(DISTINCT o.id) FROM order_lines l JOIN orders o ON o.id = l.order_id JOIN wheel_configs c ON c.id = l.wheel_config_id'
            .' WHERE c.wheel_model_id = wm.id AND l.kind IN (?, ?) AND o.is_demo = 0'
            .' AND (o.payment_method IS NULL OR o.payment_method <> ?)'
            .' AND NOT EXISTS (SELECT 1 FROM payment_events pe WHERE pe.order_id = o.id AND pe.livemode = ?)'
            .' AND o.status IN ('.implode(', ', array_fill(0, count($statuses), '?')).')) DESC',
            [OrderLineKind::Wheel->value, OrderLineKind::Package->value, self::SANDBOX, '0', ...$statuses],
        ];
    }

    private static function query(): Builder
    {
        // Only wheels the shelf can show: a model sold and since unpublished must not make „Meistgekauft“ true.
        return DB::table('order_lines as l')
            ->join('orders as o', 'o.id', '=', 'l.order_id')
            ->join('wheel_configs as c', 'c.id', '=', 'l.wheel_config_id')
            ->join('wheel_models as m', 'm.id', '=', 'c.wheel_model_id')
            ->whereIn('l.kind', [OrderLineKind::Wheel->value, OrderLineKind::Package->value])
            ->where('o.is_demo', false)
            ->where(static fn (Builder $paid): Builder => $paid->whereNull('o.payment_method')->orWhere('o.payment_method', '<>', self::SANDBOX))
            ->whereNotExists(static fn (Builder $event): Builder => $event->from('payment_events as pe')->whereColumn('pe.order_id', 'o.id')->where('pe.livemode', false))
            ->whereIn('o.status', self::statuses())
            ->where('m.status', CatalogueStatus::Published->value)
            ->whereNull('m.deleted_at');
    }

    /** @return list<string> */
    private static function statuses(): array
    {
        return array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::revenue());
    }
}
