<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Whether the shop issues its own invoices and credit notes (App\Services\Commerce\Invoices) — off since the client's
 * reply to his admin item 17 (D-348): Stripe creates and stores them. Off, nothing is issued, attached, numbered or
 * mentioned, in the shop, the mails or the admin; invoices issued before stay readable by their links.
 */
final class OwnInvoices
{
    public static function enabled(): bool
    {
        return (bool) config('rimify.own_invoices');
    }
}
