<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use App\Exceptions\IllegalOrderTransition;
use App\Models\AuditLog;
use App\Models\Order;
use App\Services\Commerce\OrderPayments;

/*
 * Block G: the order state machine lives in the model — an illegal move is impossible there, whatever writes it —
 * and every move OrderPayments makes is audited with who or what made it and the event that caused it.
 */

it('allows exactly the moves the state machine lists', function (OrderStatus $from, OrderStatus $to, bool $allowed): void {
    $order = Order::factory()->status($from)->create();
    $move = static fn () => $order->forceFill(['status' => $to->value])->save();

    if ($allowed) {
        expect($move)->not->toThrow(IllegalOrderTransition::class);
        expect($order->fresh()->status)->toBe($to);
    } else {
        expect($move)->toThrow(IllegalOrderTransition::class);
        expect($order->fresh()->status)->toBe($from);
    }
})->with([
    'waiting → paying' => [OrderStatus::PendingPayment, OrderStatus::Processing, true],
    'waiting → paid' => [OrderStatus::PendingPayment, OrderStatus::Paid, true],
    'waiting → expired' => [OrderStatus::PendingPayment, OrderStatus::Expired, true],
    'failed → paid (a retry)' => [OrderStatus::Failed, OrderStatus::Paid, true],
    'paid → shipped' => [OrderStatus::Paid, OrderStatus::Shipped, true],
    'paid → partially refunded' => [OrderStatus::Paid, OrderStatus::PartiallyRefunded, true],
    'partially → fully refunded' => [OrderStatus::PartiallyRefunded, OrderStatus::Refunded, true],
    'waiting → shipped (never paid)' => [OrderStatus::PendingPayment, OrderStatus::Shipped, false],
    'paying → expired (SEPA settles)' => [OrderStatus::Processing, OrderStatus::Expired, false],
    'paid → waiting' => [OrderStatus::Paid, OrderStatus::PendingPayment, false],
    'paid → cancelled' => [OrderStatus::Paid, OrderStatus::Cancelled, false],
    'refunded → paid' => [OrderStatus::Refunded, OrderStatus::Paid, false],
    'expired → paid' => [OrderStatus::Expired, OrderStatus::Paid, false],
    'cancelled → waiting' => [OrderStatus::Cancelled, OrderStatus::PendingPayment, false],
]);

it('ends where it must: cancelled, expired and refunded go nowhere', function (): void {
    foreach ([OrderStatus::Cancelled, OrderStatus::Expired, OrderStatus::Refunded] as $end) {
        expect($end->next())->toBe([]);
    }
});

it('audits every move with who made it and the event that caused it, and refuses the others quietly', function (): void {
    $order = Order::factory()->pendingPayment()->create();
    $payments = app(OrderPayments::class);

    expect($payments->move($order, OrderStatus::Processing, 'Stripe', 'evt_123'))->toBeTrue()
        ->and($payments->move($order, OrderStatus::Shipped, 'Stripe', 'evt_124'))->toBeFalse();

    $entry = AuditLog::query()->where('description', 'order.status_changed')->sole();

    expect($entry->properties->toArray())->toMatchArray(['order' => $order->order_number, 'from' => 'PENDING_PAYMENT', 'to' => 'PROCESSING', 'event_id' => 'evt_123'])
        ->and($entry->actor_email)->toBe('Stripe')
        ->and($entry->subject_id)->toBe($order->id);
});
