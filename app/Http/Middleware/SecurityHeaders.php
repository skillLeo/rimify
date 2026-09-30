<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Payments\Payments;
use App\Services\Storage\StorageSettings;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * TLS, HSTS, CSP, X-Content-Type-Options, Referrer-Policy — spec §12, verified by a
 * feature test so a missing header fails the build rather than a penetration test.
 *
 * The CSP is nonce-based: the Vite tags carry the nonce, nothing else may execute. The one third-party script is
 * Stripe.js, and only on the checkout while Stripe is the driver in force (Block G): there the policy admits Stripe's
 * published origins (docs.stripe.com/security/guide), lets its frames ask for Apple Pay and Google Pay, and lets a
 * wallet's pop-up keep its opener. Every other page admits no third-party origin at all (TTDSG).
 *
 * `img-src` is `'self' data: blob:`, widened to named hosts only when config/rimify.php lists any,
 * and to the media bucket's own origins when one is in force (also in `connect-src`, for uploads).
 */
final class SecurityHeaders
{
    /**
     * Set by a controller whose response our own pages frame — only the signed page preview, which
     * the Inhalte editor shows beside its fields. Every other response keeps `DENY`.
     */
    public const FRAME_SAME_ORIGIN = 'security.frame_same_origin';

    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();

        /** @var Response $response */
        $response = $next($request);

        $sameOrigin = $request->attributes->get(self::FRAME_SAME_ORIGIN) === true;
        $stripe = $request->routeIs('kasse.index') && Payments::checkout() !== null;

        $response->headers->set('Content-Security-Policy', $this->policy($nonce, $sameOrigin, $stripe));
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Frame-Options', $sameOrigin ? 'SAMEORIGIN' : 'DENY');
        $response->headers->set('Permissions-Policy', $stripe
            ? 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")'
            : 'camera=(), microphone=(), geolocation=(), payment=(self)');
        $response->headers->set('Cross-Origin-Opener-Policy', $stripe ? 'same-origin-allow-popups' : 'same-origin');

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        }

        // Any copy but the live shop stays out of search: a preview indexed beside the real shop competes with it.
        if (! app()->environment('production')) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }

    private function policy(string $nonce, bool $sameOrigin, bool $stripe = false): string
    {
        $connect = ["'self'"];
        // `'wasm-unsafe-eval'` lets the on-device OCR (F5) instantiate its WebAssembly core
        // inside a same-origin worker; it permits WebAssembly only, never `eval`.
        $script = ["'self'", "'nonce-{$nonce}'", "'wasm-unsafe-eval'"];
        $style = ["'self'", "'nonce-{$nonce}'"];
        // As default-src had it: our own pages only (the Inhalte editor frames the signed page preview).
        $frame = ["'self'"];

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

        // The media bucket in force (Einstellungen › Medien und Speicher): its pictures are shown, and
        // the Gutachten upload posts to it. Its own named origins — never a wildcard of amazonaws.com.
        $bucket = app(StorageSettings::class)->current()->origins();
        $img = array_values(array_unique([...$img, ...$bucket]));
        $connect = [...$connect, ...$bucket];

        // Stripe.js and its frames, on the checkout only — named origins, as Stripe publishes them.
        if ($stripe) {
            $script = [...$script, 'https://js.stripe.com', 'https://*.js.stripe.com'];
            $connect = [...$connect, 'https://api.stripe.com'];
            $frame = [...$frame, 'https://js.stripe.com', 'https://*.js.stripe.com', 'https://hooks.stripe.com'];
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
            'frame-src '.implode(' ', $frame),
            "form-action 'self'",
            $sameOrigin ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
            "base-uri 'self'",
            "object-src 'none'",
        ]);
    }
}
