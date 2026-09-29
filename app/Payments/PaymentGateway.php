<?php

declare(strict_types=1);

namespace App\Payments;

use App\Models\Order;

/**
 * How an order is paid (BLOCKED #3): one driver per provider — PayPal, Klarna, Stripe — behind this
 * one contract, chosen by `rimify.payments.driver`. Until a real provider is configured, the shop
 * takes no orders (KasseController::PREVIEW_REFUSAL); where the review is on, the SandboxGateway
 * lets a test order run the whole way without money moving.
 */
interface PaymentGateway
{
    /** The value an order's `payment_method` carries: `sandbox`, `paypal`, … */
    public function method(): string;

    /** Where the customer goes to pay this order, already written as PENDING_PAYMENT. */
    public function start(Order $order): string;
}
