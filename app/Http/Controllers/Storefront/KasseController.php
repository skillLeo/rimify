<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\PlaceOrderRequest;
use App\Http\Requests\Storefront\TpmsChoiceRequest;
use App\Payments\Payments;
use App\Services\Commerce\CheckoutShown;
use App\Services\Commerce\OrderRefused;
use App\Services\Commerce\OrderWriter;
use App\Services\Commerce\PendingOrder;
use App\Services\GoLive\GoLiveChecks;
use App\Services\Storefront\Basket;
use App\Services\Storefront\Chrome;
use App\Support\Shipping;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Checkout. Guest only — there are no customer accounts in this product.
 *
 * The header shows no vehicle presentation here at all: at the point of paying, the chrome must
 * not compete with the summary, and a blue bar offering to change the vehicle beside a payment
 * button is an invitation to abandon.
 *
 * An order is written only with a payment driver in force (App\Payments): until a provider is
 * configured the server refuses every order — and always while a basket line is a demo model or not
 * sellable. Where the review is on, the sandbox runs a test order the whole way: written with its
 * frozen verdicts (OrderWriter), paid or refused on a page that says it is a test.
 */
class KasseController extends Controller
{
    /** The last refusal: everything in the basket is fine, and there is still no way to pay. */
    public const PREVIEW_REFUSAL = 'Bestellen ist in dieser Vorschau noch nicht möglich. Es wurde nichts bestellt und nichts berechnet.';

    /**
     * The sensor price moved between the quote and the submission (docs/specs/komplettrad.md
     * §5.3): the order is not written at a figure the customer never confirmed.
     */
    public const PRICE_CHANGED_REFUSAL = 'Ein Preis in deinem Warenkorb hat sich geändert. Bitte sieh dir die Summe noch einmal an.';

    /**
     * No delivery time has been named (Art. 246a § 1 Nr. 7 EGBGB asks for it before the order): nothing is guessed,
     * and a real order waits for the figure, as it waits for the shipping price.
     */
    public const DELIVERY_REFUSAL = 'Die Lieferzeit steht noch nicht fest. Bis dahin kannst du nicht bestellen – dein Warenkorb bleibt gespeichert.';

    public function __construct(private readonly Basket $basket, private readonly PendingOrder $pending) {}

    public function index(Request $request): Response
    {
        // Paid meanwhile (the webhook came while the customer was away): the basket is theirs no longer.
        KasseZahlungController::settle($request, $this->basket);
        $basket = $this->basket->summary($request);

        return Inertia::render('Kasse/Index', [
            'lines' => $basket['lines'],
            'totals' => $basket['totals'],
            // The sentence the server answers a submission with, shown before anyone presses the
            // button: a checkout that fails only after the form is filled in wastes the customer's
            // time. The server check in store() stands on its own (R-11: the UI only hides).
            'orderRefusal' => self::refusalOf($this->basket, $basket),
            // A test order (the review): the page says so before anything is entered.
            'sandbox' => Payments::sandbox(),
            // Stripe's Payment Element: the publishable key and the mode; null while Stripe is not in force.
            'payment' => Payments::checkout(),
            // What the page shows, as a token it sends back with the order (CheckoutShown): a Gutachten, a
            // verdict or a price that changes meanwhile stops the payment instead of charging for it.
            'shown' => CheckoutShown::token($basket),
            // „Lieferzeit: 3–5 Werktage“ as the operator wrote it; null until they do.
            'deliveryTime' => self::deliveryTime(),
            // The shared shape, whole: a page prop named `contact` replaces the shared one for the
            // header and the footer too. The phone is null until the client gives one.
            'contact' => Chrome::contact(),
        ]);
    }

    /**
     * „Brauchst du RDKS-Sensoren?" — the answer is stored with the quote the customer was just
     * shown, and the SERVER re-renders the totals with the sensor line (§5.3). The page never
     * computes a price.
     */
    public function rdks(TpmsChoiceRequest $request): RedirectResponse
    {
        $this->basket->answerTpms($request, $request->choice());

        return back();
    }

