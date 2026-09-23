<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\VergleichRequest;
use App\Services\Storefront\CompareRows;
use App\Support\DevicePage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * `/vergleich` — up to four wheels side by side (docs/design/sections/home-overhaul.md §2.6).
 *
 * The list lives in the browser; the page takes its keys in the query so a comparison is a link
 * one can send. Unknown or unpublished keys are dropped and counted, never guessed at. With a
 * vehicle every column carries the engine's four-state verdict (R-07, R-13); without one the
 * page makes no claim.
 */
class VergleichController extends Controller
{
    public function __construct(private readonly CompareRows $rows) {}

    public function index(VergleichRequest $request): Response
    {
        $result = $this->rows->build($request->pairs(), $this->vehicleId($request));

        return Inertia::render(DevicePage::resolve('Vergleich', $request), [
            'items' => $result['items'],
            'missing' => $result['missing'],
            'cap' => VergleichRequest::CAP,
            // Any seeded demonstration row on the page: the page says so, once (§6).
            'demo' => $result['demo'],
        ]);
    }

    private function vehicleId(VergleichRequest $request): ?int
    {
        $raw = $request->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
    }
}
