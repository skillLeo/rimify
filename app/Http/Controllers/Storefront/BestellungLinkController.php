<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\OrderLinkRequest;
use App\Mail\OrderLinkMail;
use App\Models\Order;
use App\Services\Commerce\OrderLinks;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * The way back from an expired order link (the operator's answer of 15.10.2026, D-240): the order number and the address
 * the order went to, and a fresh link goes to that same address — never to another. The answer is the same whether or
 * not the two belong together, so the form tells nobody which orders exist or who placed them.
 */
final class BestellungLinkController extends Controller
{
    public const SENT = 'Wenn Bestellnummer und Adresse zusammengehören, ist ein neuer Link an diese Adresse unterwegs. Er gilt zwölf Monate.';

    public function store(OrderLinkRequest $request): RedirectResponse
    {
        $order = Order::query()->with('customer')->where('order_number', $request->number())->first();

        if ($order !== null
            && mb_strtolower((string) $order->customer?->email) === $request->email()
            && Gate::allows('resendLink', $order)) {
            try {
                Mail::to((string) $order->customer?->email)->send(new OrderLinkMail($order, OrderLinks::link($order)));
            } catch (Throwable $e) {
                // A mail that fails is reported, never shown: an error page here would say that the two belonged together.
                report($e);
            }
        }

        return back()->with('toast', self::SENT);
    }
}
