<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\BasketLineRequest;
use App\Http\Requests\Storefront\BasketWeightColourRequest;
use App\Services\Storefront\Basket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The basket.
 *
 * Every line is re-read from the catalogue on render rather than trusted from the session: a price
 * or a stock figure that moved while the tab was open is corrected here, not discovered at
 * checkout. The fitment verdict is re-computed on render too — for a Komplettrad the tyre is
 * checked against it again — and a line that has stopped being permitted is MARKED rather than
 * dropped: silently removing it would leave the customer with no idea why their basket changed.
 */
class WarenkorbController extends Controller
{
    /** The Komplettrad became a Felgen-only line (docs/specs/komplettrad.md §4.10). */
    public const TYRE_REMOVED_TOAST = 'Der Reifen wurde entfernt – du bestellst jetzt nur die Felgen.';

    public function __construct(private readonly Basket $basket) {}

    public function index(Request $request): Response
    {
        $basket = $this->basket->summary($request);

        return Inertia::render('Warenkorb/Index', [
            'lines' => $basket['lines'],
            'totals' => $basket['totals'],
        ]);
    }

    public function store(BasketLineRequest $request): RedirectResponse
    {
        $tyreVariantId = $request->tyreVariantId();
        $rearTyreVariantId = $request->rearTyreVariantId();

        // Every line is a wheel (the request refuses anything else), and every wheel is checked —
        // with its tyre and at the posted quantity, so four Kompletträder against one tyre in
        // stock are refused here rather than discovered at the checkout (R-11).
        $refusal = $this->basket->refusalFor(
            $request,
            $request->wheelConfigId(),
            $tyreVariantId,
            $request->weightColourId(),
            $request->quantity(),
            $rearTyreVariantId,
        );

        if ($refusal !== null) {
            // The sentence lands under the field that names what was refused: the tyre for a
            // Komplettrad, the size for a Felge.
            return back()->withErrors([$tyreVariantId === null ? 'wheelConfigId' : 'tyreVariantId' => $refusal]);
        }

        // RDKS sensors chosen beside the Komplettrad (#15) are refused here, before the set is added, where no price for
        // the car's make has been entered: the checkout would refuse the order on it later.
        $rdks = $tyreVariantId === null ? null : $request->rdks();

        if ($rdks === 'ja' && ($this->basket->tpmsOffer($request, $request->quantity())['available'] ?? false) !== true) {
            return back()->withErrors(['rdks' => Basket::TPMS_UNAVAILABLE_REFUSAL]);
        }

        $this->basket->add(
            $request,
            $request->wheelConfigId(),
            $request->quantity(),
            $tyreVariantId,
            $request->weightColourId(),
            $rearTyreVariantId,
        );

        // The answer, with the quote it was given at, becomes the checkout's own — asked once, not twice.
        if ($rdks !== null) {
            $this->basket->answerTpms($request, $rdks);
        }

        $sentence = match (true) {
            $tyreVariantId === null => 'Zum Warenkorb hinzugefügt.',
            $rearTyreVariantId !== null => 'Mischbereifung zum Warenkorb hinzugefügt.',
            default => 'Komplettrad zum Warenkorb hinzugefügt.',
        };

        // Back rather than to the basket: the customer is on a product page configuring, and taking them away from it
        // after every add is what makes people buy one item instead of four. The confirmation is a small panel (#16):
        // the line just added, the basket's count and total, „Weiter einkaufen“ and „Zum Warenkorb“ — never a modal. The
        // sentence stays the toast's for any page without the panel; the panel, where it shows, silences the toast.
        $added = $this->basket->added($request, $this->basket->key($request->wheelConfigId(), $tyreVariantId, $rearTyreVariantId), $request->quantity());

        return back()->with('toast', $sentence)->with('added', $added === null ? null : ['heading' => $sentence, ...$added]);
    }

    public function update(Request $request, string $line): RedirectResponse
    {
        $quantity = (int) $request->integer('quantity');

        $this->basket->setQuantity($request, $line, max(0, min(99, $quantity)));

        return back();
    }

    public function destroy(Request $request, string $line): RedirectResponse
    {
        $this->basket->remove($request, $line);

        return back()->with('toast', 'Position entfernt.');
    }

    /**
     * The Wuchtgewichte colour of a Komplettrad line (§4.10). The server re-checks that the colour
     * is still active, whatever tiles the page offered (R-11); a refusal is a sentence under the
     * field, and the line keeps the colour it had.
     */
    public function weights(BasketWeightColourRequest $request, string $line): RedirectResponse
    {
        $refusal = $this->basket->setWeightColour($request, $line, $request->colourId());

        return $refusal === null ? back() : back()->withErrors(['colourId' => $refusal]);
    }

    /** Takes the tyre off a Komplettrad line: the rims stay, merged into the Felgen-only line (§4.10). */
    public function destroyTyre(Request $request, string $line): RedirectResponse
    {
        return $this->basket->removeTyre($request, $line)
            ? back()->with('toast', self::TYRE_REMOVED_TOAST)
            : back();
    }
}
