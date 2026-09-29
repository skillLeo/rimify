<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Payments\PaymentFailure;
use App\Payments\Payments;
use App\Services\Storefront\Basket;
use Illuminate\Http\Request;

/**
 * This browser's unpaid order (Block G): written at „Zahlungspflichtig bestellen“, holding its goods until it is paid,
 * cancelled or expires. One rule for both payment paths — Stripe's (KasseZahlungController) and the review's sandbox
 * (KasseController::store):
 *
 * - a second press with the same basket, address and what the page showed reuses it — no second order, no second
 *   reservation (a sandbox order that was declined is replaced, since its page takes only an open one);
 * - a press with anything changed cancels it first, so its goods go back before the new order takes them;
 * - the basket counts its goods as the customer's own (`held`): a declined payment never makes the customer's last
 *   wheels look sold out to the customer who holds them;
 * - once it is paid, the basket empties and the record goes (`settle`).
 */
final class PendingOrder
{
    public const SESSION = 'kasse.pending';

    public const ALREADY_PROCESSING = 'Die Zahlung für deine Bestellung %s läuft schon. Sobald sie bestätigt ist, bekommst du eine E-Mail.';

    public function __construct(private readonly OrderPayments $payments) {}

    /**
     * What a press is made of: the customer's data and what the page showed (CheckoutShown).
     *
     * @param  array<string, mixed>  $customer
     */
    public static function fingerprint(array $customer, string $shown): string
    {
        return hash('sha256', (string) json_encode([$customer, $shown]));
    }

    public function order(Request $request): ?Order
    {
        $pending = $request->session()->get(self::SESSION);

        if (! is_array($pending) || ! is_string($pending['order'] ?? null)) {
            return null;
        }

        return Order::query()->where('order_number', $pending['order'])->first();
    }

    public function remember(Request $request, Order $order, string $fingerprint): void
    {
        $request->session()->put(self::SESSION, ['order' => $order->order_number, 'fingerprint' => $fingerprint]);
    }

    /**
     * The order to take the payment for again, or null when a new one is to be written — the old one cancelled first
     * where it was still open; a sentence when its payment is already on its way.
     *
     * @param  bool  $reuseDeclined  whether a declined order can be paid again on this path (Stripe: yes; the sandbox: no)
     */
    public function reuseOrRelease(Request $request, string $fingerprint, bool $reuseDeclined): Order|string|null
    {
        $order = $this->order($request);

        if ($order === null) {
            $request->session()->forget(self::SESSION);

            return null;
        }

        if ($order->status === OrderStatus::Processing) {
            return sprintf(self::ALREADY_PROCESSING, $order->order_number);
        }

        $open = in_array($order->status, [OrderStatus::PendingPayment, OrderStatus::Failed], true);
        $same = ($request->session()->get(self::SESSION)['fingerprint'] ?? null) === $fingerprint;

        if ($open && $same && ($order->status === OrderStatus::PendingPayment || $reuseDeclined)) {
            return $order;
        }

        // Stopped at the provider first; where that fails, the old order is left to the 24-hour expiry, which asks again.
        if ($open && self::stopped($order)) {
            $this->payments->move($order, OrderStatus::Cancelled, 'Kasse', null, [], ['reason' => 'neu bestellt']);
        }

        $request->session()->forget(self::SESSION);

        return null;
    }

    /**
     * The goods this browser's own open order holds, by configuration and tyre: the basket adds them back to what is
     * on the shelf, since they are already this customer's.
     *
     * @return array{configs: array<int, int>, tyres: array<int, int>}
     */
    public function held(Request $request): array
    {
        $held = ['configs' => [], 'tyres' => []];
        $order = $this->order($request);

        if ($order === null || ! $order->stock_reserved || ! in_array($order->status, [OrderStatus::PendingPayment, OrderStatus::Failed], true)) {
            return $held;
        }

        foreach ($order->lines()->get() as $line) {
            $quantity = (int) $line->getAttribute('quantity');

            if (($config = $line->getAttribute('wheel_config_id')) !== null) {
                $held['configs'][(int) $config] = ($held['configs'][(int) $config] ?? 0) + $quantity;
            }

            if (($tyre = $line->getAttribute('tyre_variant_id')) !== null) {
                $held['tyres'][(int) $tyre] = ($held['tyres'][(int) $tyre] ?? 0) + $quantity;
            }
        }

        return $held;
    }

    /** Empties the basket once this browser's order is paid — and only then — and forgets it. */
    public function settle(Request $request, Basket $basket): void
    {
        $order = $this->order($request);

        if ($order === null) {
            $request->session()->forget(self::SESSION);

            return;
        }

        if ($order->status->isPaid()) {
            $basket->clear($request);
            $basket->forgetTpms($request);
            $request->session()->forget(self::SESSION);
        }
    }

    private static function stopped(Order $order): bool
    {
        try {
            return Payments::for((string) $order->getAttribute('payment_method'))?->cancel($order) ?? true;
        } catch (PaymentFailure $e) {
            report($e);

            return false;
        }
    }
}
