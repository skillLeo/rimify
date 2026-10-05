<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AdminUser;
use App\Services\Reset\TestEnvironment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * System › Zurücksetzen is the Super-Admin's alone: anyone else signed in gets the same 404 an unknown address gets,
 * never a 403 — the address does not say there is something behind it (the operator's brief of 05.10.2026, §0). Route
 * middleware, so it runs after the sign-in (a guest is sent there, as on every admin page) and before the password is
 * asked again (EnsureSudo): nobody is asked for a password for a page that is not theirs. Where the reset is not
 * available at all, EnsureResetAvailable has already answered 404 for everyone.
 */
final class EnsureResetPermitted
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('admin');

        abort_unless($user instanceof AdminUser && $user->can('view', TestEnvironment::class), 404);

        return $next($request);
    }
}
