<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Reset\TestEnvironment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * System › Zurücksetzen answers 404 wherever the reset is not available (TestEnvironment: not a test environment, no
 * RIMIFY_RESET_ERLAUBT=true, or the live shop's database) — the same designed 404 an unknown address gets, for anyone,
 * signed in or not, so the address never says that there is something behind it (the reset brief of 05.10.2026,
 * §3.2). In production the routes are not registered at all; this covers every other server.
 *
 * At the front of the web group, beside EnsureAdminPanelEnabled and for its reason: as route middleware it would be
 * sorted after `Authenticate` and `Authorize`, and a closed reset would answer a sign-in redirect or a 403.
 */
class EnsureResetAvailable
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('admin/system/zuruecksetzen', 'admin/system/zuruecksetzen/*')) {
            abort_unless(TestEnvironment::available(), 404);
        }

        return $next($request);
    }
}
