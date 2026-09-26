<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\AdminUserStatus;
use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureAdminSessionValid;
use App\Http\Requests\Admin\AcceptInvitationRequest;
use App\Models\AdminInvitation;
use App\Models\AdminUser;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * The link in the invitation e-mail: the one door through which a new admin account comes to exist.
 *
 * The token is the only thing the visitor presents, so it is looked up by its SHA-256 and nothing
 * else, it works once, and it works for seven days. Every other state — run out, withdrawn, already
 * used, never issued — renders one plain sentence and what to do next; none of them reveals whose
 * invitation it was.
 *
 * Accepting creates the account with the invited role, signs the person in and stamps the session
 * (EnsureAdminSessionValid), and leaves an audit entry written by the new account itself.
 */
class EinladungController extends Controller
{
    public const WELCOME_TOAST = 'Dein Konto ist eingerichtet. Willkommen im RIMIFY-Admin.';

    public function show(string $token): Response
    {
        $invitation = AdminInvitation::findByToken($token);
        $state = $invitation === null ? 'unknown' : self::state($invitation);

        return Inertia::render('Admin/Einladung/Index', [
            'state' => $state,
            // Only an open link says whose invitation it is: the address and the role are the
            // recipient's to see, and nobody else's.
            'invitation' => $invitation !== null && $state === 'open' ? [
                'email' => $invitation->email,
                'name' => $invitation->name,
                'role' => $invitation->roleLabel(),
                'invitedBy' => $invitation->inviter?->name,
                'expiresAt' => GermanFormat::dateTime($invitation->expires_at),
            ] : null,
        ]);
    }

    public function accept(AcceptInvitationRequest $request, string $token): RedirectResponse
    {
        $user = DB::transaction(function () use ($request, $token): ?AdminUser {
            // Locked, so the same link sent twice at once makes one account, not two.
            $invitation = AdminInvitation::query()
                ->where('token_hash', AdminInvitation::hashToken($token))
                ->lockForUpdate()
                ->first();

            if ($invitation === null || self::state($invitation) !== 'open') {
                return null;
            }

            $role = Role::query()->where('guard_name', 'admin')->find($invitation->role_id);

            if (! $role instanceof Role) {
                return null;
            }

            $user = new AdminUser;
            $user->forceFill([
                'name' => $request->name(),
                'email' => $invitation->email,
                // The model's `hashed` cast hashes it; the plain value never reaches the table.
                'password' => $request->password(),
                'status' => AdminUserStatus::Active,
            ])->save();

            $user->syncRoles([$role]);

            $invitation->forceFill(['accepted_at' => Date::now()])->save();

            AuditTrail::record($user, 'admin.invitation_accepted', [
                'email' => $invitation->email,
                'role_label' => $invitation->roleLabel(),
            ], $invitation);

            return $user;
        });

        // The link stopped working while the form was open: the page says which way, and what to do.
        if (! $user instanceof AdminUser) {
            return redirect()->route('admin.einladung', ['token' => $token]);
        }

        Auth::guard('admin')->login($user);
        $request->session()->regenerate();
        // When this session began: *Überall abmelden* ends every session older than its moment.
        $request->session()->put(EnsureAdminSessionValid::SESSION_KEY, Date::now()->getTimestamp());

        $user->forceFill(['last_login_at' => Date::now()])->save();

        return redirect(AdminLoginController::HOME)->with('toast', self::WELCOME_TOAST);
    }

    /**
     * What the link says. An address that has an account by now reads as used: whichever way it got
     * there, the answer is to sign in, not to make a second account.
     *
     * @return 'open'|'expired'|'revoked'|'used'
     */
    private static function state(AdminInvitation $invitation): string
    {
        $state = $invitation->state();

        if ($state === 'open' && AdminUser::query()->where('email', $invitation->email)->exists()) {
            return 'used';
        }

        return $state;
    }
}
