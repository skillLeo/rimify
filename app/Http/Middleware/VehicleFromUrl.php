<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Domain\Storefront\VehicleContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * The car in the address (the client's #8, D-116): `?fahrzeug=127` on a page decides which car the page answers for,
 * so an address can be saved and shared. The URL wins; the cookie stays the memory — it is set to the URL's car, so
 * the next page keeps it — and the server renders from it (R-08: the first frame is already the right one).
 *
 * Only a car the catalogue holds wins. An unknown or malformed number is ignored, never an error: the cookie's car
 * stands, and the page's address is corrected to it (HandleInertiaRequests::urlResolver()). Only GET: a form never
 * changes the car through its address.
 */
final class VehicleFromUrl
{
    public const PARAM = 'fahrzeug';

    /**
     * The pages whose content is the answer for one car: there the address carries the car (and nowhere else — a
     * basket or a legal page has nothing to share about it).
     */
    public const ROUTES = ['startseite', 'felgen.index', 'felgen.show', 'vergleich.index', 'check.index'];

    public function __construct(private readonly VehicleResolver $vehicles) {}

    public function handle(Request $request, Closure $next): Response
    {
        $id = self::requested($request);

        // Only the pages that answer for one car take it from the address: the basket and the checkout keep the car the
        // customer chose, whatever a hand-made link says.
        if ($id === null || ! $request->isMethod('GET') || ! in_array($request->route()?->getName(), self::ROUTES, true)) {
            return $next($request);
        }

        $raw = $request->cookie(VehicleContext::COOKIE);
        $current = VehicleContext::decode(is_string($raw) ? $raw : null);

        if ($current?->vehicleId === $id || $this->vehicles->find($id) === null) {
            return $next($request);
        }

        // Every reader of the cookie — the controllers, the shared props — sees the URL's car for this request.
        $context = $current?->withVehicle($id) ?? new VehicleContext($id);
        $request->cookies->set(VehicleContext::COOKIE, $context->encode());

        $response = $next($request);
        $response->headers->setCookie(Cookie::make(VehicleContext::COOKIE, $context->encode(), VehicleContext::LIFETIME_MINUTES));

        return $response;
    }

    /** The car the address names, or null when it names none or nothing usable. */
    public static function requested(Request $request): ?int
    {
        $value = $request->query(self::PARAM);

        return is_string($value) && preg_match('/^[1-9]\d{0,9}$/', $value) === 1 ? (int) $value : null;
    }
}
