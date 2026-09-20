<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\BasketLineRequest;
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
 * checkout. The fitment verdict is re-computed on render too, and a line that has stopped being
 * permitted is MARKED rather than dropped — silently removing it would leave the customer with no
 * idea why their basket changed.
 */
class WarenkorbController extends Controller
{
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
        $this->basket->add(
            $request,
            $request->kind(),
            $request->referenceId(),
            $request->quantity(),
        );

        // Back rather than to the basket: the customer is on a product page configuring, and
        // taking them away from it after every add is what makes people buy one item instead of
        // four. The cart badge and a toast are the confirmation.
        return back()->with('toast', 'Zum Warenkorb hinzugefügt.');
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
}
