<?php

declare(strict_types=1);

use App\Enums\AdminUserStatus;
use App\Http\Controllers\Admin\EinladungController;
use App\Http\Middleware\EnsureAdminSessionValid;
use App\Models\AdminInvitation;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ViewErrorBag;
use Inertia\Testing\AssertableInertia;

/**
 * The invitation link — the one door through which a new admin account comes to exist.
 *
 * The token is the only credential the visitor holds, so the tests are about the token: only its
 * SHA-256 is ever stored, it works for seven days, it works once, a withdrawn or replaced link is
 * dead, and none of the dead states says whose invitation it was. Accepting makes the account with
 * the invited role, signs the person in, stamps the session, and is logged by the new account.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    Mail::fake();
});

/**
 * An invitation with a known token, sent by the Super-Admin for the Support role.
 *
 * @param  array<string, mixed>  $attributes
 * @return array{0: AdminInvitation, 1: string}
 */
function einladung(array $attributes = []): array
{
    $token = AdminInvitation::newToken();
    $invitation = new AdminInvitation;
    $invitation->forceFill([
        'email' => 'jana.winter@example.test',
        'name' => 'Jana Winter',
        'role_id' => (int) DB::table('roles')->where('name', 'support-agent')->value('id'),
        'token_hash' => AdminInvitation::hashToken($token),
        'invited_by' => AdminUser::query()->where('email', 'super-admin@rimify.test')->value('id'),
        'expires_at' => now()->addDays(AdminInvitation::VALID_DAYS),
        ...$attributes,
    ])->save();

    return [$invitation, $token];
}

/**
 * What makes a link dead, per state.
 *
 * @return array<string, mixed>
 */
function einladungDead(string $state): array
{
    return match ($state) {
        'expired' => ['expires_at' => now()->subMinute()],
        'revoked' => ['revoked_at' => now()],
        'used' => ['accepted_at' => now()],
        default => [],
    };
}

/**
 * @param  array<string, string>  $overrides
 * @return array<string, string>
 */
function einladungForm(array $overrides = []): array
{
    return [
        'name' => 'Jana Winter',
        'password' => 'ein-langes-passwort',
        'password_confirmation' => 'ein-langes-passwort',
        ...$overrides,
    ];
}

describe('the token', function (): void {
    it('is 32 random bytes, base64url, and only its SHA-256 is stored', function (): void {
        $token = AdminInvitation::newToken();

        expect($token)->toMatch('/^[A-Za-z0-9_-]{43}$/')
            ->and(strlen((string) base64_decode(strtr($token, '-_', '+/'), true)))->toBe(32)
            ->and(AdminInvitation::newToken())->not->toBe($token)
            ->and(AdminInvitation::hashToken($token))->toBe(hash('sha256', $token));

        [$invitation, $stored] = einladung();

        $row = (array) DB::table('admin_invitations')->where('id', $invitation->id)->first();

        expect(json_encode($row))->not->toContain($stored)
            ->and($row['token_hash'])->toBe(hash('sha256', $stored));
    });

    it('is valid for seven days and no longer', function (): void {
        [, $token] = einladung();

        $this->travel(AdminInvitation::VALID_DAYS)->days();
        $this->travel(-1)->minutes();

        $this->get('/admin/einladung/'.$token)->assertInertia(fn (AssertableInertia $page) => $page->where('state', 'open'));

        $this->travel(2)->minutes();

        $this->get('/admin/einladung/'.$token)->assertInertia(fn (AssertableInertia $page) => $page->where('state', 'expired'));

        $this->post('/admin/einladung/'.$token, einladungForm())->assertRedirect('/admin/einladung/'.$token);

        expect(AdminUser::query()->where('email', 'jana.winter@example.test')->exists())->toBeFalse();
    });
});

describe('opening the link', function (): void {
    it('says whose invitation it is, for which role, from whom and until when', function (): void {
        [$invitation, $token] = einladung();

        $this->get('/admin/einladung/'.$token)
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Einladung/Index')
                ->where('state', 'open')
                ->where('invitation.email', 'jana.winter@example.test')
                ->where('invitation.name', 'Jana Winter')
                ->where('invitation.role', 'Support')
                ->where('invitation.invitedBy', 'Sabine Roth')
                ->where('invitation.expiresAt', GermanFormat::dateTime($invitation->expires_at))
                ->missing('invitation.token_hash')
                ->where('admin.account', null));
    });

    it('names each dead state and nothing about whose invitation it was', function (string $state): void {
        [, $token] = einladung(einladungDead($state));

        $this->get('/admin/einladung/'.$token)
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Einladung/Index')
                ->where('state', $state)
                ->where('invitation', null));
    })->with(['expired', 'revoked', 'used']);

    it('reads as used once the address has an account, however it got one', function (): void {
        [, $token] = einladung(['email' => 'support-agent@rimify.test']);

        $this->get('/admin/einladung/'.$token)
            ->assertInertia(fn (AssertableInertia $page) => $page->where('state', 'used')->where('invitation', null));
    });

    it('answers a link that was never issued as unknown', function (): void {
        $this->get('/admin/einladung/'.AdminInvitation::newToken())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('state', 'unknown')->where('invitation', null));
    });
});

