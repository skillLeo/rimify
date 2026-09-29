<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Storefront\VisitorKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gives a shop visitor the key their rate limits are counted against (VisitorKey), on the first request that
 * has none. The admin has its own limits, per signed-in account, and gets no key.
 *
 * Set on the response itself, not queued: EncryptCookies (earlier in the group) encrypts it on the way out,
 * and a queue would outlive the request it was meant for.
 */
final class AssignVisitorKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (VisitorKey::of($request) === null && ! $request->is('admin', 'admin/*')) {
            $response->headers->setCookie(Cookie::create(
                VisitorKey::COOKIE,
                VisitorKey::mint(),
                now()->addMinutes(VisitorKey::LIFETIME_MINUTES),
                '/',
                null,
                app()->isProduction(),
                true,
                false,
                Cookie::SAMESITE_LAX,
            ));
        }

        return $response;
    }
}
