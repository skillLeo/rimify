<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domain\Fitment\Resolver\VehicleDisambiguator;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\Garage;
use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VehicleKey;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ResolveKeyNumbersRequest;
use App\Http\Requests\Storefront\SelectVehicleRequest;
use App\Models\CatalogueGapEvent;
use App\Support\KeyNumberSearch;
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

        return $this->adopt($vehicle->id, $request->returnTo());
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

        // No vehicle dataset loaded: every lookup would end in „not found". The path is closed and says so; what was
        // typed comes back, and the page points to Marke & Modell (KeyNumberSearch, the brief of 05.10.2026, §8).
        if (! KeyNumberSearch::available()) {
            return back()->withInput()->with('lookup', ['status' => 'closed', 'hsn' => $hsn, 'tsn' => $tsn]);
        }

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
            return $this->adopt($candidates->first()->id, $request->returnTo());
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
     * Write the vehicle and go to the listing — or back to the page the car was chosen on, where that page asked for
     * it (the RIMIFY-Check, #28: the question stays on screen and gets its answer).
     *
     * The booking flag is set here and not on arrival: the customer has just committed to a car,
     * and it is that commitment — not the URL they land on — that switches the header from the
     * plain bar to the vehicle presentation.
     */
    private function adopt(int $vehicleId, ?string $returnTo = null): RedirectResponse
    {
        $context = (new VehicleContext($vehicleId))->enteredBooking();

        // The garage remembers the last five choices, so a second car is one tap, not a form.
        $raw = request()->cookie(Garage::COOKIE);
        $garage = Garage::decode(is_string($raw) ? $raw : null)->with($vehicleId);

        // The listing's last filters come with the car (the client's #27, D-118): a size or a brand chosen before
        // the car survives choosing it.
        $filters = request()->session()->get(FelgenController::FILTERS_SESSION, []);

        // A page that asked for its visitor back gets them, with the car in its address (D-116) so the answer is the new car's.
        $target = $returnTo === null
            ? redirect()->route('felgen.index', is_array($filters) ? $filters : [])
            : redirect()->to($this->withVehicle($returnTo, $vehicleId));

        return $target
            ->withCookie(Cookie::make(
                VehicleContext::COOKIE,
                $context->encode(),
                VehicleContext::LIFETIME_MINUTES,
            ))
            ->withCookie(Cookie::make(Garage::COOKIE, $garage->encode(), Garage::LIFETIME_MINUTES));
    }

    /** The return path with `fahrzeug=` set to the car just chosen — its key numbers (VehicleKey) — every other parameter kept. */
    private function withVehicle(string $path, int $vehicleId): string
    {
        [$base, $query] = array_pad(explode('?', $path, 2), 2, '');
        parse_str($query, $params);
        $vehicle = $this->resolver->find($vehicleId);
        $params['fahrzeug'] = $vehicle === null ? (string) $vehicleId : VehicleKey::of($vehicle);

        return $base.'?'.http_build_query($params);
    }
}
