<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Storefront\DeviceDetector;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets the `isMobile` request attribute before Inertia shares it, so the first byte of the SSR
 * response already carries the right layout. `?view=desktop|mobile` pins a layout for client
 * demos (kept in a cookie so navigation does not lose it); `?view=auto` releases it.
 */
final class DetectDevice
{
    public const ATTRIBUTE = 'isMobile';

    public const OVERRIDE_COOKIE = 'rmf_view';

    public function __construct(private readonly DeviceDetector $detector) {}

    public function handle(Request $request, Closure $next): Response
    {
        $query = $request->query('view');
        $release = $query === 'auto';

        $override = $release
            ? null
            : (DeviceDetector::normaliseOverride($query)
                ?? DeviceDetector::normaliseOverride($request->cookie(self::OVERRIDE_COOKIE)));

        $request->attributes->set(self::ATTRIBUTE, $this->detector->isMobile(
            $request->userAgent(),
            $request->headers->get('Sec-CH-UA-Mobile'),
            $override,
        ));

        /** @var Response $response */
        $response = $next($request);

        // Ask for the client hint. `Vary` is set by VaryByDevice in the global stack, because
        // Inertia replaces that header during its own response phase.
        $response->headers->set('Accept-CH', 'Sec-CH-UA-Mobile');

        if ($release) {
            $response->headers->clearCookie(self::OVERRIDE_COOKIE);
        } elseif (DeviceDetector::normaliseOverride($query) !== null) {
            $response->headers->setCookie(cookie(self::OVERRIDE_COOKIE, (string) $query, 60 * 24 * 7, sameSite: 'lax'));
        }

        return $response;
    }
}
