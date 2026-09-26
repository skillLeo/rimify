<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminPasswordRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Profil — the signed-in person's own account: who the panel thinks they are, and their password.
 *
 * It is the user menu's destination, so it has to exist before that menu may point at it. What it
 * does not yet offer — changing the address, two-factor enrolment — is not shown as a disabled
 * control; it is simply not here until it works.
 */
class AdminProfileController extends Controller
{
    public const PASSWORD_TOAST = 'Dein Passwort ist geändert.';

    public function show(Request $request): Response
    {
        $admin = self::admin($request);

        return Inertia::render('Admin/Profil/Index', [
            'profile' => [
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->roleLabel(),
                'lastLogin' => GermanFormat::dateTime($admin->last_login_at),
                'twoFactor' => $admin->hasTwoFactorEnabled(),
            ],
        ]);
    }

    public function updatePassword(AdminPasswordRequest $request): RedirectResponse
    {
        $admin = $request->admin();

        // The `hashed` cast on the model does the hashing; the plain value never reaches the table.
        $admin->forceFill(['password' => $request->newPassword()])->save();

        // Recorded that it happened, and by whom — never what it was changed from or to.
        activity('admin')
            ->causedBy($admin)
            ->performedOn($admin)
            ->tap(static function (AuditLog $entry) use ($admin): void {
                $entry->forceFill(['actor_email' => $admin->email, 'ip_address' => request()->ip()]);
            })
            ->log('admin.password_changed');

        return back()->with('toast', self::PASSWORD_TOAST);
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
