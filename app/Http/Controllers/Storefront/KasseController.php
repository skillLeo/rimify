<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\PlaceOrderRequest;
use App\Http\Requests\Storefront\TpmsChoiceRequest;
use App\Payments\Payments;
use App\Services\Commerce\OrderRefused;
use App\Services\Commerce\OrderWriter;
use App\Services\Storefront\Basket;
use App\Services\Storefront\Chrome;
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

    public function __construct(private readonly Basket $basket) {}

    public function index(Request $request): Response
    {
        $basket = $this->basket->summary($request);

        return Inertia::render('Kasse/Index', [
            'lines' => $basket['lines'],
            'totals' => $basket['totals'],
            // The sentence the server answers a submission with, shown before anyone presses the
            // button: a checkout that fails only after the form is filled in wastes the customer's
            // time. The server check in store() stands on its own (R-11: the UI only hides).
            'orderRefusal' => $this->refusal($basket),
            // A test order (the review): the page says so before anything is entered.
            'sandbox' => Payments::sandbox(),
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
        $refusal = $this->refusal($summary);

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

        $open = $summary['totals']['shippingConfigured'] !== true;

        try {
            $order = $writer->write(
                $request,
                $request->customerData(),
                $summary,
                $gateway->method(),
                // A test order may run before the shipping price is named; the order says so.
                $open ? 'Testbestellung: Die Versandkosten sind noch nicht festgelegt und mit 0,00 € berechnet.' : null,
            );
        } catch (OrderRefused $e) {
            return back()->withErrors(['order' => $e->getMessage()]);
        }

        BestellungController::remember($request, $order->order_number);

        return redirect()->to($gateway->start($order));
    }

    /**
     * Why this basket cannot be ordered here, or null. Without a payment driver nothing can be
     * ordered at all. A test order (the sandbox, only where the review is on) may go before the
     * shipping price is named — every other refusal stands.
     *
     * @param  array{lines: list<array<string, mixed>>, totals: array<string, mixed>}  $summary
     */
    private function refusal(array $summary): ?string
    {
        $refusal = $this->basket->refusalOf($summary);

        if ($refusal === Basket::SHIPPING_REFUSAL && Payments::sandbox()) {
            $refusal = null;
        }

        return $refusal ?? (Payments::gateway() === null ? self::PREVIEW_REFUSAL : null);
    }
}
