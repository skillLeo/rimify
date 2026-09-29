<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sudo mode: a screen that holds the shop's keys (Einstellungen › Medien und Speicher) asks for the
 * password again, and the answer holds for 15 minutes — then it asks again. A page is asked for on
 * the way in; a change sent after the window closed is sent back to the question, and the page it
 * came from is where the answer leads.
 */
final class EnsureSudo
{
    public const SESSION_KEY = 'admin.sudo_at';

    public const MINUTES = 15;

    public function handle(Request $request, Closure $next): Response
    {
        if (self::active($request)) {
            return $next($request);
        }

        // Where to come back to: the page itself, or, for a change, the page it was sent from. It travels
        // in the address, not only in the session: a request running beside this one (the bell's count,
        // a deferred prop) saves the session it read before and would take the way back with it.
        $back = $request->isMethod('GET') ? $request->fullUrl() : url()->previous();
        $request->session()->put('url.intended', $back);
        $path = self::adminPath($back);

        return redirect()->route('admin.bestaetigen', $path === null ? [] : ['weiter' => $path])
            ->with('toast', $request->isMethod('GET') ? null : 'Bestätige bitte dein Passwort noch einmal. Deine Änderung ist noch nicht gespeichert.');
    }

    /**
     * A way back that stays inside the admin: its path and query when the address is this site's and
     * under /admin, else null. Never another host, never `//…` — no open redirect.
     */
    public static function adminPath(?string $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return null;
        }

        $parts = parse_url($url);

        if ($parts === false || (isset($parts['host']) && $parts['host'] !== request()->getHost())) {
            return null;
        }

        $path = '/'.ltrim((string) ($parts['path'] ?? ''), '/');

        if (str_starts_with($path, '//') || ! preg_match('#^/admin(/[A-Za-z0-9_\-./]*)?$#', $path) || $path === '/admin/bestaetigen') {
            return null;
        }

        return $path.(isset($parts['query']) && $parts['query'] !== '' ? '?'.$parts['query'] : '');
    }

    public static function active(Request $request): bool
    {
        $at = $request->session()->get(self::SESSION_KEY);

        return is_int($at) && $at >= now()->subMinutes(self::MINUTES)->getTimestamp();
    }
}
