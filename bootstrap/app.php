<?php

declare(strict_types=1);

use App\Domain\Storefront\PapersBook;
use App\Http\Middleware\AssignVisitorKey;
use App\Http\Middleware\DetectDevice;
use App\Http\Middleware\EnsureAdminPanelEnabled;
use App\Http\Middleware\EnsureAdminSessionValid;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\VaryByDevice;
use App\Services\Admin\AdminErrorPage;
use App\Services\Storefront\Chrome;
use App\Services\Storefront\ErrorPage;
use Illuminate\Auth\AuthenticationException;
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
        // An admin session that was revoked or whose account was suspended ends here, after the
        // session has started and before any shared prop names the person or draws their rail.
        $middleware->web(append: [
            DetectDevice::class,
            // The shop visitor's rate-limit key (VisitorKey), minted on the first request that has none.
            AssignVisitorKey::class,
            EnsureAdminSessionValid::class,
            HandleInertiaRequests::class,
        ]);

        // Stripe posts a signed raw body; it can carry no CSRF token and must not be touched.
        $middleware->validateCsrfTokens(except: ['webhooks/stripe']);

        // rmf_view is a harmless layout preference for client demos and rmf_consent is the cookie
        // choice, written by the browser itself; rmf_vehicle stays encrypted and authenticated.
        // rmf_papiere holds only a car's own figures, re-checked on every read and able only to make an
        // answer stricter; plain, it stays far below its 500 bytes (PapersBook).
        $middleware->encryptCookies(except: [DetectDevice::OVERRIDE_COOKIE, Chrome::CONSENT_COOKIE, PapersBook::COOKIE]);

        $middleware->redirectGuestsTo(fn (): string => '/admin/anmelden');

        // Somebody already signed into the admin who opens its sign-in page or an invitation link is
        // sent into the admin, never to the shop's home page.
        $middleware->redirectUsersTo(fn (Request $request): string => $request->is('admin', 'admin/*') ? '/admin' : '/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // A refused form is sent back with what was typed — never the storage keys (Medien und
        // Speicher): they would sit in the session store in clear text until the next request.
        $exceptions->dontFlash(['access_key', 'secret', 'publishable_key', 'secret_key', 'webhook_secret']);

        /*
         * A save from an admin page after the sign-in ran out. Same-origin requests pass the CSRF
         * check, so it is the sign-in that refuses — and its redirect to /admin/anmelden would
         * replace the page and everything typed on it. The page gets one sentence instead and stays.
         */
        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            $admin = app(AdminErrorPage::class);

            return $admin->keepsTheForm($request, 401) ? $admin->formFailure(401) : null;
        });

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

            // Inside the admin, for somebody signed into it: the admin's own frame (AdminErrorPage).
            $admin = app(AdminErrorPage::class);

            // A failed save from an admin page: one sentence, never a page over the typed words.
            if ($admin->keepsTheForm($request, $response->getStatusCode())) {
                return $admin->formFailure($response->getStatusCode());
            }

            if ($admin->handles($request, $response->getStatusCode())) {
                return $admin->render($request, $response);
            }

            $pages = app(ErrorPage::class);

            return $pages->handles($response->getStatusCode())
                ? $pages->render($request, $response)
                : $response;
        });
    })->create();
