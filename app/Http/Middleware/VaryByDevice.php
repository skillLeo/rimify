<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Desktop.vue and Mobile.vue are different documents served from the same URL, so a cache that
 * ignored the device would hand a phone the desktop markup.
 *
 * This runs in the GLOBAL stack — outermost of everything — because Inertia sets `Vary: X-Inertia`
 * with a replacing `set()` during its own response phase. The header is written with
 * `headers->set()` and a comma-joined string rather than `Response::setVary()`, which does not
 * take effect on the response objects this application returns.
 */
final class VaryByDevice
{
    private const DEVICE_VARY = ['User-Agent', 'Sec-CH-UA-Mobile'];

    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $existing = array_filter(array_map(
            trim(...),
            explode(',', (string) $response->headers->get('Vary', '')),
        ));

        $response->headers->set(
            'Vary',
            implode(', ', array_values(array_unique([...$existing, ...self::DEVICE_VARY]))),
        );

        return $response;
    }
}
