<?php

declare(strict_types=1);

use App\Http\Middleware\DetectDevice;
use App\Http\Middleware\EnsureAdminPanelEnabled;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\VaryByDevice;
use App\Services\Storefront\Chrome;
use App\Services\Storefront\ErrorPage;
use Illuminate\Auth\Middleware\Authenticate;
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
        /*
         * `EnsureAdminPanelEnabled` rides at the front too, and for a related reason: whether the
         * panel exists at all has to be decided BEFORE anyone is asked to sign in. As route
         * middleware it lost that race — `Authenticate` sits in the framework's priority list and
         * was sorted ahead of it, so a closed panel answered a redirect to its own sign-in screen,
         * which both admits there is something here and sends the reader to a page that is gone.
         * At the front of the group nothing can be sorted above it.
         */
        $middleware->web(prepend: [SecurityHeaders::class, EnsureAdminPanelEnabled::class]);

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
         * Every failure state is built in one place — App\Services\Storefront\ErrorPage — which
         * decides between the Inertia page inside the storefront frame and the standalone Blade
         * page that needs neither the built bundle nor the database. A status the shop wrote no
         * sentences for is answered by the page that says so: German, three ways forward, and no
         * guess at what went wrong, rather than Symfony's English "Oops! An Error Occurred".
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
