<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

/**
 * The link to an order in its mails (the operator's answer of 15.10.2026, D-240): twelve months, and expiry is not a
 * dead end. A signed link is not guessable, but an indefinite one is an address and a purchase history behind a URL
 * that gets forwarded, lands in shared inboxes and outlives the mailbox's security. So it lasts twelve months; after
 * that it leads to a page that says so in one sentence and sends a fresh link to the address the order went to. The
 * order itself is kept for tax regardless — retention of the record and public access to it are different things.
 */
final class OrderLinks
{
    public const MONTHS = 12;

    public static function link(Order $order): string
    {
        return URL::temporarySignedRoute('bestellung.show', now()->addMonths(self::MONTHS), ['order' => $order->public_id]);
    }

    /** A link of ours that still opens the order: signed by us, and within its twelve months. */
    public static function valid(Request $request): bool
    {
        return $request->query('expires') !== null && $request->hasValidSignature();
    }

    /**
     * A link of ours whose time is up — or one from before links expired, which never carried a time: signed by us,
     * so its holder had the order once, and gets the way back rather than a 404. A forged one gets the 404.
     */
    public static function expired(Request $request): bool
    {
        return $request->query('signature') !== null
            && URL::hasCorrectSignature($request)
            && ($request->query('expires') === null || ! URL::signatureHasNotExpired($request));
    }
}
