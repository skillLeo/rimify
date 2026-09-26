<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InviteAdminRequest;
use App\Http\Requests\Admin\InviteManageRequest;
use App\Http\Requests\Admin\UserRoleAccountRequest;
use App\Http\Requests\Admin\UserRoleRequest;
use App\Mail\AdminInvitationMail;
use App\Models\AdminInvitation;
use App\Models\AdminUser;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Throwable;

/**
 * Team › Benutzer — the accounts that can sign in to the admin, and the invitations that will
 * become accounts (docs/admin/BRIEF.md §2, docs/admin/team-build-plan.md).
 *
 * Accounts are never deleted here: an account that should no longer get in is suspended, which
 * ends every session it has on the next request (EnsureAdminSessionValid). A new account only ever
 * comes from an invitation, so a password is never chosen by anybody but its owner.
 *
 * Four guards stand in front of every change, and each is a sentence the page shows:
 *
 *   - nobody acts on their own account (the Form Requests answer 403);
 *   - nobody hands out a role holding a right they lack themselves — inviting and changing a role
 *     alike. The Super-Admin holds everything and may hand out every role;
 *   - nobody changes an account that holds a right they lack: suspending the owner is the same
 *     takeover as promoting yourself, only in the other direction;
 *   - the last active account that may edit roles cannot be suspended or moved to a role without
 *     that right — the same lockout Rollen & Rechte refuses, in the same words.
 *
 * Every mutation leaves one audit entry through AuditTrail, under the keys the Protokoll reads.
 */
class BenutzerController extends Controller
{
    /** The role that holds everything and may hand out every role (team-build-plan.md). */
    public const SUPER_ADMIN = 'super-admin';

    public const ADDRESS_HAS_ACCOUNT = 'Für diese Adresse gibt es schon ein Konto.';

    public const ADDRESS_INVITED = 'An diese Adresse ist schon eine Einladung unterwegs. '
        .'Unter „Offene Einladungen“ kannst du sie erneut senden.';

    public const ROLE_UNKNOWN = 'Diese Rolle gibt es nicht. Bitte wähle eine aus der Liste.';

    public const ROLE_NOT_ASSIGNABLE = 'Diese Rolle kannst du nicht vergeben, weil sie Rechte enthält, '
        .'die du selbst nicht hast.';

    public const OUT_OF_REACH = 'Diese Person hat Rechte, die du selbst nicht hast. Ihr Konto kann nur '
        .'jemand ändern, der mindestens dieselben Rechte hat.';

    public const SAME_ROLE = 'Diese Person hat diese Rolle schon.';

    public const ALREADY_SUSPENDED = 'Dieses Konto ist schon gesperrt.';

    public const NOT_SUSPENDED = 'Dieses Konto ist nicht gesperrt.';

    public const INVITATION_ACCEPTED = 'Diese Einladung ist schon angenommen.';

    public const INVITATION_REVOKED = 'Diese Einladung ist schon widerrufen.';

    public const MAIL_FAILED = 'Die Einladung ist angelegt, aber die E-Mail konnte nicht verschickt werden. '
        .'Versuch es gleich mit „Erneut senden“.';

    public function index(Request $request): Response
    {
        $admin = self::admin($request);

        abort_unless($admin->may(PermissionModule::Roles, PermissionAction::View), 403);

        $roles = self::roles();
        $reach = self::reach($admin, $roles);
        $held = self::heldRoles();

        $accounts = [];

        foreach (AdminUser::query()->orderBy('name')->orderBy('id')->get() as $user) {
            $ids = $held[(int) $user->getKey()] ?? [];
            $self = $user->is($admin);

            $accounts[] = [
                'id' => (int) $user->getKey(),
                'name' => $user->name,
                'email' => $user->email,
                'roleId' => $ids[0] ?? null,
                'role' => self::labelOf($ids, $roles),
                'status' => $user->status->value,
                'lastLogin' => GermanFormat::dateTime($user->last_login_at),
                'twoFactor' => $user->hasTwoFactorEnabled(),
                'isSelf' => $self,
                // Presentation only: the same question is asked again on every mutation.
                'manageable' => ! $self && self::mayManage($reach, $ids),
            ];
        }

        $invitations = [];
        $seen = [];

        // Newest first, and one row per address: an address invited again after its link ran out
        // shows the new invitation, not both.
        $pending = AdminInvitation::query()->pending()->with(['role', 'inviter'])->orderByDesc('id')->get();

        foreach ($pending as $invitation) {
            $key = mb_strtolower($invitation->email);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;

            $invitations[] = [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'name' => $invitation->name,
                'role' => $invitation->roleLabel(),
                'invitedBy' => $invitation->inviter?->name,
                'expiresAt' => GermanFormat::dateTime($invitation->expires_at),
                'expired' => $invitation->isExpired(),
            ];
        }

        $assignable = [];

        foreach ($roles as $id => $role) {
            if (self::mayAssign($reach, $id)) {
                $assignable[] = ['id' => $id, 'label' => $role['label']];
            }
        }

        return Inertia::render('Admin/Benutzer/Index', [
            'accounts' => $accounts,
            'invitations' => $invitations,
            'assignableRoles' => $assignable,
            // What this admin may do here. The server refuses regardless (R-11).
            'can' => [
                'invite' => $admin->may(PermissionModule::Roles, PermissionAction::Create),
                'manage' => $admin->may(PermissionModule::Roles, PermissionAction::Edit),
            ],
        ]);
    }

