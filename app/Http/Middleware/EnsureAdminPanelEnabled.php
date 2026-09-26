<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Closes the whole admin panel on a deployment where it is not ready to be seen.
 *
 * A preview server is shown to people who are not developers, and an unfinished panel invites
 * exactly the wrong conversation: a client reads a half-built screen as a finished one and reports
 * its gaps as faults. Rotating the passwords would not fix that — the sign-in screen would still
 * be there, still answer, and still say there is something behind it.
 *
 * So the panel is absent instead. Every `admin/*` path answers 404, the same designed 404 an
 * unknown URL gets, which says nothing about what is or is not installed here.
 *
 * Asked per request rather than at route registration, so turning the panel back on is one
 * environment variable and `config:clear` — never a rebuilt route cache.
 *
 * It runs at the FRONT of the web group rather than on the admin routes, which is why it has to
 * recognise its own paths. As route middleware it lost the ordering race: `Authenticate` sits in
 * the framework's priority list and was sorted ahead of it, so a closed panel answered a redirect
 * to its own sign-in screen instead of a 404. Nothing can be sorted above the front of the group.
 */
class EnsureAdminPanelEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->is('admin', 'admin/*')) {
            return $next($request);
        }

        abort_unless(config('rimify.admin.enabled') === true, 404);

        return $next($request);
    }
}
