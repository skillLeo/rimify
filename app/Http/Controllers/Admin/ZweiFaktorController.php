<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureAdminSessionValid;
use App\Http\Middleware\EnsureSudo;
use App\Http\Requests\Admin\TwoFactorSetupRequest;
use App\Models\AdminUser;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Auth\TwoFactor;
use App\Support\Auth\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Bestätigung in zwei Schritten — setting it up, and what follows (D-514). One page outside the panel frame, like the
 * sign-in: a Super-Admin without it reaches nothing else (EnsureTwoFactorSetUp), so the page cannot lean on the rail.
 *
 *   - Setup: a new key, as a QR code and in letters, kept in the session until a code it makes confirms it. Only then is
 *     it stored — a half-finished setup never locks anyone out.
 *   - The eight recovery codes, shown once after setup and after „Neue Codes erzeugen“; stored only as hashes.
 *   - After every change, every other session of the account ends (endOtherSessions).
 *   - Every route behind the password asked again (EnsureSudo), the first setup too. A new phone, new recovery codes and —
 *     for everyone but the Super-Admin — switching it off. A move to a new phone is allowed only inside the same 15
 *     minutes as the password that started it (REPLACE holds that moment, not a flag that outlives it).
 */
class ZweiFaktorController extends Controller
{
    /** The key being set up, until it is confirmed. */
    public const SETUP = 'admin.two_factor.setup';

    /** When a move of an active second factor to a new phone was started — valid while the password asked again is. */
    public const REPLACE = 'admin.two_factor.replace';

    /** The recovery codes, for the one page that shows them. */
    public const CODES = 'admin.two_factor.codes';

    public const PROFILE = '/admin/profil#zwei-faktor';

    private const NEXT = 'admin.two_factor.next';

    public const EXPIRED = 'Die Einrichtung ist abgelaufen. Scanne bitte den neuen Code.';

    public const REQUIRED = 'Für Super-Admins ist die Bestätigung in zwei Schritten Pflicht. Du kannst sie auf ein neues Gerät übertragen, aber nicht ausschalten.';

    public function __construct(private readonly TwoFactor $twoFactor) {}

    public function show(TwoFactorSetupRequest $request): Response|RedirectResponse
    {
        $admin = $request->admin();
        $codes = $request->session()->get(self::CODES);

        if (is_array($codes) && $codes !== []) {
            return Inertia::render('Admin/ZweiFaktor/Index', [
                'stage' => 'codes',
                'codes' => array_values(array_filter($codes, 'is_string')),
                // Back where it was started: Profil, or — after the first setup — into the admin.
                'next' => $request->session()->pull(self::NEXT) === 'profil' ? self::PROFILE : '/admin',
            ]);
        }

        $active = $this->twoFactor->isActive($admin);

        if ($active && ! self::replacing($request)) {
            return redirect(self::PROFILE);
        }

        $secret = $request->session()->get(self::SETUP);

        if (! is_string($secret) || $secret === '') {
            $secret = Totp::newSecret();
            $request->session()->put(self::SETUP, $secret);
        }

        return Inertia::render('Admin/ZweiFaktor/Index', [
            'stage' => 'setup',
            'email' => $admin->email,
            'required' => $admin->isSuperAdmin(),
            'replacing' => $active,
            // A key set up once and no longer readable (written under an earlier APP_KEY).
            'unreadable' => $this->twoFactor->isUnreadable($admin),
            'qr' => Totp::qrSvg(Totp::uri($secret, $admin->email)),
            'manualKey' => Totp::grouped($secret),
        ]);
    }

