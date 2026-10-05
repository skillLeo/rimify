<?php

declare(strict_types=1);

namespace App\Support;

use App\Http\Middleware\SecurityHeaders;
use App\Payments\Payments;
use App\Services\Storage\StorageSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;

/**
 * The Content-Security-Policy, written once for the header (SecurityHeaders) and for the document's own
 * `<meta http-equiv>` (app.blade.php).
 *
 * The document carries it because the host does not let the header through: Hostinger's LiteSpeed answers every page
 * with `Content-Security-Policy: upgrade-insecure-requests` in place of ours — measured at the origin itself, past the
 * CDN, on 06.10.2026 — and a page whose header was replaced ran with no policy at all. A browser enforces both, so on
 * the host the meta is the policy and locally it repeats the header. It leaves out `frame-ancestors`, which a meta
 * cannot carry; X-Frame-Options says the same and reaches the browser.
 *
 * Nonce-based: the Vite tags carry the nonce, nothing else may execute. The one third-party script is Stripe.js, and
 * only on the checkout while Stripe is the driver in force (Block G): there the policy admits Stripe's published origins
 * (docs.stripe.com/security/guide), lets its frames ask for Apple Pay and Google Pay, and lets a wallet's pop-up keep its
 * opener. Every other page admits no third-party origin at all (TTDSG).
 *
 * `img-src` is `'self' data: blob:`, widened to named hosts only when config/rimify.php lists any, and to the media
 * bucket's own origins when one is in force (also in `connect-src`, for uploads).
 */
final class ContentSecurityPolicy
{
    public static function header(string $nonce, bool $sameOrigin, bool $stripe = false): string
    {
        return implode('; ', [...self::directives($nonce, $stripe), $sameOrigin ? "frame-ancestors 'self'" : "frame-ancestors 'none'"]);
    }

    /** For the document being rendered, as its `<meta http-equiv>`; null without a nonce (no policy is in force). */
    public static function meta(Request $request): ?string
    {
        $nonce = Vite::cspNonce();

        if ($nonce === null || $nonce === '') {
            return null;
        }

        return implode('; ', self::directives($nonce, self::stripe($request)));
    }

    /** Stripe.js and its frames: on the checkout only, while Stripe is the driver in force. */
    public static function stripe(Request $request): bool
    {
        return $request->routeIs('kasse.index') && Payments::checkout() !== null;
    }

    /** Whether our own pages may frame this response (the signed page preview only). */
    public static function sameOrigin(Request $request): bool
    {
        return $request->attributes->get(SecurityHeaders::FRAME_SAME_ORIGIN) === true;
    }

    /** @return list<string> */
    private static function directives(string $nonce, bool $stripe): array
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

        return [
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
            "base-uri 'self'",
            "object-src 'none'",
        ];
    }
}
