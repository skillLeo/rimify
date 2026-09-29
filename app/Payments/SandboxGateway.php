<?php

declare(strict_types=1);

namespace App\Payments;

use App\Models\Order;
use Illuminate\Support\Facades\URL;

/**
 * A payment that is not one: the review's test orders (the review release §1) run checkout, snapshot
 * and Verkauf end to end, and the customer chooses the outcome on a page that says what it is —
 * bezahlt, abgelehnt, abgebrochen. No money moves and no provider is asked.
 *
 * Only where the review is on (Payments::gateway): the live shop never gets it.
 */
final class SandboxGateway implements PaymentGateway
{
    /** How long the test payment page stays valid for its order. */
    public const MINUTES = 30;

    public function method(): string
    {
        return 'sandbox';
    }

    public function start(Order $order): string
    {
        return URL::temporarySignedRoute('kasse.testzahlung', now()->addMinutes(self::MINUTES), ['order' => $order->order_number]);
    }
}
