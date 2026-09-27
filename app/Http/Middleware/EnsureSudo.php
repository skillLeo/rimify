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

        // Where to come back to: the page itself, or, for a change, the page it was sent from.
        $back = $request->isMethod('GET') ? $request->fullUrl() : url()->previous();
        $request->session()->put('url.intended', $back);

        return redirect()->route('admin.bestaetigen')
            ->with('toast', $request->isMethod('GET') ? null : 'Bestätige bitte dein Passwort noch einmal. Deine Änderung ist noch nicht gespeichert.');
    }

    public static function active(Request $request): bool
    {
        $at = $request->session()->get(self::SESSION_KEY);

        return is_int($at) && $at >= now()->subMinutes(self::MINUTES)->getTimestamp();
    }
}
