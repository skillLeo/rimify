<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Enums\OrderStatus;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\PaymentEvent;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Payments\PaymentSignal;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * What money does to an order — provider-neutral: the checkout, the webhook's job, the sandbox, the expiry run
 * and the refund all go through here.
 *
 * - Stock is reserved when the order is written (reserve, inside OrderWriter's transaction) and released when it
 *   dies unpaid — storniert, abgelaufen.
 * - An order moves only where OrderStatus::next() allows; a late event that would move it backwards (a
 *   `processing` after `succeeded`) is recorded and ignored. Every move is audited with the event that caused it.
 * - Paid means the provider's signed event said so, for the order's own total: an amount that does not match
 *   still records the payment, and flags the order so it is not fulfilled until a person has looked.
 */
final class OrderPayments
{
    /** How long an unpaid order holds its stock and its payment. */
    public const HOURS_TO_PAY = 24;

    public const OUT_OF_STOCK = 'Ein Artikel in deinem Warenkorb ist nicht mehr in dieser Menge auf Lager. Es wurde nichts bestellt und nichts berechnet.';

    /**
     * Takes the order's goods off the shelf, all or nothing: each decrement only where enough is left. Call inside
     * the transaction that writes the order.
     *
     * @throws OrderRefused
     */
    public function reserve(Order $order): void
    {
        foreach ($order->lines()->get() as $line) {
            $quantity = (int) $line->getAttribute('quantity');

            foreach ([[WheelConfig::class, 'wheel_config_id'], [TyreVariant::class, 'tyre_variant_id']] as [$model, $column]) {
                $id = $line->getAttribute($column);

                if ($id === null) {
                    continue;
                }

                $taken = $model::query()->whereKey($id)->where('stock_qty', '>=', $quantity)->decrement('stock_qty', $quantity);

                if ($taken !== 1) {
                    throw new OrderRefused(self::OUT_OF_STOCK);
                }
            }
        }

        $order->forceFill(['stock_reserved' => true, 'expires_at' => ($order->placed_at ?? now())->addHours(self::HOURS_TO_PAY)])->save();
    }

    /** Puts a dead order's goods back on the shelf, once. */
    public function release(Order $order): void
    {
        if (! $order->stock_reserved) {
            return;
        }

        foreach ($order->lines()->get() as $line) {
            $quantity = (int) $line->getAttribute('quantity');

            if ($line->getAttribute('wheel_config_id') !== null) {
                WheelConfig::query()->whereKey($line->getAttribute('wheel_config_id'))->increment('stock_qty', $quantity);
            }

            if ($line->getAttribute('tyre_variant_id') !== null) {
                TyreVariant::query()->whereKey($line->getAttribute('tyre_variant_id'))->increment('stock_qty', $quantity);
            }
        }

        $order->forceFill(['stock_reserved' => false])->save();
    }

    /**
     * Moves the order, if its state machine allows it; returns whether it moved. Audited with who or what moved
     * it and the provider event that caused it.
     *
     * @param  array<string, mixed>  $attributes  columns written with the move
     * @param  array<string, mixed>  $properties  what the audit entry carries besides the move
     */
    public function move(Order $order, OrderStatus $to, string $by, ?string $eventId = null, array $attributes = [], array $properties = []): bool
    {
        return DB::transaction(function () use ($order, $to, $by, $eventId, $attributes, $properties): bool {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $from = $order->status;

            if ($from === $to || ! $from->canBecome($to)) {
                return false;
            }

            $order->forceFill(['status' => $to->value] + $attributes)->save();

            if (in_array($to, [OrderStatus::Cancelled, OrderStatus::Expired], true)) {
                $this->release($order);
            }

            AuditTrail::system($by, 'order.status_changed', [
                'order' => $order->order_number,
                'from' => $from->value,
                'to' => $to->value,
                'event_id' => $eventId,
            ] + $properties, $order);

            return true;
        });
    }

    /** The payment arrived: paid — and flagged when the amount is not the order's. */
    public function paid(Order $order, int $amountCents, string $currency, string $by, ?string $eventId): bool
    {
        $flag = $amountCents === $order->total_cents && strtoupper($currency) === strtoupper((string) $order->getAttribute('currency'))
            ? null
            : sprintf(
                'Betrag stimmt nicht: bezahlt wurden %s, die Bestellung lautet auf %s. Erst prüfen, dann versenden.',
                GermanFormat::money($amountCents, strtoupper($currency)),
                GermanFormat::money($order->total_cents),
            );

        if ($flag !== null) {
            Log::warning('Payment amount does not match the order', ['order' => $order->order_number, 'paid' => $amountCents, 'currency' => $currency, 'total' => $order->total_cents, 'event' => $eventId]);
        }

        return $this->move($order, OrderStatus::Paid, $by, $eventId, ['paid_at' => now(), 'payment_flag' => $flag, 'payment_error' => null], ['amount_cents' => $amountCents, 'flag' => $flag]);
    }

    /**
     * A provider's signal, applied to its order — the webhook job's one entry. Returns the outcome written onto
     * the stored event (`paid`, `ignored: …`, `no order`, …).
     */
    public function apply(PaymentSignal $signal, PaymentEvent $event, string $by): string
    {
        $order = $this->orderOf($signal, $event);

        if ($signal->kind === PaymentSignal::DISPUTE_OPENED || $signal->kind === PaymentSignal::DISPUTE_CLOSED) {
            return $this->dispute($signal, $order, $event, $by);
        }

        if ($order === null) {
            Log::warning('Payment event for no order', ['event' => $event->event_id, 'type' => $event->type]);

            return 'no order';
        }

        $moved = match ($signal->kind) {
            PaymentSignal::PROCESSING => $this->move($order, OrderStatus::Processing, $by, $event->event_id),
            PaymentSignal::SUCCEEDED => $this->paid($order, (int) $signal->amountCents, (string) ($signal->currency ?? 'EUR'), $by, $event->event_id),
            PaymentSignal::FAILED => $this->move($order, OrderStatus::Failed, $by, $event->event_id, ['payment_error' => $signal->message === null ? null : mb_substr($signal->message, 0, 255)], ['message' => $signal->message]),
            PaymentSignal::CANCELED => $this->move($order, OrderStatus::Cancelled, $by, $event->event_id),
            PaymentSignal::REFUNDED => $this->refunded($order, (int) $signal->refundedCents, $by, $event->event_id),
            default => false,
        };

        return $moved ? $signal->kind : 'ignored: '.$order->fresh()?->status->value;
    }

    /** The provider says this much has been refunded in all: erstattet or teilweise erstattet. */
    public function refunded(Order $order, int $refundedCents, string $by, ?string $eventId): bool
    {
        $refundedCents = min($refundedCents, $order->total_cents);
        $to = $refundedCents >= $order->total_cents ? OrderStatus::Refunded : OrderStatus::PartiallyRefunded;

        if ($refundedCents <= $order->refunded_cents) {
            return false;
        }

        return $this->move($order, $to, $by, $eventId, ['refunded_cents' => $refundedCents], ['refunded_cents' => $refundedCents]);
    }

    private function orderOf(PaymentSignal $signal, PaymentEvent $event): ?Order
    {
        $id = $signal->orderId ?? $event->order_id;

        if ($id !== null) {
            return Order::query()->find($id);
        }

        return $signal->paymentId === null ? null : Order::query()->where('stripe_payment_intent_id', $signal->paymentId)->first();
    }

    private function dispute(PaymentSignal $signal, ?Order $order, PaymentEvent $event, string $by): string
    {
        $data = $signal->dispute;

        if ($data === null || $data['id'] === '') {
            return 'ignored: no dispute';
        }

        $dispute = Dispute::query()->firstOrNew(['provider_dispute_id' => $data['id']]);
        $opening = ! $dispute->exists;
        $dispute->fill([
            'order_id' => $order?->id,
            'provider' => $event->provider,
            'charge_id' => $data['charge'],
            'reason' => $data['reason'],
            'amount_cents' => $data['amountCents'],
            'currency' => $data['currency'],
            'status' => $data['status'],
            'evidence_due_by' => $data['dueBy'] === null ? $dispute->evidence_due_by : now()->setTimestamp($data['dueBy']),
        ]);

        if ($signal->kind === PaymentSignal::DISPUTE_CLOSED) {
            $dispute->fill(['closed_at' => now(), 'outcome' => $data['outcome']]);
        }

        $dispute->save();

        AuditTrail::system($by, $opening ? 'dispute.opened' : 'dispute.updated', [
            'order' => $order?->order_number,
            'dispute' => $data['id'],
            'reason' => $data['reason'],
            'amount_cents' => $data['amountCents'],
            'status' => $data['status'],
            'outcome' => $data['outcome'],
            'event_id' => $event->event_id,
        ], $order);

        return $signal->kind;
    }
}
