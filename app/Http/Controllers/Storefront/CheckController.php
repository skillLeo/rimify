<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Storefront\PapersBook;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\IssueCheckResultRequest;
use App\Models\CheckResult;
use App\Services\Storefront\CheckResults;
use App\Services\Storefront\VehicleTree;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * RIMIFY-CHECK — the promise the whole brand is built on, as its own page.
 *
 * The result page is addressed by a token rather than by a query string because the whole point of
 * it is that it can be sent to a workshop, printed, and still say the same thing next week: the answer
 * is frozen whole when it is issued (CheckResults), the tyre sum unfolded.
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

    /** „RIMIFY-Check drucken“ on the product page: the answer for this car and this wheel, frozen, then shown. */
    public function store(IssueCheckResultRequest $request, CheckResults $results): RedirectResponse
    {
        $vehicleId = (int) $request->vehicleId();
        $raw = $request->cookie(PapersBook::COOKIE);
        $papers = PapersBook::decode(is_string($raw) ? $raw : null)->for($vehicleId);

        $result = $results->issue($vehicleId, $request->wheelConfigId(), $papers);

        return redirect()->route('check.ergebnis', $result->token);
    }

    /**
     * The shareable, printable result: the frozen answer, every sentence of it. A token that names nothing —
     * mistyped, or never issued — shows the page's own „not available“ state, never an error.
     */
    public function ergebnis(string $token, CheckResults $results): Response
    {
        $result = preg_match('/^[A-Za-z0-9]{32}$/', $token) === 1
            ? CheckResult::query()->where('token', $token)->first()
            : null;

        return Inertia::render('CheckErgebnis/Index', [
            'token' => $token,
            'result' => $result === null ? null : $results->present($result),
        ]);
    }
}
