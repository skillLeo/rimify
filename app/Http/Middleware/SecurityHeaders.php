<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * TLS, HSTS, CSP, X-Content-Type-Options, Referrer-Policy — spec §12, verified by a
 * feature test so a missing header fails the build rather than a penetration test.
 *
 * The CSP is nonce-based: Vite tags and Ziggy's @routes script carry the nonce, nothing else may
 * execute. Stripe Checkout is hosted (a redirect, never an embedded script), so the only
 * third-party script origin is none at all.
 *
 * `img-src` is `'self' data: blob:`, widened to named hosts only when config/rimify.php lists any.
 */
final class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Content-Security-Policy', $this->policy($nonce));
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        }

        return $response;
    }

    private function policy(string $nonce): string
    {
        $connect = ["'self'"];
        // `'wasm-unsafe-eval'` lets the on-device OCR (F5) instantiate its WebAssembly core
        // inside a same-origin worker; it permits WebAssembly only, never `eval`.
        $script = ["'self'", "'nonce-{$nonce}'", "'wasm-unsafe-eval'"];
        $style = ["'self'", "'nonce-{$nonce}'"];

        /*
         * Photography is served from our own origin. The host list exists for the day the client
         * puts images on a CDN: named hosts only, never a wildcard — a wildcard would let any origin
         * place pixels on a page that talks about legal approvals, and the header test fails the
         * build if one appears.
         */
        $img = ["'self'", 'data:', 'blob:'];

        if (config('rimify.photography.enabled') === true) {
            /** @var list<string> $hosts */
            $hosts = config('rimify.photography.hosts', []);
            $img = [...$img, ...$hosts];
        }

        // The Vite dev server only exists locally; production never widens the policy.
        if (app()->environment('local') && Vite::isRunningHot()) {
            $dev = rtrim((string) file_get_contents(Vite::hotFile()));
            $ws = preg_replace('/^http/', 'ws', $dev);
            array_push($connect, $dev, (string) $ws);
            $script[] = $dev;
            $style[] = $dev;
            $style[] = "'unsafe-inline'";
        }

        return implode('; ', [
            "default-src 'self'",
            'script-src '.implode(' ', $script),
            'style-src '.implode(' ', $style),
            // Generated SVG art and measured widths use style attributes; attributes cannot carry a nonce.
            "style-src-attr 'unsafe-inline'",
            "font-src 'self'",
            'img-src '.implode(' ', $img),
            'connect-src '.implode(' ', $connect),
            // The OCR worker and the service worker are our own files, never a blob.
            "worker-src 'self'",
            "form-action 'self' https://checkout.stripe.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "object-src 'none'",
        ]);
    }
}
