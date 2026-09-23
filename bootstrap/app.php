<?php

declare(strict_types=1);

use App\Http\Middleware\DetectDevice;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\VaryByDevice;
use App\Services\Storefront\Chrome;
use App\Services\Storefront\ErrorPage;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global stack: its response phase runs outermost, after Inertia has set its own Vary.
        $middleware->append(VaryByDevice::class);

        /*
         * First in, last out: the security headers are written on the way back, so they are
         * written on EVERY web response — including the ones an exception produced before the rest
         * of the group ran. A 419 thrown by the CSRF check used to leave the page with no CSP, no
         * X-Frame-Options and no Referrer-Policy at all.
         */
        $middleware->web(prepend: [SecurityHeaders::class]);

        // The device split reads a cookie, so it can only run once the cookies are decrypted.
        $middleware->web(append: [
            DetectDevice::class,
            HandleInertiaRequests::class,
        ]);

        // Stripe posts a signed raw body; it can carry no CSRF token and must not be touched.
        $middleware->validateCsrfTokens(except: ['webhooks/stripe']);

        // rmf_view is a harmless layout preference for client demos and rmf_consent is the cookie
        // choice, written by the browser itself; rmf_vehicle stays encrypted and authenticated.
        $middleware->encryptCookies(except: [DetectDevice::OVERRIDE_COOKIE, Chrome::CONSENT_COOKIE]);

        $middleware->redirectGuestsTo(fn (): string => '/admin/anmelden');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        /*
         * Every failure state the shop has a designed answer for is built in one place —
         * App\Services\Storefront\ErrorPage — which decides between the Inertia page inside the
         * storefront frame and the standalone Blade page that needs neither the built bundle nor
         * the database. A status this application never designed an answer for keeps Laravel's
         * own page: a reassuring sentence about a failure we do not understand would be exactly
         * the confidently wrong answer CLAUDE.md §2 forbids.
         */
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return $response;
            }

            $pages = app(ErrorPage::class);

            return $pages->handles($response->getStatusCode())
                ? $pages->render($request, $response)
                : $response;
        });
    })->create();
