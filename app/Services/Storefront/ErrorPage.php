<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Storefront\DeviceDetector;
use App\Http\Middleware\DetectDevice;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Every failure state the shop has a designed answer for.
 *
 * A failure page is the one page nobody plans to see, which is exactly why it has to be built like
 * the rest of the shop: it is read by someone who is already annoyed, and it is the last chance to
 * keep them. So it names what happened, says what it means for them, and offers three ways on
 * (R-09) — never a cleared form, never a single "back".
 *
 * Three layers, each one able to answer when the layer above it cannot:
 *
 *   1. the Inertia page, inside the storefront frame, so the header, the basket and the chosen
 *      vehicle all survive a dead link;
 *   2. the standalone Blade page, which carries its own styles and needs neither the built bundle
 *      nor the database — this is what a release window and a failed boot get;
 *   3. Laravel's own page, for a status this application never designed an answer for, because
 *      inventing a reassuring sentence for a failure we do not understand is precisely the
 *      confidently wrong answer CLAUDE.md §2 forbids.
 */
final readonly class ErrorPage
{
    /**
     * The statuses with a designed answer. Anything else keeps Laravel's own page.
     *
     * @var list<int>
     */
    public const HANDLED = [403, 404, 419, 429, 500, 503];

    public function __construct(
        private DeviceDetector $devices,
        private HandleInertiaRequests $inertia,
    ) {}

    public function handles(int $status): bool
    {
        return in_array($status, self::HANDLED, true);
    }

    public function render(Request $request, Response $original): Response
    {
        $status = $original->getStatusCode();
        $retryAfter = $this->retryAfter($original);

        /*
         * A release window is the one state that may not depend on anything the release is
         * replacing. `artisan down` can pre-render this very view into a static file that is
         * served before the framework boots, so it holds no asset reference and asks nothing of
         * the database.
         */
        if ($status === 503) {
            return $this->standalone($status, $retryAfter);
        }

        try {
            $response = $this->page($request, $status, $retryAfter);
        } catch (Throwable) {
            // The Inertia render needs the built manifest and, through the session, the database.
            // When the failure took one of those with it, the page that explains the failure must
            // not become a second failure.
            return $this->standalone($status, $retryAfter);
        }

        if ($status === 419) {
            $this->refreshCsrfCookie($request, $response);
        }

        return $response;
    }

    private function page(Request $request, int $status, ?int $retryAfter): Response
    {
        $this->restoreSharedProps($request);

        return Inertia::render('Fehler/Index', [
            'status' => $status,
            'isMobile' => $this->isMobile($request),
            // Only ever set by the throttler and by a maintenance window; the page stays silent
            // about how long a wait will be whenever the server did not say.
            'retryAfter' => $retryAfter,
            // Not printed anywhere: it travels only in the prepared e-mail, so that a report tells
            // us which address failed without the page reflecting whatever was in the URL.
            'failedPath' => $this->failedPath($request),
        ])
            ->toResponse($request)
            ->setStatusCode($status);
    }

    /**
     * The shared props the page's own header and footer read.
     *
     * A 404 comes through the fallback route, so `HandleInertiaRequests` has already shared them.
     * A 419 does not: it is thrown by the CSRF check, which runs before that middleware, and
     * without this the header would render with no brand, no navigation and no basket, and the
     * footer's contact list would come out empty.
     */
    private function restoreSharedProps(Request $request): void
    {
        if (Inertia::getShared('headerMode') !== null) {
            return;
        }

        try {
            Inertia::share($this->inertia->share($request));
        } catch (Throwable) {
            // The chrome needs the session and the database. A failure that took either with it
            // must still leave the page a way to reach a human, so the configured details — which
            // are read from a file, not a table — stand on their own.
            Inertia::share([
                'headerMode' => 'PLAIN',
                'vehicle' => null,
                'menus' => null,
                'cartCount' => 0,
                'contact' => Chrome::contact(),
                'garage' => [],
                'flash' => ['toast' => null],
            ]);
        }
    }

    /**
     * The page that needs nothing: its styles are inline, its values are copied from tokens.css,
     * and it names no asset the build produces.
     */
    private function standalone(int $status, ?int $retryAfter): Response
    {
        return response()->view(
            $status === 503 ? 'errors.503' : 'errors.500',
            ['status' => $status, 'retryAfter' => $retryAfter, 'contact' => Chrome::contact()],
            $status,
        );
    }

    /**
     * A fresh XSRF-TOKEN beside the 419.
     *
     * The CSRF middleware writes that cookie in its response phase — which it never reaches when
     * it is the middleware that threw. The page would then tell the customer to send the form
     * again while the browser still held the token that had just been refused, and the second
     * attempt would fail exactly like the first. Writing it here is what makes the sentence on the
     * page true.
     */
    private function refreshCsrfCookie(Request $request, Response $response): void
    {
        if (! $request->hasSession()) {
            return;
        }

        $response->headers->setCookie(new Cookie(
            'XSRF-TOKEN',
            $request->session()->token(),
            Carbon::now()->addMinutes((int) config('session.lifetime', 120))->getTimestamp(),
            (string) config('session.path', '/'),
            is_string(config('session.domain')) ? (string) config('session.domain') : null,
            (bool) config('session.secure', false),
            false,
            false,
            is_string(config('session.same_site')) ? (string) config('session.same_site') : null,
            (bool) config('session.partitioned', false),
        ));
    }

    /**
     * An error page carries its own device split: a 419 or a 500 can be thrown before the
     * middleware that decides it ever ran, and without this every phone would get desktop chrome.
     */
    private function isMobile(Request $request): bool
    {
        $decided = $request->attributes->get(DetectDevice::ATTRIBUTE);

        if ($decided !== null) {
            return (bool) $decided;
        }

        return $this->devices->isMobile(
            $request->userAgent(),
            $request->headers->get('Sec-CH-UA-Mobile'),
            DeviceDetector::normaliseOverride($request->cookie(DetectDevice::OVERRIDE_COOKIE)),
        );
    }

    /** Whole seconds the server itself named, and never a number we made up. */
    private function retryAfter(Response $original): ?int
    {
        $header = $original->headers->get('Retry-After');

        if ($header === null || ! ctype_digit($header)) {
            return null;
        }

        $seconds = (int) $header;

        return $seconds > 0 ? $seconds : null;
    }

    private function failedPath(Request $request): string
    {
        $path = $request->getRequestUri();

        return mb_substr($path, 0, 160);
    }
}
