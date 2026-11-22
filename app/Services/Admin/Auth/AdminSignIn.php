<?php

declare(strict_types=1);

namespace App\Services\Admin\Auth;

use App\Http\Middleware\EnsureAdminSessionValid;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * The end of a sign-in, whichever way it came: the password alone, or the password and then the second step (D-514).
 * The session is started only here — never between the two steps.
 */
final class AdminSignIn
{
    /** What lies between the two steps: who passed the password, whether to stay signed in, and since when. */
    public const PENDING = 'admin.two_factor.pending';

    /** How long the second step waits for its code before the password is asked again. */
    public const PENDING_MINUTES = 5;

    public static function complete(Request $request, AdminUser $user, bool $remember): void
    {
        Auth::guard('admin')->login($user, $remember);
        $user->forceFill(['last_login_at' => now()])->save();

        $request->session()->forget(self::PENDING);
        $request->session()->regenerate();
        // When this session began: *Überall abmelden* ends every session older than its moment.
        $request->session()->put(EnsureAdminSessionValid::SESSION_KEY, now()->getTimestamp());
    }

    /** The account waiting for its code, while it still may wait. */
    public static function pending(Request $request): ?AdminUser
    {
        $pending = $request->session()->get(self::PENDING);

        if (! is_array($pending) || ! is_int($pending['at'] ?? null) || $pending['at'] < now()->subMinutes(self::PENDING_MINUTES)->getTimestamp()) {
            return null;
        }

        $user = AdminUser::query()->find($pending['id'] ?? null);

        return $user instanceof AdminUser ? $user : null;
    }

    public static function remember(Request $request): bool
    {
        $pending = $request->session()->get(self::PENDING);

        return is_array($pending) && ($pending['remember'] ?? false) === true;
    }
}