    /**
     * *Person einladen*. The address must be free — no account, no open invitation — and the role
     * one this person may hand out. Only the token's hash is stored; the token itself goes into the
     * e-mail and nowhere else.
     */
    public function invite(InviteAdminRequest $request): RedirectResponse
    {
        $admin = $request->admin();
        $email = $request->email();
        $roles = self::roles();
        $roleId = $request->roleId();

        $errors = [];

        if (! isset($roles[$roleId])) {
            $errors['role_id'] = self::ROLE_UNKNOWN;
        } elseif (! self::mayAssign(self::reach($admin, $roles), $roleId)) {
            $errors['role_id'] = self::ROLE_NOT_ASSIGNABLE;
        }

        if (self::addressHasAccount($email)) {
            $errors['email'] = self::ADDRESS_HAS_ACCOUNT;
        } elseif (AdminInvitation::query()->open()->where('email', $email)->exists()) {
            $errors['email'] = self::ADDRESS_INVITED;
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $token = AdminInvitation::newToken();

        $invitation = DB::transaction(function () use ($admin, $email, $request, $roleId, $roles, $token): AdminInvitation {
            // Asked again under the lock, so two people inviting the same address at once cannot
            // both succeed.
            if (AdminInvitation::query()->open()->where('email', $email)->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['email' => self::ADDRESS_INVITED]);
            }

            $invitation = new AdminInvitation;
            $invitation->forceFill([
                'email' => $email,
                'name' => $request->name(),
                'role_id' => $roleId,
                'token_hash' => AdminInvitation::hashToken($token),
                'invited_by' => (int) $admin->getKey(),
                'expires_at' => Date::now()->addDays(AdminInvitation::VALID_DAYS),
            ])->save();

            AuditTrail::record($admin, 'admin.invited', [
                'email' => $email,
                'role_label' => $roles[$roleId]['label'],
            ], $invitation);

            return $invitation;
        });

        return self::sent($invitation, $token, $admin, sprintf('Die Einladung an %s ist verschickt.', $email));
    }

    /** *Erneut senden*: a new link and a new week. The old link stops working the same moment. */
    public function resend(InviteManageRequest $request, AdminInvitation $invitation): RedirectResponse
    {
        $admin = $request->admin();

        self::refuseAnswered($invitation);

        /*
         * Sending a link again is handing the role out again — an expired invitation would otherwise
         * be a way to revive a grant nobody with the rights for it renews.
         */
        if (! self::mayAssign(self::reach($admin, self::roles()), $invitation->role_id)) {
            throw ValidationException::withMessages(['invitation' => self::ROLE_NOT_ASSIGNABLE]);
        }

        if (self::addressHasAccount($invitation->email)) {
            throw ValidationException::withMessages(['invitation' => self::ADDRESS_HAS_ACCOUNT]);
        }

        $token = AdminInvitation::newToken();

        $fresh = DB::transaction(function () use ($admin, $invitation, $token): AdminInvitation {
            $fresh = AdminInvitation::query()->lockForUpdate()->findOrFail($invitation->id);

            self::refuseAnswered($fresh);

            $other = AdminInvitation::query()->open()
                ->where('email', $fresh->email)
                ->whereKeyNot($fresh->id)
                ->exists();

            if ($other) {
                throw ValidationException::withMessages(['invitation' => self::ADDRESS_INVITED]);
            }

            $fresh->forceFill([
                'token_hash' => AdminInvitation::hashToken($token),
                'expires_at' => Date::now()->addDays(AdminInvitation::VALID_DAYS),
            ])->save();

            AuditTrail::record($admin, 'admin.invitation_resent', ['email' => $fresh->email], $fresh);

            return $fresh;
        });

        return self::sent($fresh, $token, $admin, sprintf('Die Einladung an %s ist erneut verschickt.', $fresh->email));
    }

