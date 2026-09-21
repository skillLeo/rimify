<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Services\Storefront\VehicleTree;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * RIMIFY-CHECK — the promise the whole brand is built on, as its own page.
 *
 * The result page is addressed by a token rather than by a query string because the whole point of
 * it is that it can be sent to a workshop, printed, and still say the same thing next week.
 */
class CheckController extends Controller
{
    public function __construct(private readonly VehicleTree $tree) {}

    public function index(Request $request): Response
    {
        $make = $request->string('marke')->toString();
        $model = $request->string('modell')->toString();

        return Inertia::render('Check/Index', [
            'makes' => $this->tree->makes(),
            'selectedMake' => $make === '' ? null : $make,
            'selectedModel' => $model === '' ? null : $model,
            'models' => $make === '' ? [] : $this->tree->models($make),
            'variants' => ($make === '' || $model === '') ? [] : $this->tree->variants($make, $model),
        ]);
    }

    /**
     * The shareable result. The verdict itself is wired in V2; the page already renders the four
     * states so that none of them is a default nobody designed.
     */
    public function ergebnis(Request $request, string $token): Response
    {
        return Inertia::render('CheckErgebnis/Index', [
            'token' => $token,
            'result' => null,
        ]);
    }
}
