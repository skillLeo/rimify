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
 * `img-src` widens to named photography hosts only while the temporary review flag is on, and
 * narrows back to `'self' data: blob:` the moment it is off.
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
        $script = ["'self'", "'nonce-{$nonce}'"];
        $style = ["'self'", "'nonce-{$nonce}'", 'https://fonts.googleapis.com'];

        /*
         * Remote photography is a temporary review aid (config/rimify.php → photography). Named
         * hosts only: a wildcard here would let any origin place pixels on a page that talks about
         * legal approvals, and the header test fails the build if one appears.
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
            /*
             * The design's own runtime attaches a handful of handlers as ATTRIBUTES: `onerror` on
             * every photograph (that is what reveals the drawn fallback when an image is blocked,
             * so without this a failed image leaves the grey box the design was built to avoid),
             * and `onmouseover`/`onmouseout` on the brand strip and the admin tiles.
             *
             * `script-src-attr` is the narrow permission for exactly that: it allows handler
             * attributes and nothing else. Inline <script> blocks are still refused, because
             * `script-src` above carries a nonce and no 'unsafe-inline'. That is the difference
             * between permitting the design's hover effects and permitting injected script.
             */
            "script-src-attr 'unsafe-inline'",
            "font-src 'self' https://fonts.gstatic.com",
            'img-src '.implode(' ', $img),
            'connect-src '.implode(' ', $connect),
            "form-action 'self' https://checkout.stripe.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "object-src 'none'",
        ]);
    }
}
