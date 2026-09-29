<?php

declare(strict_types=1);

namespace App\Payments;

use App\Payments\Stripe\StripeGateway;

/**
 * Which payment driver is in force, or none (then the shop takes no orders). Fails closed: an unknown driver is
 * none; the sandbox is refused wherever the review is off — a live shop can never take a test payment for a real
 * order, whatever its environment says — and Stripe is none until all three of its keys are in force
 * (PaymentConfig: a key refused for its mode does not count).
 */
final class Payments
{
    public static function gateway(): ?PaymentGateway
    {
        $driver = (string) config('rimify.payments.driver', 'none');

        return match ($driver) {
            'sandbox' => (bool) config('rimify.review.enabled', false) ? new SandboxGateway : null,
            'stripe' => ($config = PaymentConfig::current())->complete() ? new StripeGateway($config) : null,
            default => null,
        };
    }

    /** The driver that handles a given order's payment: the one it was written with, where it is still in force. */
    public static function for(string $method): ?PaymentGateway
    {
        $gateway = self::gateway();

        return $gateway !== null && $gateway->method() === $method ? $gateway : null;
    }

    public static function sandbox(): bool
    {
        return self::gateway() instanceof SandboxGateway;
    }

    /** Stripe in Testmodus: the admin's banner and the checkout's strip say that no money moves. */
    public static function stripeTestMode(): bool
    {
        return config('rimify.payments.driver') === 'stripe' && PaymentConfig::current()->testMode();
    }
}
