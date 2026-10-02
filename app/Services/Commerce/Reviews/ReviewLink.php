<?php

declare(strict_types=1);

namespace App\Services\Commerce\Reviews;

use App\Models\Order;
use Illuminate\Support\Facades\URL;

/**
 * The one way into a review (D-103): a signed link to the order's own review page, sent in the invitation. No account,
 * no password — the signature is the proof that the person writing bought what they rate.
 */
final class ReviewLink
{
    public static function for(Order $order): string
    {
        return URL::temporarySignedRoute(
            'bewertung.show',
            now()->addDays(max(1, (int) config('rimify.reviews.link_days', 60))),
            ['number' => $order->order_number],
        );
    }
}
