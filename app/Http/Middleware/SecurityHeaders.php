<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Content\LegalReadiness;
use App\Support\ContentSecurityPolicy;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * TLS, HSTS, CSP, X-Content-Type-Options, Referrer-Policy — spec §12, verified by a
 * feature test so a missing header fails the build rather than a penetration test.
 *
 * The policy itself is App\Support\ContentSecurityPolicy, which the document repeats as a meta: the host replaces
 * this header with its own (ContentSecurityPolicy says how it was found).
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

        $sameOrigin = ContentSecurityPolicy::sameOrigin($request);
        $stripe = ContentSecurityPolicy::stripe($request);

        $response->headers->set('Content-Security-Policy', ContentSecurityPolicy::header($nonce, $sameOrigin, $stripe));
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

        // Any copy but the live shop stays out of search: a preview indexed beside the real shop competes with it. The
        // live shop too, while a legal text is a placeholder or the Impressum lacks a field (D-319): a placeholder must
        // never be what a search engine shows.
        if (self::hidden()) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }

    /** Whether this copy of the shop keeps search engines out — robots.txt asks the same (RobotsController). */
    public static function hidden(): bool
    {
        return ! app()->environment('production') || ! app(LegalReadiness::class)->ready();
    }
}
