<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\PreviewGate as Gate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The preview's password, asked before anything else runs — maintenance page, sessions, the admin's own sign-in
 * (App\Support\PreviewGate). Nothing but the gate's own sentence is answered without it: no page, no JSON, no hint of
 * what is behind it. Stripe's webhook stays open (it is signed, and Stripe cannot type a password), as do the health
 * check and robots.txt.
 */
final class PreviewGate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Gate::enabled() || $request->is(...Gate::OPEN) || Gate::accepts($request->getUser(), $request->getPassword())) {
            return $next($request);
        }

        return response("Diese Vorschau von RIMIFY ist durch ein Passwort geschützt.\n", 401, [
            'WWW-Authenticate' => 'Basic realm="'.Gate::REALM.'", charset="UTF-8"',
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'no-store',
            'X-Robots-Tag' => 'noindex, nofollow',
        ]);
    }
}
