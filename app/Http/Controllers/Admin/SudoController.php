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
        return Inertia::render('Admin/Bestaetigen/Index', [
            'minutes' => EnsureSudo::MINUTES,
            // The way back, from the address (EnsureSudo): sent back with the password.
            'weiter' => EnsureSudo::adminPath($request->query('weiter') === null ? null : (string) $request->query('weiter')),
        ]);
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