    /**
     * "Zahlungspflichtig bestellen". Refused, with a friendly German sentence, and nothing created:
     * no customer, no address, no order, no snapshot.
     *
     * The submitted RDKS answer is the one source of truth at submit time (§5.3). Where it repeats
     * the stored answer the quote stays as it was, so a sensor price that moved since the render
     * is caught below; where it differs, the answer — and its quote — is taken afresh.
     */
    public function store(PlaceOrderRequest $request, OrderWriter $writer): RedirectResponse
    {
        $posted = $request->rdks();

        if ($posted !== null && $this->basket->tpmsChoice($request) !== $posted) {
            $this->basket->answerTpms($request, $posted);
        }

        $summary = $this->basket->summary($request);
        $refusal = self::refusalOf($this->basket, $summary);

        if ($refusal !== null) {
            return back()->withErrors(['order' => $refusal]);
        }

        // Re-priced from `tpms_sensor_prices` and compared against the quote (§5.3): any
        // difference sends the customer back to the basket, and the question is asked again at
        // whatever the price now is — never billed at a number they did not see.
        if ($this->basket->tpmsQuoteChanged($request)) {
            $this->basket->forgetTpms($request);

            return redirect()->route('warenkorb.index')->withErrors(['order' => self::PRICE_CHANGED_REFUSAL]);
        }

        $gateway = Payments::gateway();

        if ($gateway === null) {
            return back()->withErrors(['order' => self::PREVIEW_REFUSAL]);
        }

        // What the page showed, where it says (Block G): a verdict or a price that moved meanwhile is not ordered unseen.
        $shown = $request->shown();

        if ($shown !== null && ($changed = CheckoutShown::refusal($shown, $summary)) !== null) {
            return back()->withErrors(['order' => $changed]);
        }

        // One open order per basket (PendingOrder): a second press reuses it, anything changed releases it first.
        $customer = $request->customerData();
        $fingerprint = PendingOrder::fingerprint($customer, CheckoutShown::token($summary));
        $pending = $this->pending->reuseOrRelease($request, $fingerprint, reuseDeclined: false);

        if (is_string($pending)) {
            return back()->withErrors(['order' => $pending]);
        }

        if ($pending !== null) {
            $url = $gateway->start($pending);

            return $url !== null ? redirect()->to($url) : redirect()->route('kasse.index');
        }

        try {
            $order = $writer->write($request, $customer, $summary, $gateway->method(), self::openNote($summary));
        } catch (OrderRefused $e) {
            return back()->withErrors(['order' => $e->getMessage()]);
        }

        BestellungController::remember($request, $order->order_number);
        $this->pending->remember($request, $order, $fingerprint);

        // The sandbox has a page of its own; Stripe is paid on this page (KasseZahlungController), so a form post
        // reaching here with it goes back to the payment step.
        $url = $gateway->start($order);

        return $url !== null ? redirect()->to($url) : redirect()->route('kasse.index');
    }

    /**
     * Why this basket cannot be ordered here, or null — the one rule the page, the form post and the payment
     * endpoint (KasseZahlungController) share. Without a payment driver nothing can be ordered at all. A test order
     * — the sandbox, or Stripe in Testmodus, where no money moves — may go before the shipping price and the
     * delivery time are named, and says so on the order (openNote); every other refusal stands, and a real payment
     * waits for both.
     *
     * @param  array{lines: list<array<string, mixed>>, totals: array<string, mixed>}  $summary
     */
    public static function refusalOf(Basket $basket, array $summary): ?string
    {
        $test = self::testOrder();
        $refusal = $basket->refusalOf($summary);

        if ($refusal === Basket::SHIPPING_REFUSAL && $test) {
            $refusal = null;
        }

        if ($refusal !== null) {
            return $refusal;
        }

        if (Payments::gateway() === null) {
            return self::PREVIEW_REFUSAL;
        }

        if (self::deliveryTime() === null && ! $test) {
            return self::DELIVERY_REFUSAL;
        }

        // No real payment while a check of „Recht und Pflichtangaben" fails (the operator's brief of 05.10.2026, §7): the
        // customer is told plainly; Einstellungen › Zahlung and System › Was fehlt name the checks to the admin.
        return app(GoLiveChecks::class)->liveRefusal() === null ? null : GoLiveChecks::LIVE_REFUSAL;
    }

    /**
     * What a test order records about the figures it went without, or null.
     *
     * @param  array{lines: list<array<string, mixed>>, totals: array<string, mixed>}  $summary
     */
    public static function openNote(array $summary): ?string
    {
        $open = array_filter([
            $summary['totals']['shippingConfigured'] !== true ? 'Die Versandkosten sind noch nicht festgelegt und mit 0,00 € berechnet.' : null,
            self::deliveryTime() === null ? 'Die Lieferzeit ist noch nicht festgelegt.' : null,
        ]);

        return $open === [] ? null : 'Testbestellung: '.implode(' ', $open);
    }

    /** The delivery time as Einstellungen › Verkäufer & Versand gives it (`3–5 Werktage`), or null while none is. */
    public static function deliveryTime(): ?string
    {
        return Shipping::current()->deliveryTime();
    }

    /** No money moves: the review's sandbox, or Stripe in Testmodus. */
    private static function testOrder(): bool
    {
        return Payments::sandbox() || (Payments::checkout()['testMode'] ?? false) === true;
    }
}