    public function store(TwoFactorSetupRequest $request): RedirectResponse
    {
        $admin = $request->admin();
        $secret = $request->session()->get(self::SETUP);
        $replacing = $this->twoFactor->isActive($admin);

        if ($replacing && ! self::replacing($request)) {
            $request->session()->forget([self::SETUP, self::REPLACE]);

            return redirect(self::PROFILE);
        }

        if (! is_string($secret) || $secret === '') {
            throw ValidationException::withMessages(['code' => self::EXPIRED]);
        }

        $codes = $this->twoFactor->confirm($admin, $secret, $request->string('code')->toString());

        if ($codes === null) {
            throw ValidationException::withMessages(['code' => 'Der Code passt nicht zu diesem Schlüssel. Gib den Code ein, den deine App gerade für „RIMIFY“ zeigt.']);
        }

        $request->session()->forget([self::SETUP, self::REPLACE]);
        self::endOtherSessions($request, $admin);
        $request->session()->put(self::NEXT, $admin->isSuperAdmin() && ! $replacing ? 'admin' : 'profil');
        AuditTrail::record($admin, $replacing ? 'admin.two_factor_replaced' : 'admin.two_factor_enabled', [], $admin);

        return redirect()->route('admin.zwei-faktor.einrichten')->with(self::CODES, $codes);
    }

    /** „Auf ein neues Gerät übertragen“: a new key, while the old one keeps working until the new one is confirmed. */
    public function replace(TwoFactorSetupRequest $request): RedirectResponse
    {
        if (! $this->twoFactor->isActive($request->admin())) {
            return redirect()->route('admin.zwei-faktor.einrichten');
        }

        $request->session()->forget(self::SETUP);
        $request->session()->put(self::REPLACE, now()->getTimestamp());

        return redirect()->route('admin.zwei-faktor.einrichten');
    }

    public function recoveryCodes(TwoFactorSetupRequest $request): RedirectResponse
    {
        $admin = $request->admin();

        if (! $this->twoFactor->isActive($admin)) {
            return redirect()->route('admin.zwei-faktor.einrichten');
        }

        $codes = $this->twoFactor->renewRecoveryCodes($admin);
        self::endOtherSessions($request, $admin);
        $request->session()->put(self::NEXT, 'profil');
        AuditTrail::record($admin, 'admin.two_factor_recovery_renewed', [], $admin);

        return redirect()->route('admin.zwei-faktor.einrichten')->with(self::CODES, $codes);
    }

    public function destroy(TwoFactorSetupRequest $request): RedirectResponse
    {
        $admin = $request->admin();

        // Refused on the server, whatever the page offers (R-11): the Super-Admin keeps it.
        if ($admin->isSuperAdmin()) {
            throw ValidationException::withMessages(['two_factor' => self::REQUIRED]);
        }

        if ($this->twoFactor->isActive($admin) || $admin->hasTwoFactorEnabled()) {
            $this->twoFactor->disable($admin);
            self::endOtherSessions($request, $admin);
            AuditTrail::record($admin, 'admin.two_factor_disabled', [], $admin);
        }

        return redirect(self::PROFILE)->with('toast', 'Die Bestätigung in zwei Schritten ist ausgeschaltet.');
    }

    /** A move to a new phone, started inside the window of the password asked again — and that window still open. */
    private static function replacing(Request $request): bool
    {
        $at = $request->session()->get(self::REPLACE);

        return is_int($at) && EnsureSudo::active($request) && $at >= now()->subMinutes(EnsureSudo::MINUTES)->getTimestamp();
    }

    /**
     * After any change to the second factor, every other session of the account ends and no „Angemeldet bleiben“ cookie
     * brings one back — as after a new password (rimify:admin-passwort): a session someone else held before the change
     * must not outlive it. This one stays: the revocation is dated this second, this session the next
     * (EnsureAdminSessionValid ends what began at or before the revocation), and its id is renewed.
     */
    private static function endOtherSessions(Request $request, AdminUser $admin): void
    {
        $now = now()->getTimestamp();

        $admin->forceFill(['sessions_revoked_at' => Carbon::createFromTimestamp($now)]);
        $admin->setRememberToken(Str::random(60));
        $admin->save();

        $request->session()->migrate(true);
        $request->session()->put(EnsureAdminSessionValid::SESSION_KEY, $now + 1);
    }
}
