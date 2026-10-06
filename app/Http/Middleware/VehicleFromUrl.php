<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Fitment\Resolver\VehicleDisambiguator;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VehicleKey;
use App\Support\ShopPath;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * The car in the address (the client's #8, D-116, the operator's brief „THE 34“): `?fahrzeug=0005-Z90-00001` on a page
 * decides which car the page answers for, so an address can be saved and shared (VehicleKey; `?fahrzeug=127`, the older
 * form, is still read). The URL wins; the cookie stays the memory — it is set to the URL's car, so the next page keeps
 * it — and the server renders from it (R-08: the first frame is already the right one). What the page then says about
 * that car is computed from the Gutachten, as for any request: the address names the car, never an answer.
 *
 * Only a car the catalogue holds wins. An unknown or malformed key is ignored, never an error: the cookie's car stands,
 * and the page's address is corrected to it (HandleInertiaRequests::urlResolver()). Key numbers that name two cars are
 * never decided here (R-01): the selector asks which, and brings the visitor back. Only GET: a form never changes the
 * car through its address.
 */
final class VehicleFromUrl
{
    public const PARAM = 'fahrzeug';

    /**
     * The pages whose content is the answer for one car: there the address carries the car (and nowhere else — a
     * basket or a legal page has nothing to share about it).
     */
    public const ROUTES = ['startseite', 'felgen.index', 'felgen.show', 'vergleich.index', 'check.index'];

    public function __construct(
        private readonly VehicleResolver $vehicles,
        private readonly VehicleDisambiguator $disambiguator,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $key = VehicleKey::parse($request->query(self::PARAM));

        // Only the pages that answer for one car take it from the address: the basket and the checkout keep the car the
        // customer chose, whatever a hand-made link says.
        if ($key === null || ! $request->isMethod('GET') || ! in_array($request->route()?->getName(), self::ROUTES, true)) {
            return $next($request);
        }

        $candidates = VehicleKey::candidates($key, $this->vehicles);

        if (count($candidates) > 1) {
            return redirect()
                ->route('felgen.suchen', array_filter(['zurueck' => ShopPath::of(self::without($request))]))
                ->with('lookup', [
                    'status' => 'ambiguous',
                    'hsn' => $candidates[0]->hsn,
                    'tsn' => $candidates[0]->tsn,
                    'distinction' => $this->disambiguator->distinguish($candidates)->toArray(),
                ]);
        }

        $id = $candidates[0]->id ?? null;
        $raw = $request->cookie(VehicleContext::COOKIE);
        $current = VehicleContext::decode(is_string($raw) ? $raw : null);

        if ($id === null || $current?->vehicleId === $id) {
            return $next($request);
        }

        // Every reader of the cookie — the controllers, the shared props — sees the URL's car for this request.
        $context = $current?->withVehicle($id) ?? new VehicleContext($id);
        $request->cookies->set(VehicleContext::COOKIE, $context->encode());

        $response = $next($request);
        $response->headers->setCookie(Cookie::make(VehicleContext::COOKIE, $context->encode(), VehicleContext::LIFETIME_MINUTES));

        return $response;
    }

    /** The page's own path and query, without the car. */
    private static function without(Request $request): string
    {
        $query = $request->query();
        unset($query[self::PARAM]);

        return '/'.ltrim($request->path(), '/').($query === [] ? '' : '?'.http_build_query($query));
    }
}
