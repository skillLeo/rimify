<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\StartPaymentRequest;
use App\Models\Order;
use App\Payments\PaymentFailure;
use App\Payments\Payments;
use App\Services\Commerce\CheckoutShown;
use App\Services\Commerce\OrderPayments;
use App\Services\Commerce\OrderRefused;
use App\Services\Commerce\OrderWriter;
use App\Services\Storefront\Basket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * „Zahlungspflichtig bestellen“ with Stripe (Block G): the page has already checked the Payment Element
 * (elements.submit()), and asks here for the payment it then confirms in the browser.
 *
 * Everything is decided again on the server, from the basket as it is now: the refusals the page showed, the stock,
 * and what the page showed the customer (CheckoutShown) — a Gutachten or a verdict that changed stops the payment
 * with its own sentence, a price that moved with the basket's. Only then is the order written (its verdicts frozen,
 * its goods reserved) and the PaymentIntent created at the order's total, never at a figure from the browser.
 *
 * A second press — a double click, a retry after a declined card — reuses the order and its payment while the
 * basket, the address and what was shown are unchanged; the idempotency key on the intent makes Stripe agree. A
 * changed address cancels the old unpaid order and writes a new one. The basket stays full until the payment is
 * confirmed (BestellungController).
 *
 * Answers JSON: 200 {order, clientSecret, returnUrl}; 409 {refusal, reload} when the page must show the basket
 * afresh; 422 for the form's own errors (the FormRequest).
 */
class KasseZahlungController extends Controller
{
    /** The session key naming this browser's unpaid order and what it was written from. */
    public const SESSION_PENDING = 'kasse.pending';

    public const PAYMENT_UNAVAILABLE = 'Bezahlen ist gerade nicht möglich. Es wurde nichts abgebucht. Versuch es bitte in ein paar Minuten noch einmal.';

    public const ALREADY_PROCESSING = 'Die Zahlung für deine Bestellung %s läuft schon. Sobald sie bestätigt ist, bekommst du eine E-Mail.';

    public function __construct(private readonly Basket $basket) {}

    public function store(StartPaymentRequest $request, OrderWriter $writer, OrderPayments $payments): JsonResponse
    {
        $gateway = Payments::gateway();

        if ($gateway === null || $gateway->method() !== 'stripe') {
            return self::refuse(KasseController::PREVIEW_REFUSAL);
        }

        $posted = $request->rdks();

        if ($posted !== null && $this->basket->tpmsChoice($request) !== $posted) {
            $this->basket->answerTpms($request, $posted);
        }

        $summary = $this->basket->summary($request);
        $refusal = KasseController::refusalOf($this->basket, $summary);

        if ($refusal !== null) {
            return self::refuse($refusal, reload: true);
        }

        if ($this->basket->tpmsQuoteChanged($request)) {
            $this->basket->forgetTpms($request);

            // The same sentence as any other price that moved since the page was shown.
            return self::refuse(CheckoutShown::PRICE_CHANGED, reload: true);
        }

        $shownNow = CheckoutShown::token($summary);
        $changed = CheckoutShown::refusal($request->shown(), $summary);

        if ($changed !== null) {
            return self::refuse($changed, reload: true, shown: $shownNow);
        }

        $customer = $request->customerData();
        $fingerprint = hash('sha256', (string) json_encode([$customer, $shownNow]));
        $order = $this->pending($request, $fingerprint, $payments);

        if ($order instanceof JsonResponse) {
            return $order;
        }

        if ($order === null) {
            try {
                $order = $writer->write($request, $customer, $summary, $gateway->method(), KasseController::openNote($summary));
            } catch (OrderRefused $e) {
                return self::refuse($e->getMessage(), reload: true);
            }

            BestellungController::remember($request, $order->order_number);
            $request->session()->put(self::SESSION_PENDING, ['order' => $order->order_number, 'fingerprint' => $fingerprint]);
        }

        try {
            $intent = $gateway->authorize($order);
        } catch (PaymentFailure $e) {
            report($e);

            return self::refuse(self::PAYMENT_UNAVAILABLE);
        }

        return response()->json([
            'order' => $order->order_number,
            'clientSecret' => $intent->clientSecret,
            'returnUrl' => route('bestellung.show', ['order' => $order->order_number]),
        ]);
    }

    /**
     * This browser's unpaid order, when a press repeats the last one exactly; null when a new order is to be written
     * (none yet, or the last one is paid, dead or was written from other data — an unpaid one of those is cancelled
     * and its stock released); a refusal when its payment is already on its way.
     */
    private function pending(Request $request, string $fingerprint, OrderPayments $payments): Order|JsonResponse|null
    {
        $pending = $request->session()->get(self::SESSION_PENDING);

        if (! is_array($pending) || ! is_string($pending['order'] ?? null)) {
            return null;
        }

        $order = Order::query()->where('order_number', $pending['order'])->first();

        if ($order === null) {
            $request->session()->forget(self::SESSION_PENDING);

            return null;
        }

        if ($order->status === OrderStatus::Processing) {
            return self::refuse(sprintf(self::ALREADY_PROCESSING, $order->order_number));
        }

        $open = in_array($order->status, [OrderStatus::PendingPayment, OrderStatus::Failed], true);

        if ($open && ($pending['fingerprint'] ?? null) === $fingerprint) {
            return $order;
        }

        // Stopped at the provider first; where that fails, the old order is left to the 24-hour expiry, which asks again.
        if ($open && self::cancelled($order)) {
            $payments->move($order, OrderStatus::Cancelled, 'Kasse', null, [], ['reason' => 'neu bestellt mit geänderten Angaben']);
        }

        $request->session()->forget(self::SESSION_PENDING);

        return null;
    }

    /**
     * Empties the basket once this browser's order is paid — and only then (Block G: a basket is never cleared before
     * the payment is confirmed). Called wherever the customer may land afterwards: the confirmation page, its status
     * poll, the checkout.
     */
    public static function settle(Request $request, Basket $basket): void
    {
        $pending = $request->session()->get(self::SESSION_PENDING);

        if (! is_array($pending) || ! is_string($pending['order'] ?? null)) {
            return;
        }

        $status = Order::query()->where('order_number', $pending['order'])->value('status');
        $status = is_string($status) ? OrderStatus::tryFrom($status) : ($status instanceof OrderStatus ? $status : null);

        if ($status === null) {
            $request->session()->forget(self::SESSION_PENDING);

            return;
        }

        if ($status->isPaid()) {
            $basket->clear($request);
            $basket->forgetTpms($request);
            $request->session()->forget(self::SESSION_PENDING);
        }
    }

    private static function cancelled(Order $order): bool
    {
        try {
            return Payments::for((string) $order->getAttribute('payment_method'))?->cancel($order) ?? true;
        } catch (PaymentFailure $e) {
            report($e);

            return false;
        }
    }

    private static function refuse(string $sentence, bool $reload = false, ?string $shown = null): JsonResponse
    {
        return response()->json(array_filter(['refusal' => $sentence, 'reload' => $reload, 'shown' => $shown], static fn ($v): bool => $v !== null), 409);
    }
}