    /** *Widerrufen*: the link stops working. The row stays, so the history of who was invited does. */
    public function revoke(InviteManageRequest $request, AdminInvitation $invitation): RedirectResponse
    {
        $admin = $request->admin();

        self::refuseAnswered($invitation);

        DB::transaction(function () use ($admin, $invitation): void {
            $fresh = AdminInvitation::query()->lockForUpdate()->findOrFail($invitation->id);

            self::refuseAnswered($fresh);

            $fresh->forceFill(['revoked_at' => Date::now()])->save();

            AuditTrail::record($admin, 'admin.invitation_revoked', ['email' => $fresh->email], $fresh);
        });

        return back()->with('toast', sprintf('Die Einladung an %s ist widerrufen.', $invitation->email));
    }

    public function changeRole(UserRoleRequest $request, AdminUser $user): RedirectResponse
    {
        $admin = $request->admin();
        $roles = self::roles();
        $roleId = $request->roleId();
        $reach = self::reach($admin, $roles);
        $current = self::roleIdsOf($user);

        if (! isset($roles[$roleId])) {
            throw ValidationException::withMessages(['role_id' => self::ROLE_UNKNOWN]);
        }

        if (! self::mayManage($reach, $current)) {
            throw ValidationException::withMessages(['role_id' => self::OUT_OF_REACH]);
        }

        if (! self::mayAssign($reach, $roleId)) {
            throw ValidationException::withMessages(['role_id' => self::ROLE_NOT_ASSIGNABLE]);
        }

        if ($current === [$roleId]) {
            throw ValidationException::withMessages(['role_id' => self::SAME_ROLE]);
        }

        $role = Role::query()->where('guard_name', 'admin')->findOrFail($roleId);
        $newLabel = $roles[$roleId]['label'];

        DB::transaction(function () use ($admin, $user, $role, $current, $roles, $newLabel): void {
            self::lockTeam();

            $user->syncRoles([$role]);

            // Asked AFTER the write, inside the transaction: "with this in place, can anybody still
            // edit roles?" A no rolls the change back.
            if (! self::roleEditorsRemain()) {
                throw ValidationException::withMessages(['role_id' => RollenController::LOCKOUT_REFUSAL]);
            }

            AuditTrail::record($admin, 'admin.role_changed', [
                'user_id' => (int) $user->getKey(),
                'email' => $user->email,
                'old_role_label' => self::labelOf($current, $roles),
                'new_role_label' => $newLabel,
            ], $user);
        });

        return back()->with('toast', sprintf('%s hat jetzt die Rolle „%s“.', $user->name, $newLabel));
    }

    /** *Sperren*: the account can no longer sign in, and every session it has ends on its next click. */
    public function suspend(UserRoleAccountRequest $request, AdminUser $user): RedirectResponse
    {
        $admin = $request->admin();

        self::refuseOutOfReach($admin, $user);

        if ($user->status === AdminUserStatus::Suspended) {
            throw ValidationException::withMessages(['account' => self::ALREADY_SUSPENDED]);
        }

        DB::transaction(function () use ($admin, $user): void {
            self::lockTeam();

            $user->forceFill(['status' => AdminUserStatus::Suspended]);
            self::endSessions($user);
            $user->save();

            if (! self::roleEditorsRemain()) {
                throw ValidationException::withMessages(['account' => RollenController::LOCKOUT_REFUSAL]);
            }

            AuditTrail::record($admin, 'admin.suspended', self::who($user), $user);
        });

        return back()->with('toast', sprintf('%s ist gesperrt und überall abgemeldet.', $user->name));
    }

