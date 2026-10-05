<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The shop's documents and page data leave the app gzipped at level 6, so no browser downloads them at the host's
 * weakest setting (the operator's brief of 05.10.2026, §5).
 *
 * The host's LiteSpeed compresses dynamic responses itself, but its brotli — which every current browser prefers — runs
 * at its fastest level: the phone homepage went out as 59,8 KB of brotli against 46,4 KB of its own gzip, and 43 KB at
 * gzip level 6 (measured at the origin, 06.10.2026; PHP there has zlib, no brotli). A response that already carries a
 * Content-Encoding is passed through untouched by the server and the CDN, so this is a floor the host cannot undercut:
 * on Slow 4G the 14 KB are ~0,07 s before the first paint. Streams, files, small and already encoded responses, and
 * anything but HTML and JSON go out as they are.
 *
 * First in the global stack: its response phase runs last, after everything else has written the body.
 */
final class CompressDocuments
{
    /** Below this, the header costs about what the compression saves. */
    private const MIN_BYTES = 1024;

    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! $this->compressible($request, $response)) {
            return $response;
        }

        $compressed = gzencode((string) $response->getContent(), 6);

        if ($compressed === false) {
            return $response;
        }

        $response->setContent($compressed);
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Content-Length', (string) strlen($compressed));

        // As VaryByDevice writes it: a joined header, which takes effect on every response object here.
        $vary = array_filter(array_map(trim(...), explode(',', (string) $response->headers->get('Vary', ''))));
        $response->headers->set('Vary', implode(', ', array_values(array_unique([...$vary, 'Accept-Encoding']))));

        return $response;
    }

    private function compressible(Request $request, Response $response): bool
    {
        if ($response instanceof StreamedResponse || $response instanceof BinaryFileResponse || $request->isMethod('HEAD')) {
            return false;
        }

        if ($response->headers->has('Content-Encoding') || str_contains((string) $response->headers->get('Cache-Control'), 'no-transform')) {
            return false;
        }

        if (preg_match('/\bgzip\b/i', (string) $request->headers->get('Accept-Encoding')) !== 1) {
            return false;
        }

        if (preg_match('#^(text/html|application/json)\b#i', (string) $response->headers->get('Content-Type')) !== 1) {
            return false;
        }

        $content = $response->getContent();

        return is_string($content) && strlen($content) >= self::MIN_BYTES;
    }
}
