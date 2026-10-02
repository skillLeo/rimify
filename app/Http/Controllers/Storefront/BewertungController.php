<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ReviewRequest;
use App\Models\Order;
use App\Services\Commerce\Reviews\ReviewWriter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * `/bewertung/{number}` — the page the review invitation links to (the client's #19, D-103): the order's rims, each
 * rated once with stars and, if the buyer likes, a sentence. Signed: the link is the proof of purchase, no account
 * needed. An order not delivered, or a demonstration, has no such page — the designed 404.
 */
class BewertungController extends Controller
{
    public function show(Request $request, string $number, ReviewWriter $writer): Response
    {
        $order = $this->order($number);

        return Inertia::render('Bewertung/Index', [
            'number' => $order->order_number,
            'lines' => $writer->lines($order),
            // The same signed address: the form is sent back to it, and the signature with it.
            'action' => $request->fullUrl(),
        ]);
    }

    public function store(ReviewRequest $request, string $number, ReviewWriter $writer): RedirectResponse
    {
        $written = $writer->write($this->order($number), $request->ratings());

        return back()->with('toast', $written === 0
            ? 'Diese Felgen hast du schon bewertet – danke!'
            : 'Danke für deine Bewertung!');
    }

    private function order(string $number): Order
    {
        $order = Order::query()->where('order_number', $number)->first();

        abort_if($order === null || ! ReviewWriter::open($order), 404);

        return $order;
    }
}
