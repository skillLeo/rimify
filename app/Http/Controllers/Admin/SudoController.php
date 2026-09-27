<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureSudo;
use App\Http\Requests\Admin\SudoConfirmRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sudo mode's question (EnsureSudo): the password once more, then 15 minutes on the screens that
 * hold the shop's keys, back where the person was going.
 */
class SudoController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Admin/Bestaetigen/Index', ['minutes' => EnsureSudo::MINUTES]);
    }

    public function store(SudoConfirmRequest $request): RedirectResponse
    {
        $request->session()->put(EnsureSudo::SESSION_KEY, now()->getTimestamp());
        $request->session()->regenerate();

        return redirect()->intended('/admin');
    }
}
