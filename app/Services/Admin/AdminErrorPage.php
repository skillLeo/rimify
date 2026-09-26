<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * How the admin answers a failure, for somebody signed into it (admin-shell.md §9.4–9.5).
 *
 * The shop's error page is the shop's: its header, its search, "Mit einem anderen Konto anmelden"
 * leading to the shop's home page. Inside the admin a refusal, a missing page or a burst of too many
 * requests is answered inside the admin's own frame instead, with the rail still there — the person
 * keeps their way around.
 *
 * A save that fails because the page was open too long (419) or was sent too often (429) is not a
 * page at all: the person goes back to the form they were filling, what they typed kept, with one
 * sentence saying what happened. Anything else (500, 503) stays with the shop's error page, which
 * works without the database and without the built bundle — the admin frame needs both.
 */
final class AdminErrorPage
{
    /** Set by EnsureAdminMay: the German name of the area a refused page belongs to. */
    public const DENIED_AREA = 'admin.denied_area';

    public const EXPIRED = 'Die Seite war zu lange offen, deshalb ist nichts gespeichert. Bitte versuch es noch einmal.';

    public const TOO_MANY = 'Zu viele Versuche in kurzer Zeit. Bitte warte eine Minute und versuch es dann noch einmal.';

    /** The page was open too long, or the sign-in ran out: said while the typed words stay on screen. */
    public const EXPIRED_KEPT = 'Die Seite war zu lange offen, deshalb ist nichts gespeichert. Deine Eingaben sind noch da: Melde dich, falls nötig, in einem neuen Tab wieder an und speichere dann hier noch einmal.';

    /**
     * A save sent from an admin page that failed — for any reason, signed in or not any more. The
     * page must not be replaced: what the person typed is only in their browser. So the answer is
     * not a page but one sentence, which the admin shows beside the form it leaves untouched
     * (AdminLayout's `httpException` handler).
     */
    public function keepsTheForm(Request $request, int $status): bool
    {
        return $request->is('admin', 'admin/*')
            && ! $request->isMethod('GET')
            && $request->header('X-Inertia') !== null
            && $status >= 400
            // Not a form inside the admin frame: signing out with an expired session still lands on
            // the sign-in page, and the guest pages (sign-in, invitation) keep their own answers —
            // they have no layout to show a sentence in.
            && ! $request->routeIs('admin.abmelden', 'admin.anmelden', 'admin.anmelden.*', 'admin.einladung', 'admin.einladung.*');
    }

    public function formFailure(int $status): JsonResponse
    {
        $message = match (true) {
            $status === 419, $status === 401 => self::EXPIRED_KEPT,
            $status === 403 => 'Dafür fehlt dir inzwischen das Recht. Es wurde nichts gespeichert.',
            $status === 404 => 'Das gibt es nicht mehr – vielleicht hat es gerade jemand gelöscht. Es wurde nichts gespeichert.',
            $status === 429 => self::TOO_MANY,
            default => 'Das hat auf unserer Seite nicht geklappt. Es wurde nichts gespeichert, deine Eingaben sind noch da. Versuch es gleich noch einmal.',
        };

        return new JsonResponse(['message' => $message], $status);
    }

    public function handles(Request $request, int $status): bool
    {
        return $request->is('admin', 'admin/*')
            && $request->user('admin') instanceof AdminUser
            && in_array($status, [403, 404, 419, 429], true);
    }

    public function render(Request $request, Response $original): Response
    {
        $status = $original->getStatusCode();

        // A form that could not be saved: back to it, typed input kept, one sentence at the top.
        if (! $request->isMethod('GET') && in_array($status, [419, 429], true)) {
            return $this->back($request, $status === 419 ? self::EXPIRED : self::TOO_MANY);
        }

        $area = $request->attributes->get(self::DENIED_AREA);

        return Inertia::render('Admin/Fehler/Index', [
            'status' => $status,
            'area' => is_string($area) ? $area : null,
        ])
            ->toResponse($request)
            ->setStatusCode($status);
    }

    private function back(Request $request, string $message): RedirectResponse
    {
        return back()
            ->withInput($request->except(['password', 'password_confirmation', 'current_password', '_token']))
            ->with('toast', $message);
    }
}
