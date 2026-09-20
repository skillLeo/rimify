<?php

declare(strict_types=1);

use App\Domain\Storefront\DeviceDetector;
use App\Http\Middleware\DetectDevice;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\VaryByDevice;
use App\Support\Design\PrototypePage;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
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

        // Order matters: the device split and the CSP nonce must exist before Inertia renders.
        $middleware->web(append: [
            DetectDevice::class,
            SecurityHeaders::class,
            HandleInertiaRequests::class,
        ]);

        // Stripe posts a signed raw body; it can carry no CSRF token and must not be touched.
        $middleware->validateCsrfTokens(except: ['webhooks/stripe']);

        // rmf_view is a harmless layout preference for client demos;
        // rmf_vehicle stays encrypted and authenticated.
        $middleware->encryptCookies(except: [DetectDevice::OVERRIDE_COOKIE]);

        $middleware->redirectGuestsTo(fn (): string => '/admin/anmelden');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        /*
         * Error pages are Inertia pages, not Blade fallbacks: a 404 rendered outside the app shell
         * loses the header, the basket count and the chosen vehicle, and reads as a different site.
         * A visitor who followed a dead link to a wheel still wants a wheel.
         *
         * Only the statuses we have designed are handled here. Anything else keeps Laravel's own
         * page, which is the right answer for a failure this application did not anticipate.
         */
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return $response;
            }

            if (! in_array($response->getStatusCode(), [403, 404, 419, 500, 503], true)) {
                return $response;
            }

            /*
             * An error page has to carry its own props.
             *
             * A 404 is thrown during routing, before the `web` group runs — so DetectDevice never
             * set `isMobile` and HandleInertiaRequests never shared it. Without it the device
             * split has nothing to switch on and every phone is served the desktop page: the
             * mobile 404 came out 1857px tall against the design's 4604px, because it was the
             * desktop document rendered at 390px.
             *
             * So the two props the shell needs are computed here. `designPage` puts the right
             * name on <body data-page>, which is what `shared/app.js` reads to decide it is the
             * 404 screen rather than the Startseite.
             */
            $isMobile = $request->attributes->get(DetectDevice::ATTRIBUTE);

            if ($isMobile === null) {
                $isMobile = app(DeviceDetector::class)->isMobile(
                    $request->userAgent(),
                    $request->headers->get('Sec-CH-UA-Mobile'),
                    DeviceDetector::normaliseOverride($request->cookie(DetectDevice::OVERRIDE_COOKIE)),
                );
            }

            return Inertia::render('Fehler/Index', [
                'status' => $response->getStatusCode(),
                'isMobile' => (bool) $isMobile,
                'designPage' => PrototypePage::forComponent('Fehler/Index'),
            ])
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        });
    })->create();
