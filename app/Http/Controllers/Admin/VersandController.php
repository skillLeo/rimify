<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FulfilmentRequest;
use App\Models\Order;
use App\Services\Admin\Orders\OrderFulfilment;
use Illuminate\Http\RedirectResponse;

/**
 * Verkauf › Bestellungen › one order › „Als versendet markieren“ and „Als zugestellt markieren“ (D-103). Delivery is a
 * fact the team records, with its time; the review invitation goes out some days after it.
 */
class VersandController extends Controller
{
    public function ship(FulfilmentRequest $request, Order $order, OrderFulfilment $fulfilment): RedirectResponse
    {
        $fulfilment->ship($order, $request->admin(), $request->tracking());

        return back()->with('toast', "Bestellung {$order->order_number} als versendet markiert.");
    }

    public function deliver(FulfilmentRequest $request, Order $order, OrderFulfilment $fulfilment): RedirectResponse
    {
        $fulfilment->deliver($order, $request->admin());

        return back()->with('toast', "Bestellung {$order->order_number} als zugestellt markiert.");
    }
}
