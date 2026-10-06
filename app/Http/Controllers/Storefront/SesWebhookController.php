<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\SesNotificationRequest;
use App\Services\Mail\SesFeedback;
use Illuminate\Http\JsonResponse;

/**
 * Amazon SES's bounces and complaints, as SNS delivers them (POST /webhooks/ses, outside the CSRF check — the message
 * carries SNS's signature instead, checked with the topic by SesNotificationRequest). A confirmed subscription, a
 * suppressed address, or nothing — always a 200 once the message is SNS's, so SNS does not retry what was handled.
 */
final class SesWebhookController extends Controller
{
    public function __invoke(SesNotificationRequest $request, SesFeedback $feedback): JsonResponse
    {
        $message = $request->message();
        abort_if($message === null, 400);

        return response()->json(['received' => true, ...$feedback->handle($message)]);
    }
}
