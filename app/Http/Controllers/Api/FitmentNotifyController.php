<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\FitmentNotifyRequest;
use App\Mail\SubscriptionConfirmationMail;
use App\Models\FitmentSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

/**
 * F2 — "Sag mir Bescheid, wenn es passt". Always 202: whether the address is new, already
 * waiting or already confirmed, the answer is the same sentence, so the endpoint cannot be used
 * to find out who subscribed. A confirmation mail goes out only while the address is unconfirmed.
 */
class FitmentNotifyController extends Controller
{
    public function __invoke(FitmentNotifyRequest $request): JsonResponse
    {
        $subscription = FitmentSubscription::query()->firstOrCreate(
            ['email' => $request->email(), 'vehicle_id' => $request->vehicleId()],
            ['source' => 'startseite'],
        );

        // Someone who unsubscribed and signs up again has changed their mind; the opt-in runs again.
        if ($subscription->unsubscribed_at !== null) {
            $subscription->forceFill(['unsubscribed_at' => null, 'confirmed_at' => null])->save();
        }

        if ($subscription->confirmed_at === null) {
            Mail::to($subscription->email)->send(new SubscriptionConfirmationMail($subscription));
        }

        return response()->json([
            'message' => 'Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.',
        ], 202);
    }
}
