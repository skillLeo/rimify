<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Resolver\VehicleDisambiguator;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ResolveKeyNumbersRequest;
use App\Http\Requests\Storefront\SelectVehicleRequest;
use App\Models\CatalogueGapEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cookie;

/**
 * Choosing, changing and clearing the vehicle.
 *
 * Nothing else on this site can happen until this succeeds, which is why every failure path here
 * offers three ways forward and none of them clears what the customer typed (R-09).
 *
 * The key-number lookup returns a COLLECTION, never a match. More than one result always means the
 * chooser — there is no flag that turns that off (R-01). `1860`/`AAS` resolves to two cars whose
 * top speeds are 280 and 290 km/h and whose front axle loads differ by 15 kg: precisely the two
 * fields the legal tyre requirement is derived from. Picking "the first" would compute the
 * requirement from the wrong car, confidently, on a page headed *passend für dein Fahrzeug*.
 */
class FahrzeugController extends Controller
{
    public function __construct(
        private readonly VehicleResolver $resolver,
        private readonly VehicleDisambiguator $disambiguator,
    ) {}

    /** The guided route: the customer picked a variant from the tree. */
    public function store(SelectVehicleRequest $request): RedirectResponse
    {
        $vehicle = $this->resolver->find($request->vehicleId());

        if ($vehicle === null) {
            return back()->with('toast', 'Dieses Fahrzeug ist nicht mehr verfügbar.');
        }

        return $this->adopt($vehicle->id);
    }

    /**
     * The key-number route.
     *
     * A miss is logged to the catalogue-gap report rather than only shown: a key number nobody can
     * resolve is the most valuable signal this business has about which data to obtain next.
     */
    public function resolve(ResolveKeyNumbersRequest $request): RedirectResponse
    {
        $hsn = $request->hsn();
        $tsn = $request->tsn();

        $candidates = $this->resolver->byKeyNumbers($hsn, $tsn);

        if ($candidates->isEmpty()) {
            CatalogueGapEvent::record(
                hsn: $hsn,
                tsn: $tsn,
                reasonCode: 'VEHICLE_NOT_FOUND',
                surface: 'selector',
            );

            // Everything typed is handed straight back, because a cleared form is a dead end.
            return back()
                ->withInput()
                ->with('lookup', [
                    'status' => 'not_found',
                    'hsn' => $hsn,
                    'tsn' => $tsn,
                ]);
        }

        if ($candidates->count() === 1) {
            return $this->adopt($candidates->first()->id);
        }

        // Never an error state — a confirmation. The rows carry exactly what differs.
        return back()
            ->withInput()
            ->with('lookup', [
                'status' => 'ambiguous',
                'hsn' => $hsn,
                'tsn' => $tsn,
                'distinction' => $this->disambiguator->distinguish($candidates)->toArray(),
            ]);
    }

    public function destroy(): RedirectResponse
    {
        return redirect()
            ->route('felgen.suchen')
            ->withCookie(Cookie::forget(VehicleContext::COOKIE))
            ->with('toast', 'Fahrzeug entfernt.');
    }

    /**
     * Write the vehicle and go to the listing.
     *
     * The booking flag is set here and not on arrival: the customer has just committed to a car,
     * and it is that commitment — not the URL they land on — that switches the header from the
     * plain bar to the vehicle presentation.
     */
    private function adopt(int $vehicleId): RedirectResponse
    {
        $context = (new VehicleContext($vehicleId))->enteredBooking();

        return redirect()
            ->route('felgen.index')
            ->withCookie(Cookie::make(
                VehicleContext::COOKIE,
                $context->encode(),
                VehicleContext::LIFETIME_MINUTES,
            ));
    }
}
