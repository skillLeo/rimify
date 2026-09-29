<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AdminUser;
use Closure;
use DateTimeInterface;
use Illuminate\Auth\SessionGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends an admin session that should no longer exist, on the very next request.
 *
 * Two things end one: the account may no longer sign in (suspended, or under a lock), or somebody
 * pressed *Überall abmelden* for it — `admin_users.sessions_revoked_at` — after this session began.
 * Every session carries the second it began in (`admin_authenticated_at`, stamped at sign-in and
 * when an invitation is accepted). A session that carries no such second while a revocation exists
 * is ended too: without the stamp nobody can say it began afterwards, and the panel fails closed.
 *
 * A session restored from the remember-me cookie gets its stamp at that moment. That is safe
 * because every revocation also rotates the account's remember token, so a cookie that still works
 * was issued after the last revocation.
 *
 * Only the admin area, and only when the admin guard has somebody: the storefront has no accounts.
 */
class EnsureAdminSessionValid
{
    /** When the current session signed in, as a Unix timestamp. */
    public const SESSION_KEY = 'admin_authenticated_at';

    public const REVOKED_MESSAGE = 'Du wurdest abgemeldet. Bitte melde dich neu an.';

    public const BLOCKED_MESSAGE = 'Mit diesem Konto kannst du dich gerade nicht anmelden. '
        .'Bitte wende dich an eine Person, die im Admin die Benutzer verwaltet.';

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->is('admin', 'admin/*') || ! $request->hasSession()) {
            return $next($request);
        }

        $guard = Auth::guard('admin');
        $user = $guard->user();

        if (! $user instanceof AdminUser) {
            return $next($request);
        }

        $session = $request->session();

        if ($guard instanceof SessionGuard && $guard->viaRemember() && ! is_int($session->get(self::SESSION_KEY))) {
            $session->put(self::SESSION_KEY, Date::now()->getTimestamp());
        }

        $blocked = ! $user->canSignIn();

        if (! $blocked && ! self::revoked($user, $session->get(self::SESSION_KEY))) {
            return $next($request);
        }

        $guard->logout();
        $session->invalidate();
        $session->regenerateToken();

        return redirect()->route('admin.anmelden')
            ->with('toast', $blocked ? self::BLOCKED_MESSAGE : self::REVOKED_MESSAGE);
    }

    /**
     * Whether this session began before the account's sessions were last revoked.
     *
     * The comparison is `>=` in whole seconds: a session that began in the same second as the
     * revocation cannot be told apart from one that began just before it, so it is ended — the cost
     * is one extra sign-in, never a session that should have died.
     */
    public static function revoked(AdminUser $user, mixed $authenticatedAt): bool
    {
        $revokedAt = self::revokedAt($user);

        if ($revokedAt === null) {
            return false;
        }

        if (! is_int($authenticatedAt)) {
            return true;
        }

        return $revokedAt->getTimestamp() >= $authenticatedAt;
    }

    /** `admin_users.sessions_revoked_at`, read without relying on a cast on the model. */
    public static function revokedAt(AdminUser $user): ?DateTimeInterface
    {
        $raw = $user->getAttribute('sessions_revoked_at');

        if ($raw instanceof DateTimeInterface) {
            return $raw;
        }

        return is_string($raw) && $raw !== '' ? Date::parse($raw) : null;
    }
}