describe('accepting', function (): void {
    it('makes the account with the invited role, signs the person in, stamps the session, and logs it', function (): void {
        $this->freezeTime();
        [$invitation, $token] = einladung();

        $this->post('/admin/einladung/'.$token, einladungForm(['name' => '  Jana W.  ']))
            ->assertRedirect('/admin')
            ->assertSessionHas('toast', EinladungController::WELCOME_TOAST)
            ->assertSessionHas(EnsureAdminSessionValid::SESSION_KEY, now()->getTimestamp());

        $user = AdminUser::query()->where('email', 'jana.winter@example.test')->sole();

        expect($user->name)->toBe('Jana W.')
            ->and($user->status)->toBe(AdminUserStatus::Active)
            ->and($user->getRoleNames()->all())->toBe(['support-agent'])
            ->and(Hash::check('ein-langes-passwort', $user->getAuthPassword()))->toBeTrue()
            ->and($user->getAuthPassword())->not->toBe('ein-langes-passwort')
            ->and($user->last_login_at)->not->toBeNull()
            ->and($invitation->fresh()?->accepted_at)->not->toBeNull()
            ->and(Auth::guard('admin')->id())->toBe($user->id);

        $entry = AuditLog::query()->where('description', 'admin.invitation_accepted')->sole();

        expect($entry->properties->all())->toEqual(['email' => 'jana.winter@example.test', 'role_label' => 'Support'])
            ->and($entry->actor_email)->toBe('jana.winter@example.test')
            ->and((int) $entry->causer_id)->toBe($user->id);

        // Straight into the panel, in the role's own navigation.
        $this->get('/admin')->assertOk();
    });

    it('works once: a second attempt makes no second account and says the link is used', function (): void {
        [, $token] = einladung();

        $this->post('/admin/einladung/'.$token, einladungForm())->assertRedirect('/admin');

        Auth::guard('admin')->logout();
        Auth::forgetGuards();

        $this->post('/admin/einladung/'.$token, einladungForm(['name' => 'Jemand anderes']))
            ->assertRedirect('/admin/einladung/'.$token);

        expect(AdminUser::query()->where('email', 'jana.winter@example.test')->count())->toBe(1)
            ->and(AdminUser::query()->where('email', 'jana.winter@example.test')->value('name'))->toBe('Jana Winter');

        $this->get('/admin/einladung/'.$token)->assertInertia(fn (AssertableInertia $page) => $page->where('state', 'used'));
    });

    it('makes nothing from a link that was withdrawn or has run out', function (string $state): void {
        [$invitation, $token] = einladung(einladungDead($state));

        $this->post('/admin/einladung/'.$token, einladungForm())->assertRedirect('/admin/einladung/'.$token);

        expect(AdminUser::query()->where('email', 'jana.winter@example.test')->exists())->toBeFalse()
            ->and($invitation->fresh()?->accepted_at)->toBeNull()
            ->and(Auth::guard('admin')->check())->toBeFalse();
    })->with(['revoked', 'expired']);

    it('makes nothing from a token nobody issued', function (): void {
        $count = AdminUser::query()->count();
        $token = AdminInvitation::newToken();

        $this->post('/admin/einladung/'.$token, einladungForm())->assertRedirect('/admin/einladung/'.$token);

        expect(AdminUser::query()->count())->toBe($count);
    });

    it('asks for a name and a password of at least twelve characters, typed twice, in German', function (): void {
        [, $token] = einladung();

        $this->from('/admin/einladung/'.$token)
            ->post('/admin/einladung/'.$token, einladungForm(['name' => '   ', 'password' => 'kurz', 'password_confirmation' => 'kurz']))
            ->assertSessionHasErrors([
                'name' => 'Bitte gib deinen Namen ein.',
                'password' => 'Das Passwort braucht mindestens 12 Zeichen.',
            ]);

        $this->from('/admin/einladung/'.$token)
            ->post('/admin/einladung/'.$token, einladungForm(['password_confirmation' => 'etwas-ganz-anderes']))
            ->assertSessionHasErrors(['password' => 'Die beiden Passwörter stimmen nicht überein.']);

        expect(AdminUser::query()->where('email', 'jana.winter@example.test')->exists())->toBeFalse();
    });

    it('names the length first when the password is too short and its repeat empty (the admin audit\'s F-29)', function (): void {
        [, $token] = einladung();

        $this->from('/admin/einladung/'.$token)
            ->post('/admin/einladung/'.$token, einladungForm(['password' => 'kurz', 'password_confirmation' => '']));

        // The form shows the first sentence: the length is what to fix first. (The session keeps the bag as an array.)
        $errors = session('errors');
        $first = $errors instanceof ViewErrorBag ? $errors->first('password') : ($errors['default']['messages']['password'][0] ?? null);

        expect($first)->toBe('Das Passwort braucht mindestens 12 Zeichen.');
    });

    it('refuses the link while somebody is signed in, so nobody accepts one in a colleague\'s session', function (): void {
        [, $token] = einladung();

        $this->actingAs(AdminUser::query()->where('email', 'accountant@rimify.test')->firstOrFail(), 'admin')
            ->post('/admin/einladung/'.$token, einladungForm())
            ->assertRedirect();

        expect(AdminUser::query()->where('email', 'jana.winter@example.test')->exists())->toBeFalse();
    });

    it('is throttled, because the token is the only thing the visitor presents', function (): void {
        $token = AdminInvitation::newToken();

        foreach (range(1, 6) as $ignored) {
            $this->post('/admin/einladung/'.$token, einladungForm());
        }

        $this->post('/admin/einladung/'.$token, einladungForm())->assertStatus(429);
    });
});
