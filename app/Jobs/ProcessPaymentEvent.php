<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\PaymentEvent;
use App\Payments\Payments;
use App\Services\Commerce\OrderPayments;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * The work behind a webhook, done after the provider has had its 200: the stored event translated by its driver
 * and applied to its order (OrderPayments). Once per event — an event already processed is left alone, so a job
 * run twice changes nothing — and the outcome is written onto the event row, which is how an order reconciles
 * with the provider's dashboard.
 */
final class ProcessPaymentEvent implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(public readonly int $eventId) {}

    /** @return list<int> */
    public function backoff(): array
    {
        return [10, 60, 300, 900];
    }

    public function handle(OrderPayments $payments): void
    {
        $event = PaymentEvent::query()->find($this->eventId);

        if ($event === null || $event->processed_at !== null) {
            return;
        }

        $gateway = Payments::for($event->provider);

        if ($gateway === null) {
            // The driver is not in force any more (keys removed, mode changed): kept, and handled when it is.
            $event->forceFill(['outcome' => 'waiting: no '.$event->provider.' driver'])->save();

            return;
        }

        $signal = $gateway->translate($event);
        $outcome = $signal === null ? 'not handled: '.$event->type : $payments->apply($signal, $event, ucfirst($event->provider));

        $event->forceFill(['processed_at' => now(), 'outcome' => mb_substr($outcome, 0, 64)])->save();
    }
}
