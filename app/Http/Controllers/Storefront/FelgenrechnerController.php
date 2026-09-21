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
 * /felgenrechner — the full fitment tool (home-overhaul §3.3). Public, no state written. Two
 * props: the vehicle's original size for *Aktuell*, exactly as the homepage teaser gets it, and
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
