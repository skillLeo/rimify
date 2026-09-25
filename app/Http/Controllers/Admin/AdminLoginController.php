<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminLoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Anmelden.
 *
 * The four states — error, lockout, loading, 2FA — are designed rather than defaulted, because a
 * login screen is the first thing the client's own team sees every morning, and a browser-default
 * validation bubble is the cheapest possible way to look unfinished.
 *
 * The password is checked here; the second factor is not. The screen draws the `totp` stage and the
 * Super Admin's TOTP is meant to be mandatory, but no secret is enrolled anywhere and nothing can
 * verify a code — so switching that stage on would ask for something the shop cannot check, which
 * is security theatre and worse than an honest gap. Until enrolment lands this door is a password
 * and a throttle, and what stands behind it is demonstration data.
 *
 * Signing in decides only WHO someone is. What they may do is asked of the Policies on every single
 * mutation (R-11), so a role that may not write still cannot write, however it got here.
 */
class AdminLoginController extends Controller
{
    /** Where a signed-in admin lands, and where this screen sends them once they are. */
    public const HOME = '/admin';

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Anmelden/Index', [
            // Which state to show. `totp` is drawn by the page but never reached: see the note above.
            'stage' => 'credentials',
        ]);
    }

    /** Checks the password and starts the session; the request has already dealt with the throttle. */
    public function store(AdminLoginRequest $request): RedirectResponse
    {
        $request->authenticateOrFail();

        return redirect()->intended(self::HOME);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('admin')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.anmelden');
    }
}
