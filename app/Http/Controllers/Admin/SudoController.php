<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureSudo;
use App\Http\Requests\Admin\SudoConfirmRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sudo mode's question (EnsureSudo): the password once more, then 15 minutes on the screens that
 * hold the shop's keys, back where the person was going.
 */
class SudoController extends Controller
{
    public function show(Request $request): Response
    {
        $weiter = EnsureSudo::adminPath($request->query('weiter') === null ? null : (string) $request->query('weiter'));

        return Inertia::render('Admin/Bestaetigen/Index', [
            'minutes' => EnsureSudo::MINUTES,
            // The way back, from the address (EnsureSudo): sent back with the password.
            'weiter' => $weiter,
            'reason' => self::reasonFor($weiter),
        ]);
    }

    /**
     * Why the password is asked, for where the person is going — a refund was told „Dieser Bereich verwaltet die
     * Zugänge des Shops“, true only of the keys (the admin audit's F-12).
     */
    public static function reasonFor(?string $weiter): string
    {
        $path = $weiter === null ? '' : (string) parse_url($weiter, PHP_URL_PATH);

        // A refund is sent from the order's page (EnsureSudo takes the page a change came from); with the Testzahlung
        // no money moves, so the sentence says what holds for both.
        return match (true) {
            preg_match('#^/admin/bestellungen/\d+$#', $path) === 1 => 'Eine Erstattung lässt sich nicht zurücknehmen.',
            str_starts_with($path, '/admin/einstellungen/verkaeufer-versand') => 'Hier stehen die Angaben zum Unternehmen für Impressum, Rechnungen und Versand.',
            str_starts_with($path, '/admin/einstellungen/zahlung'),
            str_starts_with($path, '/admin/einstellungen/e-mail'),
            str_starts_with($path, '/admin/einstellungen/speicher') => 'Hier stehen die Zugangsschlüssel des Shops.',
            str_starts_with($path, '/admin/system/zuruecksetzen') => 'Hier wird die Testumgebung zurückgesetzt.',
            default => 'Dieser Bereich ist besonders geschützt.',
        };
    }

    public function store(SudoConfirmRequest $request): RedirectResponse
    {
        $request->session()->put(EnsureSudo::SESSION_KEY, now()->getTimestamp());
        $request->session()->regenerate();

        // The way back the form carried, checked again; the session's as the fallback, then the Übersicht.
        $back = EnsureSudo::adminPath(is_string($request->input('weiter')) ? $request->input('weiter') : null);

        if ($back !== null) {
            $request->session()->forget('url.intended');

            return redirect($back);
        }

        return redirect()->intended('/admin');
    }
}
