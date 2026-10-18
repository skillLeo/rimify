<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\CatalogueVersion;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * No answer of the shop is kept anywhere on its way — not by the browser, not for Back, not by the host's LiteSpeed or
 * its CDN (the client's admin item 16, D-294). Every page and every JSON answer is computed for this request from the
 * catalogue as it is now: a verdict, a price, a list of wheels. A copy kept by anyone could show a verdict after its
 * Gutachten was corrected, or a listing without the wheel just published.
 *
 * - `Cache-Control: no-store, private` — the framework's default `no-cache` still let a browser keep the page, and Back
 *   shows a kept page without asking;
 * - `X-LiteSpeed-Cache-Control: no-cache` — the host's page cache leaves it alone (public/.htaccess says the same for
 *   every address that reaches the application);
 * - `Vary: Cookie` — the car and its papers live in cookies; the filters live in the address, which every cache keys on;
 * - an ETag that names the catalogue's version (CatalogueVersion) and the answer's own content, so a publish changes
 *   what an address answers, visibly.
 *
 * An answer that chose its own rule keeps it: the postcode lookup's day (`public`), an invoice's `no-store`, an image's
 * hour, a file sent as it is.
 *
 * In the GLOBAL stack, like VaryByDevice, so it is written after Inertia has set its own `Vary`.
 */
final class CacheHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if ($response instanceof BinaryFileResponse || $response instanceof StreamedResponse || self::choseItsOwn($response)) {
            return $response;
        }

        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->set('X-LiteSpeed-Cache-Control', 'no-cache');

        $vary = array_filter(array_map(trim(...), explode(',', (string) $response->headers->get('Vary', ''))));
        $response->headers->set('Vary', implode(', ', array_values(array_unique([...$vary, 'Cookie']))));

        $content = $response->getContent();

        if ($response->getStatusCode() === 200 && is_string($content) && $content !== '' && ! $response->headers->has('ETag')) {
            $response->setEtag('k'.CatalogueVersion::current().'-'.hash('xxh3', $content), true);
        }

        return $response;
    }

    /** Whether the answer set a rule of its own: shared or kept for a time, or never kept already. */
    private static function choseItsOwn(Response $response): bool
    {
        $headers = $response->headers;

        if ($headers->hasCacheControlDirective('public') || $headers->hasCacheControlDirective('no-store') || $headers->hasCacheControlDirective('immutable')) {
            return true;
        }

        foreach (['max-age', 's-maxage'] as $directive) {
            if ((int) $headers->getCacheControlDirective($directive) > 0) {
                return true;
            }
        }

        return false;
    }
}
