<?php

declare(strict_types=1);

namespace App\Payments;

/**
 * Which payment driver is in force, or none (then the shop takes no orders). Fails closed: an
 * unknown driver is none, and the sandbox is refused wherever the review is off — so a live shop can
 * never take a test payment for a real order, whatever its environment says.
 */
final class Payments
{
    public static function gateway(): ?PaymentGateway
    {
        $driver = (string) config('rimify.payments.driver', 'none');

        return match ($driver) {
            'sandbox' => (bool) config('rimify.review.enabled', false) ? new SandboxGateway : null,
            default => null,
        };
    }

    public static function sandbox(): bool
    {
        return self::gateway() instanceof SandboxGateway;
    }
}
