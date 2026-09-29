<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\TestPaymentRequest;
use App\Models\Order;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Services\Storefront\Basket;
use App\Services\Storefront\Chrome;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The sandbox's payment page (the review release §1): the test order as written, and the three ways
 * a payment ends — bezahlt, abgelehnt, abgebrochen — chosen by whoever is testing. Paid, the order is
 * PAID, its stock is taken and the basket is empty, as a real payment would leave them. The page says
 * on every line that no money moves.
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

    public function store(TestPaymentRequest $request, Basket $basket): RedirectResponse
    {
        $order = self::order($request);
        $outcome = $request->outcome();

        DB::transaction(static function () use ($order, $outcome): void {
            if ($outcome !== 'bezahlt') {
                $order->forceFill(['status' => ($outcome === 'abgelehnt' ? OrderStatus::Failed : OrderStatus::Cancelled)->value])->save();

                return;
            }

            $order->forceFill(['status' => OrderStatus::Paid->value, 'paid_at' => now()])->save();

            // Paid goods leave the stock, as with a real payment.
            foreach ($order->lines as $line) {
                $quantity = (int) $line->getAttribute('quantity');

                if ($line->getAttribute('wheel_config_id') !== null) {
                    WheelConfig::query()->whereKey($line->getAttribute('wheel_config_id'))->where('stock_qty', '>=', $quantity)->decrement('stock_qty', $quantity);
                }

                if ($line->getAttribute('tyre_variant_id') !== null) {
                    TyreVariant::query()->whereKey($line->getAttribute('tyre_variant_id'))->where('stock_qty', '>=', $quantity)->decrement('stock_qty', $quantity);
                }
            }
        });

        if ($outcome === 'bezahlt') {
            $basket->clear($request);
            $basket->forgetTpms($request);
        }

        return redirect()->route('bestellung.show', ['order' => $order->order_number])->with('toast', match ($outcome) {
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
