<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminLoginRequest;
use App\Http\Requests\Admin\AdminTwoFactorChallengeRequest;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Auth\AdminSignIn;
use App\Services\Admin\Auth\TwoFactor;
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
 * Two steps where the account has a second factor (D-514): the password, then the six digits from the
 * authenticator app — or one recovery code. Between the two nothing is signed in; the session only
 * remembers, for five minutes, who passed the password. The Super-Admin must have one: without it, the
 * panel opens only its setup (EnsureTwoFactorSetUp). For every other admin it is offered in Profil.
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
        // „Mit einem anderen Konto anmelden“: the waiting second step is given up.
        if ($request->query('neu') !== null) {
            $request->session()->forget(AdminSignIn::PENDING);
        }

        return Inertia::render('Admin/Anmelden/Index', [
            'stage' => AdminSignIn::pending($request) !== null ? 'totp' : 'credentials',
        ]);
    }

    /** Checks the password; the request has already dealt with the throttle. With a second factor, its step comes next. */
    public function store(AdminLoginRequest $request, TwoFactor $twoFactor): RedirectResponse
    {
        if (! $request->authenticateOrFail($twoFactor)) {
            return redirect()->route('admin.anmelden');
        }

        return redirect()->intended(self::HOME);
    }

    /** The second step: the code from the app, or a recovery code — which is then used up, and the Protokoll says so. */
    public function challenge(AdminTwoFactorChallengeRequest $request, TwoFactor $twoFactor): RedirectResponse
    {
        $user = $request->pendingOrFail();
        $taken = $twoFactor->verify($user, $request->string('code')->toString());

        if ($taken === null) {
            $request->failed($user);
        }

        $request->passed($user);
        AdminSignIn::complete($request, $user, AdminSignIn::remember($request));

        if ($taken === 'recovery') {
            $left = $twoFactor->recoveryCodesLeft($user);
            AuditTrail::record($user, 'admin.two_factor_recovery_used', ['left' => $left], $user);

            return redirect()->intended(self::HOME)->with('toast', 'Du hast dich mit einem Wiederherstellungscode angemeldet. '.match ($left) {
                0 => 'Es war dein letzter: Erzeug bitte gleich in Profil neue.',
                1 => 'Dir bleibt noch einer. Erzeug in Profil neue.',
                default => "Dir bleiben noch {$left}.",
            });
        }

        return redirect()->intended(self::HOME);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('admin')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Into the NEW session, after the old one is gone: the sign-in page that answers this redirect
        // tells the browser to drop the key its admin history was encrypted with.
        Inertia::clearHistory();

        return redirect()->route('admin.anmelden');
    }
}
