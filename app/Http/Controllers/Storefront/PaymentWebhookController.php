<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPaymentEvent;
use App\Payments\Payments;
use App\Payments\WebhookRejected;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * The payment provider's webhook (POST /webhooks/stripe, outside the CSRF check — it carries a signature
 * instead). Fast: the signature verified, the event stored raw, a 200 — and the work queued (ProcessPaymentEvent).
 * A repeated delivery of a stored event is answered 200 and does nothing. A bad signature is a 400 and stores
 * nothing; with no driver in force it is a 503, so the provider tries again once the keys are in.
 */
final class PaymentWebhookController extends Controller
{
    public function __invoke(Request $request, string $provider): JsonResponse
    {
        $gateway = Payments::for($provider);

        if ($gateway === null) {
            return response()->json(['received' => false, 'error' => 'no driver in force'], 503);
        }

        try {
            $receipt = $gateway->handleWebhook($request->getContent(), $request->header('Stripe-Signature'));
        } catch (WebhookRejected $e) {
            Log::warning('Payment webhook refused', ['provider' => $provider, 'reason' => $e->getMessage()]);

            return response()->json(['received' => false, 'error' => 'signature'], 400);
        }

        if ($receipt->new) {
            // On a queue the job waits there; the shared host runs no worker (QUEUE_CONNECTION=sync), so the job
            // runs after the 200 has left instead of before it (D-054).
            config('queue.default') === 'sync'
                ? ProcessPaymentEvent::dispatch($receipt->event->id)->afterResponse()
                : ProcessPaymentEvent::dispatch($receipt->event->id);
        }

        return response()->json(['received' => true, 'duplicate' => ! $receipt->new]);
    }
}