    /** *Entsperren*: the account may sign in again. A lock from too many wrong passwords goes too. */
    public function reactivate(UserRoleAccountRequest $request, AdminUser $user): RedirectResponse
    {
        $admin = $request->admin();

        self::refuseOutOfReach($admin, $user);

        if ($user->status !== AdminUserStatus::Suspended) {
            throw ValidationException::withMessages(['account' => self::NOT_SUSPENDED]);
        }

        DB::transaction(function () use ($admin, $user): void {
            $user->forceFill([
                'status' => AdminUserStatus::Active,
                'locked_until' => null,
                'failed_login_count' => 0,
            ])->save();

            AuditTrail::record($admin, 'admin.reactivated', self::who($user), $user);
        });

        return back()->with('toast', sprintf('%s kann sich wieder anmelden.', $user->name));
    }

    /** *Überall abmelden*: every session this account has ends on its next request. */
    public function revokeSessions(UserRoleAccountRequest $request, AdminUser $user): RedirectResponse
    {
        $admin = $request->admin();

        self::refuseOutOfReach($admin, $user);

        DB::transaction(function () use ($admin, $user): void {
            self::endSessions($user);
            $user->save();

            AuditTrail::record($admin, 'admin.sessions_revoked', self::who($user), $user);
        });

        return back()->with('toast', sprintf('%s ist jetzt überall abgemeldet.', $user->name));
    }

    /* ── Guards ─────────────────────────────────────────────────────────────────────── */

    /**
     * What this admin may hand out: every real cell any of their roles allows, and whether they
     * are the Super-Admin, who may hand out everything.
     *
     * @param  array<int, array{name: string, label: string}>  $roles
     * @return array{super: bool, cells: array<string, true>, byRole: array<int, array<string, true>>}
     */
    private static function reach(AdminUser $admin, array $roles): array
    {
        $byRole = self::cellsByRole();
        $cells = [];
        $super = false;

        foreach (self::roleIdsOf($admin) as $id) {
            $cells += $byRole[$id] ?? [];
            $super = $super || ($roles[$id]['name'] ?? null) === self::SUPER_ADMIN;
        }

        return ['super' => $super, 'cells' => $cells, 'byRole' => $byRole];
    }

    /**
     * Whether the role holds no real right this admin lacks.
     *
     * @param  array{super: bool, cells: array<string, true>, byRole: array<int, array<string, true>>}  $reach
     */
    private static function mayAssign(array $reach, int $roleId): bool
    {
        return $reach['super'] || array_diff_key($reach['byRole'][$roleId] ?? [], $reach['cells']) === [];
    }

    /**
     * Whether an account holding these roles holds no real right this admin lacks.
     *
     * @param  array{super: bool, cells: array<string, true>, byRole: array<int, array<string, true>>}  $reach
     * @param  list<int>  $roleIds
     */
    private static function mayManage(array $reach, array $roleIds): bool
    {
        foreach ($roleIds as $id) {
            if (! self::mayAssign($reach, $id)) {
                return false;
            }
        }

        return true;
    }

    private static function refuseOutOfReach(AdminUser $admin, AdminUser $user): void
    {
        if (! self::mayManage(self::reach($admin, self::roles()), self::roleIdsOf($user))) {
            throw ValidationException::withMessages(['account' => self::OUT_OF_REACH]);
        }
    }

    private static function refuseAnswered(AdminInvitation $invitation): void
    {
        if ($invitation->accepted_at !== null) {
            throw ValidationException::withMessages(['invitation' => self::INVITATION_ACCEPTED]);
        }

        if ($invitation->revoked_at !== null) {
            throw ValidationException::withMessages(['invitation' => self::INVITATION_REVOKED]);
        }
    }

    /**
     * Serialises the changes that could lock the panel. Two admins suspending each other in the
     * same second would otherwise each see the other still active and both succeed. Taken as the
     * transaction's first statement, so everything it reads afterwards is what the other one
     * committed. The table is a team, not a customer list: locking every row is a few dozen rows.
     */
    private static function lockTeam(): void
    {
        DB::table('admin_users')->orderBy('id')->lockForUpdate()->pluck('id');
    }

    /**
     * Whether at least one account that may sign in can still edit roles. Suspended accounts do not
     * count: an account that cannot get in cannot let anybody else back in either.
     */
    private static function roleEditorsRemain(): bool
    {
        return DB::table('role_permissions as rp')
            ->join('model_has_roles as mhr', 'mhr.role_id', '=', 'rp.role_id')
            ->join('admin_users as u', 'u.id', '=', 'mhr.model_id')
            ->where('mhr.model_type', (new AdminUser)->getMorphClass())
            ->where('rp.module', PermissionModule::Roles->value)
            ->where('rp.action', PermissionAction::Edit->value)
            ->where('rp.allowed', true)
            ->where('u.status', AdminUserStatus::Active->value)
            ->exists();
    }

