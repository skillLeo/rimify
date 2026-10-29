<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\TestPaymentRequest;
use App\Models\Order;
use App\Services\Commerce\OrderPayments;
use App\Services\Storefront\Basket;
use App\Services\Storefront\Chrome;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The sandbox's payment page (the review release §1): the test order as written, and the three ways
 * a payment ends — bezahlt, abgelehnt, abgebrochen — chosen by whoever is testing. Paid, the order is
 * PAID (its stock was reserved when it was written) and the basket is empty, as a real payment would leave
 * them. The page says on every line that no money moves.
 */
class TestzahlungController extends Controller
{
    public function show(TestPaymentRequest $request, Basket $basket): Response
    {
        $order = self::order($request);

        return Inertia::render('Kasse/Testzahlung', [
            'order' => [
                'number' => $order->order_number,
                'total' => GermanFormat::money($order->total_cents),
                'lines' => $order->lines->map(static fn ($line): array => [
                    'label' => (string) $line->getAttribute('label'),
                    'quantity' => (int) $line->getAttribute('quantity'),
                    'total' => GermanFormat::money((int) $line->getAttribute('line_total_cents')),
                ])->values()->all(),
                'note' => $order->getAttribute('note'),
            ],
            'contact' => Chrome::contact(),
        ]);
    }

    public function store(TestPaymentRequest $request, Basket $basket, OrderPayments $payments): RedirectResponse
    {
        $order = self::order($request);
        $outcome = $request->outcome();

        // The same path a real payment takes (OrderPayments): paid at the order's total, declined (the order
        // keeps its stock for a retry until it expires), or cancelled (its stock goes back on the shelf).
        match ($outcome) {
            'bezahlt' => $payments->paid($order, $order->total_cents, (string) $order->getAttribute('currency'), 'Testzahlung', null),
            'abgelehnt' => $payments->move($order, OrderStatus::Failed, 'Testzahlung', null, ['payment_error' => 'Testzahlung abgelehnt']),
            default => $payments->move($order, OrderStatus::Cancelled, 'Testzahlung'),
        };

        if ($outcome === 'bezahlt') {
            $basket->clear($request);
            $basket->forgetTpms($request);
        }

        return redirect()->route('bestellung.show', ['order' => $order->public_id])->with('toast', match ($outcome) {
            'bezahlt' => 'Testzahlung erfolgreich – die Bestellung ist bezahlt.',
            'abgelehnt' => 'Testzahlung abgelehnt – die Bestellung ist nicht bezahlt.',
            default => 'Testzahlung abgebrochen – die Bestellung ist storniert.',
        });
    }

    private static function order(TestPaymentRequest $request): Order
    {
        $order = $request->order();
        abort_if($order === null, 404);

        return $order->load('lines');
    }
}
