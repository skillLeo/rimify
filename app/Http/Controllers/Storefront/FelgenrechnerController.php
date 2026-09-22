<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\FelgenrechnerRequest;
use App\Services\Storefront\CalculatorPrefill;
use App\Support\DevicePage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * /felgenrechner — the size calculator (ACCURACY.md §6). Public, no state written, and it judges
 * nothing: it computes. Two props: the prefill for *Aktuell* — the smallest size a published
 * Gutachten names for the chosen car, not its factory size — exactly as the homepage gets it, and
 * the comparison a shared link carried, parsed here so the first paint already shows it.
 */
class FelgenrechnerController extends Controller
{
    public function __construct(private readonly CalculatorPrefill $prefill) {}

    public function index(FelgenrechnerRequest $request): Response
    {
        $raw = $request->cookie(VehicleContext::COOKIE);
        $vehicleId = VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;

        return Inertia::render(DevicePage::resolve('Felgenrechner', $request), [
            'prefill' => $vehicleId === null ? null : $this->prefill->forVehicle($vehicleId),
            'state' => $request->state(),
        ]);
    }
}