    private static function addressHasAccount(string $email): bool
    {
        return AdminUser::query()->where('email', $email)->exists();
    }

    /* ── Reading roles ──────────────────────────────────────────────────────────────── */

    /**
     * Every admin role, system roles first, keyed by id.
     *
     * @return array<int, array{name: string, label: string}>
     */
    private static function roles(): array
    {
        $rows = DB::table('roles')
            ->where('guard_name', 'admin')
            ->orderByDesc('is_system')
            ->orderBy('id')
            ->get(['id', 'name', 'label_de']);

        $roles = [];

        foreach ($rows as $row) {
            $name = (string) $row->name;
            $label = is_string($row->label_de) && $row->label_de !== '' ? $row->label_de : $name;
            $roles[(int) $row->id] = ['name' => $name, 'label' => $label];
        }

        return $roles;
    }

    /**
     * The allowed cells of every role, only the real ones (PermissionModule::actions()): a stray
     * row for a right no code asks about neither grants nor blocks anything.
     *
     * @return array<int, array<string, true>>
     */
    private static function cellsByRole(): array
    {
        $real = array_flip(PermissionModule::cells());
        $cells = [];

        $rows = DB::table('role_permissions')->where('allowed', true)->get(['role_id', 'module', 'action']);

        foreach ($rows as $row) {
            $key = (string) $row->module.'.'.(string) $row->action;

            if (isset($real[$key])) {
                $cells[(int) $row->role_id][$key] = true;
            }
        }

        return $cells;
    }

    /**
     * The role ids each account holds, in one query for the whole list.
     *
     * @return array<int, list<int>>
     */
    private static function heldRoles(): array
    {
        $rows = DB::table('model_has_roles')
            ->where('model_type', (new AdminUser)->getMorphClass())
            ->orderBy('role_id')
            ->get(['model_id', 'role_id']);

        $held = [];

        foreach ($rows as $row) {
            $held[(int) $row->model_id][] = (int) $row->role_id;
        }

        return $held;
    }

    /**
     * Read from the table, not from a loaded relation, so the answer is the database's as it is now.
     *
     * @return list<int>
     */
    private static function roleIdsOf(AdminUser $user): array
    {
        return DB::table('model_has_roles')
            ->where('model_type', $user->getMorphClass())
            ->where('model_id', $user->getKey())
            ->orderBy('role_id')
            ->pluck('role_id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $roleIds
     * @param  array<int, array{name: string, label: string}>  $roles
     */
    private static function labelOf(array $roleIds, array $roles): ?string
    {
        $labels = [];

        foreach ($roleIds as $id) {
            if (isset($roles[$id])) {
                $labels[] = $roles[$id]['label'];
            }
        }

        return $labels === [] ? null : implode(', ', $labels);
    }

    /* ── Writing ────────────────────────────────────────────────────────────────────── */

    /**
     * Stamps the moment every existing session stops counting, and rotates the remember-me token
     * so no "Angemeldet bleiben" cookie brings one back.
     */
    private static function endSessions(AdminUser $user): void
    {
        $user->forceFill(['sessions_revoked_at' => Date::now()]);
        $user->setRememberToken(Str::random(60));
    }

    /**
     * Sends the link, after the transaction: a mail must never go out for an invitation that was
     * rolled back. A mail that fails leaves the invitation in place and says so, rather than
     * pretending — *Erneut senden* issues a new link.
     */
    private static function sent(AdminInvitation $invitation, string $token, AdminUser $admin, string $toast): RedirectResponse
    {
        try {
            Mail::to($invitation->email)->send(new AdminInvitationMail(
                url: route('admin.einladung', ['token' => $token]),
                inviterName: $admin->name,
                roleLabel: $invitation->roleLabel() ?? '',
                expiresAt: (string) GermanFormat::dateTime($invitation->expires_at),
                recipientName: $invitation->name,
            ));
        } catch (Throwable $e) {
            report($e);

            return back()->with('toast', self::MAIL_FAILED);
        }

        return back()->with('toast', $toast);
    }

    /** @return array{user_id: int, email: string} */
    private static function who(AdminUser $user): array
    {
        return ['user_id' => (int) $user->getKey(), 'email' => $user->email];
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
