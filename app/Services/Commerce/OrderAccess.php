<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Http\Controllers\Storefront\BestellungController;
use App\Models\CustomerAccount;
use App\Models\Order;
use Illuminate\Http\Request;

/**
 * Who may open an order's page and ask after its payment — one rule for both (EIGENE-FUNDE 131, the operator's rule of
 * 15.10.2026, D-238): a seeded order opens by number; an order that came through the checkout requires its proof —
 * its signed link, the browser that placed it, or the signed-in account it was placed under — always, in every
 * environment, whatever it contains. Its number alone opens nothing: anyone else gets the same 404 as an order that
 * does not exist.
 */
final class OrderAccess
{
    public static function allows(Request $request, Order $order): bool
    {
        if ($order->seeded()) {
            return true;
        }

        $placed = $request->session()->get(BestellungController::SESSION_PLACED);
        $account = $request->user('customer');

        return $request->hasValidSignature()
            || (is_array($placed) && in_array($order->order_number, $placed, true))
            || ($account instanceof CustomerAccount && mb_strtolower((string) $order->customer?->email) === $account->email);
    }
}
