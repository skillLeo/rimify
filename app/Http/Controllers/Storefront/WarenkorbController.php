<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\BasketLineRequest;
use App\Http\Requests\Storefront\BasketWeightColourRequest;
use App\Models\TyreVariant;
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

    /** A set per axle became four rims: the tyres of both axles went (D-335). */
    public const SET_TYRES_REMOVED_TOAST = 'Die Reifen beider Achsen wurden entfernt – du bestellst jetzt nur die Felgen.';

    /** A set per axle added again: it stays the one set, 2 + 2 (D-335) — never „hinzugefügt“ over nothing added. */
    public const SET_HELD_TOAST = 'Diese Kompletträder sind schon im Warenkorb – zwei je Achse, die Anzahl ist fest.';

    public function __construct(private readonly Basket $basket) {}

    public function index(Request $request): Response
    {
        $basket = $this->basket->summary($request);

        return Inertia::render('Warenkorb/Index', [
            'lines' => $basket['lines'],
            'totals' => $basket['totals'],
            // What holds every order until the shop is set up, said before the checkout (HQ-27).
            'orderWait' => KasseController::waitOf($this->basket, $basket),
        ]);
    }

    public function store(BasketLineRequest $request): RedirectResponse
    {
        $tyreVariantId = $request->tyreVariantId();
        $rearTyreVariantId = $request->rearTyreVariantId();
        // A set per axle is 2 + 2 whatever was posted (D-335): two wheels on each axle, four in all.
        $quantity = $rearTyreVariantId === null ? $request->quantity() : TyreEligibility::MIXED_PER_AXLE;
        $wheels = $rearTyreVariantId === null ? $quantity : $quantity + $quantity;

        // Every line is a wheel (the request refuses anything else), and every wheel is checked —
        // with its tyre and at the posted quantity, so four Kompletträder against one tyre in
        // stock are refused here rather than discovered at the checkout (R-11).
        $refusal = $this->basket->refusalFor(
            $request,
            $request->wheelConfigId(),
            $tyreVariantId,
            $request->weightColourId(),
            $quantity,
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

        if ($rdks === 'ja' && ($this->basket->tpmsOffer($request, $wheels)['available'] ?? false) !== true) {
            return back()->withErrors(['rdks' => Basket::TPMS_UNAVAILABLE_REFUSAL]);
        }

        $key = $this->basket->key($request->wheelConfigId(), $tyreVariantId, $rearTyreVariantId);
        // A set per axle the basket holds already stays the one set (D-335): the add says so.
        $held = $rearTyreVariantId !== null && $this->basket->holds($request, $key);

        $this->basket->add(
            $request,
            $request->wheelConfigId(),
            $quantity,
            $tyreVariantId,
            $request->weightColourId(),
            $rearTyreVariantId,
        );

        // The answer, with the quote it was given at, becomes the checkout's own — asked once, not twice.
        if ($rdks !== null) {
            $this->basket->answerTpms($request, $rdks);
        }

        // Back rather than to the basket: the customer is on a product page configuring, and taking them away from it
        // after every add is what makes people buy one item instead of four. The confirmation is a small panel (#16):
        // the line just added, the basket's count and total, „Weiter einkaufen“ and „Zum Warenkorb“ — never a modal. The
        // sentence stays the toast's for any page without the panel; the panel, where it shows, silences the toast.
        $added = $this->basket->added($request, $key, $quantity);

        // A combination of the Gutachten is the Komplettrad itself (D-335); different sizes from a printed table are
        // Mischbereifung; one size on both axles is a Komplettrad either way.
        $sentence = match (true) {
            $tyreVariantId === null => 'Zum Warenkorb hinzugefügt.',
            $held => self::SET_HELD_TOAST,
            $rearTyreVariantId !== null && ($added['listed'] ?? false) !== true && ! self::sameSize($tyreVariantId, $rearTyreVariantId) => 'Mischbereifung zum Warenkorb hinzugefügt.',
            default => 'Komplettrad zum Warenkorb hinzugefügt.',
        };

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

    /** Takes the tyre off a Komplettrad line: the rims stay, merged into the Felgen-only line (§4.10) — of a set, both axles'. */
    public function destroyTyre(Request $request, string $line): RedirectResponse
    {
        $set = $this->basket->isSetPerAxle($request, $line);

        return $this->basket->removeTyre($request, $line)
            ? back()->with('toast', $set ? self::SET_TYRES_REMOVED_TOAST : self::TYRE_REMOVED_TOAST)
            : back();
    }

    /** Whether two tyres are of one size — one tyre is. */
    private static function sameSize(int $front, int $rear): bool
    {
        if ($front === $rear) {
            return true;
        }

        $sizes = TyreVariant::query()->whereKey([$front, $rear])->get(['id', 'width_mm', 'aspect', 'diameter_in'])
            ->map(static fn (TyreVariant $t): string => TyreSize::keyOf((int) $t->width_mm, (int) $t->aspect, (float) $t->diameter_in))
            ->unique();

        return $sizes->count() === 1;
    }
}
