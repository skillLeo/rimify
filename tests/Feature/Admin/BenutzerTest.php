<?php

declare(strict_types=1);

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Admin\BenutzerController;
use App\Http\Controllers\Admin\RollenController;
use App\Http\Middleware\EnsureAdminSessionValid;
use App\Mail\AdminInvitationMail;
use App\Models\AdminInvitation;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia;

/**
 * Team › Benutzer — accounts, invitations, suspension and *Überall abmelden*.
 *
 * Every endpoint is tried by a role that may (it works, and leaves an audit entry under the keys the
 * Protokoll reads) and by one that may not (403, nothing changes). Every guard of the build contract
 * is tried on its own: nobody acts on themselves, nobody hands out or touches rights they lack, the
 * last account that can edit roles stays, addresses are never invited twice, and an account is
 * never deleted. The force logout is proven the way it happens: a real sign-in, a revocation, and
 * the next request of that same session.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    Mail::fake();
});

/** The seeded account for a role, as AccessSeeder names it. */
function benutzerAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function benutzerRoleId(string $name): int
{
    return (int) DB::table('roles')->where('name', $name)->where('guard_name', 'admin')->value('id');
}

/**
 * A role that holds exactly these cells (`module.action`), and one active account holding it.
 *
 * @param  list<string>  $cells
 */
function benutzerAccountWith(string $role, array $cells): AdminUser
{
    $id = DB::table('roles')->insertGetId([
        'name' => $role,
        'guard_name' => 'admin',
        'label_de' => ucfirst($role),
        'is_system' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    foreach ($cells as $cell) {
        [$module, $action] = explode('.', $cell);

        DB::table('role_permissions')->insert([
            'role_id' => $id,
            'module' => $module,
            'action' => $action,
            'allowed' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    $user = AdminUser::factory()->create(['email' => $role.'@rimify.test', 'name' => ucfirst($role)]);
    $user->syncRoles([$role]);

    return $user;
}

/**
 * Manages the team and sees orders, customers, the catalogue and the documents — so the Support
 * Agent is within reach and the Buchhaltung (orders × export) and the Super-Admin are not.
 */
function benutzerLead(): AdminUser
{
    return benutzerAccountWith('teamleitung', [
        'roles.view', 'roles.create', 'roles.edit',
        'orders.view', 'customers.view', 'catalogue.view', 'approvals.view',
    ]);
}

/**
 * An invitation with a known token.
 *
 * @param  array<string, mixed>  $attributes
 * @return array{0: AdminInvitation, 1: string}
 */
function benutzerInvitation(array $attributes = []): array
{
    $token = AdminInvitation::newToken();
    $invitation = new AdminInvitation;
    $invitation->forceFill([
        'email' => 'neu@example.test',
        'name' => 'Neue Person',
        'role_id' => benutzerRoleId('support-agent'),
        'token_hash' => AdminInvitation::hashToken($token),
        'invited_by' => benutzerAdmin()->id,
        'expires_at' => now()->addDays(7),
        ...$attributes,
    ])->save();

    return [$invitation, $token];
}

function benutzerLastEntry(string $event): ?AuditLog
{
    return AuditLog::query()->where('log_name', 'admin')->where('description', $event)->latest('id')->first();
}

/** The token inside a link the mail carries. */
function benutzerTokenFrom(string $url): string
{
    return (string) substr((string) parse_url($url, PHP_URL_PATH), strlen('/admin/einladung/'));
}

/**
 * Simulates the one way the lockout guard is reached: while this change is being written, the only
 * other account that may edit roles is suspended by somebody else. The next query that starts with
 * `$sql` suspends the actor in the same transaction, exactly as a concurrent commit would appear.
 */
function benutzerActorFallsAwayOn(AdminUser $actor, string $sql): void
{
    $fired = false;

    DB::listen(function (QueryExecuted $query) use (&$fired, $actor, $sql): void {
        if ($fired || ! str_starts_with($query->sql, $sql)) {
            return;
        }

        $fired = true;
        DB::table('admin_users')->where('id', $actor->id)->update(['status' => AdminUserStatus::Suspended->value]);
    });
}

describe('the list', function (): void {
    it('shows every account with its role, status, last sign-in and two-factor, and your own row without actions', function (): void {
        $admin = benutzerAdmin();
        $admin->forceFill(['last_login_at' => now()->subDay()])->save();

        $this->actingAs($admin, 'admin')->get('/admin/benutzer')
            ->assertOk()
            ->assertInertia(function (AssertableInertia $page) use ($admin): void {
                $page->component('Admin/Benutzer/Index')
                    ->has('accounts', 7)
                    ->where('can.invite', true)
                    ->where('can.manage', true);

                $accounts = collect($page->toArray()['props']['accounts']);
                $own = $accounts->firstWhere('email', 'super-admin@rimify.test');
                $agent = $accounts->firstWhere('email', 'support-agent@rimify.test');

                expect($own['isSelf'])->toBeTrue()
                    ->and($own['manageable'])->toBeFalse()
                    ->and($own['role'])->toBe('Super-Admin')
                    ->and($own['status'])->toBe('active')
                    ->and($own['twoFactor'])->toBeTrue()
                    ->and($own['lastLogin'])->toBe(GermanFormat::dateTime($admin->fresh()?->last_login_at))
                    ->and($agent['isSelf'])->toBeFalse()
                    ->and($agent['manageable'])->toBeTrue()
                    ->and($agent['role'])->toBe('Support')
                    ->and($agent['twoFactor'])->toBeFalse()
                    ->and($agent['lastLogin'])->toBeNull()
                    ->and($agent)->not->toHaveKey('password');
            });
    });

    it('offers only the roles this person may hand out, and marks accounts beyond their reach', function (): void {
        $lead = benutzerLead();

        $this->actingAs($lead, 'admin')->get('/admin/benutzer')
            ->assertOk()
            ->assertInertia(function (AssertableInertia $page): void {
                $props = $page->toArray()['props'];
                $labels = array_column($props['assignableRoles'], 'label');
                $accounts = collect($props['accounts']);

                expect($labels)->toContain('Support')
                    ->and($labels)->toContain('Teamleitung')
                    ->and($labels)->not->toContain('Super-Admin')
                    ->and($labels)->not->toContain('Buchhaltung')
                    ->and($accounts->firstWhere('email', 'support-agent@rimify.test')['manageable'])->toBeTrue()
                    ->and($accounts->firstWhere('email', 'accountant@rimify.test')['manageable'])->toBeFalse()
                    ->and($accounts->firstWhere('email', 'super-admin@rimify.test')['manageable'])->toBeFalse();
            });
    });

    it('lists the invitations still waiting, one per address, and leaves out answered ones', function (): void {
        benutzerInvitation(['email' => 'offen@example.test']);
        benutzerInvitation(['email' => 'abgelaufen@example.test', 'expires_at' => now()->subDay()]);
        benutzerInvitation(['email' => 'angenommen@example.test', 'accepted_at' => now()]);
        benutzerInvitation(['email' => 'widerrufen@example.test', 'revoked_at' => now()]);
        // Invited again after the first link ran out: only the new one is listed.
        benutzerInvitation(['email' => 'zweimal@example.test', 'expires_at' => now()->subDay()]);
        [$second] = benutzerInvitation(['email' => 'zweimal@example.test']);

        $this->actingAs(benutzerAdmin(), 'admin')->get('/admin/benutzer')
            ->assertInertia(function (AssertableInertia $page) use ($second): void {
                $rows = collect($page->toArray()['props']['invitations']);

                expect($rows->pluck('email')->sort()->values()->all())
                    ->toBe(['abgelaufen@example.test', 'offen@example.test', 'zweimal@example.test'])
                    ->and($rows->firstWhere('email', 'zweimal@example.test')['id'])->toBe($second->id)
                    ->and($rows->firstWhere('email', 'abgelaufen@example.test')['expired'])->toBeTrue()
                    ->and($rows->firstWhere('email', 'offen@example.test')['expired'])->toBeFalse()
                    ->and($rows->firstWhere('email', 'offen@example.test')['role'])->toBe('Support')
                    ->and($rows->firstWhere('email', 'offen@example.test')['invitedBy'])->toBe('Sabine Roth')
                    ->and($rows->first())->not->toHaveKey('token_hash');
            });
    });

    it('shows the lists without controls to somebody who may only look', function (): void {
        $reader = benutzerAccountWith('teamansicht', ['roles.view']);

        $this->actingAs($reader, 'admin')->get('/admin/benutzer')
            ->assertOk()
            ->assertInertia(function (AssertableInertia $page): void {
                $page->where('can.invite', false)->where('can.manage', false);

                expect(collect($page->toArray()['props']['accounts'])->where('manageable', true))->toBeEmpty();
            });
    });

    it('refuses a role that may not see the team', function (): void {
        $this->actingAs(benutzerAdmin('accountant'), 'admin')->get('/admin/benutzer')->assertForbidden();
    });

    it('sends somebody who is not signed in to the sign-in screen', function (): void {
        $this->get('/admin/benutzer')->assertRedirect('/admin/anmelden');
    });
});

describe('inviting', function (): void {
    it('stores only the hash of the link, sends it by mail, and logs it', function (): void {
        $admin = benutzerAdmin();

        $this->actingAs($admin, 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', [
                'name' => 'Jana Winter',
                'email' => '  Jana.Winter@Example.test ',
                'role_id' => benutzerRoleId('support-agent'),
            ])
            ->assertRedirect('/admin/benutzer')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast', 'Die Einladung an jana.winter@example.test ist verschickt.');

        $invitation = AdminInvitation::query()->sole();

        expect($invitation->email)->toBe('jana.winter@example.test')
            ->and($invitation->name)->toBe('Jana Winter')
            ->and($invitation->token_hash)->toMatch('/^[0-9a-f]{64}$/')
            ->and($invitation->invited_by)->toBe($admin->id)
            ->and($invitation->isOpen())->toBeTrue()
            ->and(abs($invitation->expires_at->diffInSeconds(now()->addDays(7))))->toBeLessThan(5);

        Mail::assertSent(AdminInvitationMail::class, function (AdminInvitationMail $mail) use ($invitation): bool {
            $token = benutzerTokenFrom($mail->url);

            return $mail->hasTo('jana.winter@example.test')
                && $mail->url === route('admin.einladung', ['token' => $token])
                && strlen($token) === 43
                && AdminInvitation::hashToken($token) === $invitation->token_hash
                && $mail->inviterName === 'Sabine Roth'
                && $mail->roleLabel === 'Support'
                && $mail->expiresAt === GermanFormat::dateTime($invitation->expires_at);
        });

        $entry = benutzerLastEntry('admin.invited');

        expect($entry?->properties->all())->toEqual(['email' => 'jana.winter@example.test', 'role_label' => 'Support'])
            ->and($entry?->actor_email)->toBe('super-admin@rimify.test')
            ->and((int) $entry?->subject_id)->toBe($invitation->id);
    });

    it('writes the mail in German, with the subject, the inviter, the role, the link and the date', function (): void {
        $mail = new AdminInvitationMail(
            url: 'https://rimify.test/admin/einladung/abc',
            inviterName: 'Sabine Roth',
            roleLabel: 'Support',
            expiresAt: '03.10.2026, 14:22 Uhr',
            recipientName: 'Jana',
        );

        $mail->assertHasSubject('Deine Einladung zum RIMIFY-Admin');
        $mail->assertSeeInHtml('Sabine Roth');
        $mail->assertSeeInHtml('Support');
        $mail->assertSeeInHtml('https://rimify.test/admin/einladung/abc', false);
        $mail->assertSeeInHtml('03.10.2026, 14:22 Uhr');
        $mail->assertSeeInHtml('Hallo Jana');

        // Sent at once, never queued: the link with its plain token is never written to a jobs table,
        // and "ist verschickt" is true whether or not a queue worker runs.
        expect($mail)->not->toBeInstanceOf(ShouldQueue::class);
    });

    it('refuses an address that already has an account', function (): void {
        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'Support-Agent@rimify.test', 'role_id' => benutzerRoleId('support-agent')])
            ->assertSessionHasErrors(['email' => BenutzerController::ADDRESS_HAS_ACCOUNT]);

        expect(AdminInvitation::query()->count())->toBe(0);
        Mail::assertNothingSent();
    });

    it('refuses an address with an open invitation, but not one whose link ran out', function (): void {
        benutzerInvitation(['email' => 'offen@example.test']);
        benutzerInvitation(['email' => 'abgelaufen@example.test', 'expires_at' => now()->subMinute()]);

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'offen@example.test', 'role_id' => benutzerRoleId('support-agent')])
            ->assertSessionHasErrors(['email' => BenutzerController::ADDRESS_INVITED]);

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'abgelaufen@example.test', 'role_id' => benutzerRoleId('support-agent')])
            ->assertSessionHasNoErrors();

        expect(AdminInvitation::query()->where('email', 'abgelaufen@example.test')->count())->toBe(2);
    });

    it('refuses a role holding a right the inviter lacks, and allows one within reach', function (): void {
        $lead = benutzerLead();

        $this->actingAs($lead, 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'a@example.test', 'role_id' => benutzerRoleId('accountant')])
            ->assertSessionHasErrors(['role_id' => BenutzerController::ROLE_NOT_ASSIGNABLE]);

        $this->actingAs($lead, 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'b@example.test', 'role_id' => benutzerRoleId('super-admin')])
            ->assertSessionHasErrors(['role_id' => BenutzerController::ROLE_NOT_ASSIGNABLE]);

        $this->actingAs($lead, 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'c@example.test', 'role_id' => benutzerRoleId('support-agent')])
            ->assertSessionHasNoErrors();

        expect(AdminInvitation::query()->pluck('email')->all())->toBe(['c@example.test']);
    });

    it('lets the Super-Admin hand out every role, its own included', function (): void {
        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'chefin@example.test', 'role_id' => benutzerRoleId('super-admin')])
            ->assertSessionHasNoErrors();

        expect(AdminInvitation::query()->sole()->role_id)->toBe(benutzerRoleId('super-admin'));
    });

    it('asks for a real address and a real role, in German', function (): void {
        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'keine-adresse', 'role_id' => 99999])
            ->assertSessionHasErrors([
                'email' => 'Das sieht nicht nach einer E-Mail-Adresse aus.',
            ]);

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'x@example.test', 'role_id' => 99999])
            ->assertSessionHasErrors(['role_id' => BenutzerController::ROLE_UNKNOWN]);

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', [])
            ->assertSessionHasErrors(['email' => 'Bitte gib die E-Mail-Adresse der Person ein.', 'role_id' => 'Bitte wähle eine Rolle.']);
    });

    it('refuses a role that may not create in Rollen & Rechte', function (string $email): void {
        if ($email === 'teamansicht@rimify.test') {
            benutzerAccountWith('teamansicht', ['roles.view', 'roles.edit']);
        }

        $this->actingAs(AdminUser::query()->where('email', $email)->firstOrFail(), 'admin')
            ->post('/admin/benutzer/einladungen', ['email' => 'x@example.test', 'role_id' => benutzerRoleId('support-agent')])
            ->assertForbidden();

        expect(AdminInvitation::query()->count())->toBe(0);
        Mail::assertNothingSent();
    })->with(['accountant@rimify.test', 'teamansicht@rimify.test']);

    it('keeps the invitation and says so when the mail cannot be sent', function (): void {
        Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP nicht erreichbar'));

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post('/admin/benutzer/einladungen', ['email' => 'x@example.test', 'role_id' => benutzerRoleId('support-agent')])
            ->assertRedirect('/admin/benutzer')
            ->assertSessionHas('toast', BenutzerController::MAIL_FAILED);

        expect(AdminInvitation::query()->count())->toBe(1);
    });
});

describe('sending an invitation again', function (): void {
    it('issues a new link and a new week, and the old link stops working', function (): void {
        [$invitation, $old] = benutzerInvitation(['expires_at' => now()->addDay()]);
        $oldHash = $invitation->token_hash;

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/einladungen/{$invitation->id}/erneut")
            ->assertRedirect('/admin/benutzer')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast', 'Die Einladung an neu@example.test ist erneut verschickt.');

        $fresh = $invitation->fresh();

        expect($fresh?->token_hash)->not->toBe($oldHash)
            ->and(abs((int) $fresh?->expires_at->diffInSeconds(now()->addDays(7))))->toBeLessThan(5);

        Mail::assertSent(AdminInvitationMail::class, fn (AdminInvitationMail $mail): bool => $mail->hasTo('neu@example.test')
            && AdminInvitation::hashToken(benutzerTokenFrom($mail->url)) === $fresh?->token_hash);

        // The link is opened by the invited person, who is nobody's session yet.
        auth('admin')->logout();

        $this->get('/admin/einladung/'.$old)
            ->assertInertia(fn (AssertableInertia $page) => $page->where('state', 'unknown'));

        expect(benutzerLastEntry('admin.invitation_resent')?->properties->all())->toBe(['email' => 'neu@example.test']);
    });

    it('revives an invitation whose link ran out', function (): void {
        [$invitation] = benutzerInvitation(['expires_at' => now()->subDay()]);

        $this->actingAs(benutzerAdmin(), 'admin')->post("/admin/benutzer/einladungen/{$invitation->id}/erneut")
            ->assertSessionHasNoErrors();

        expect($invitation->fresh()?->isOpen())->toBeTrue();
    });

    it('refuses an invitation that was accepted or withdrawn', function (): void {
        [$accepted] = benutzerInvitation(['email' => 'a@example.test', 'accepted_at' => now()]);
        [$revoked] = benutzerInvitation(['email' => 'b@example.test', 'revoked_at' => now()]);

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/einladungen/{$accepted->id}/erneut")
            ->assertSessionHasErrors(['invitation' => BenutzerController::INVITATION_ACCEPTED]);

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/einladungen/{$revoked->id}/erneut")
            ->assertSessionHasErrors(['invitation' => BenutzerController::INVITATION_REVOKED]);

        Mail::assertNothingSent();
    });

    it('refuses somebody who may not hand out the role the invitation carries', function (): void {
        [$invitation] = benutzerInvitation(['role_id' => benutzerRoleId('super-admin'), 'expires_at' => now()->subDay()]);

        $this->actingAs(benutzerLead(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/einladungen/{$invitation->id}/erneut")
            ->assertSessionHasErrors(['invitation' => BenutzerController::ROLE_NOT_ASSIGNABLE]);

        expect($invitation->fresh()?->isOpen())->toBeFalse();
    });

    it('refuses a role that may not invite', function (): void {
        [$invitation] = benutzerInvitation();

        $this->actingAs(benutzerAdmin('accountant'), 'admin')
            ->post("/admin/benutzer/einladungen/{$invitation->id}/erneut")
            ->assertForbidden();

        expect($invitation->fresh()?->token_hash)->toBe($invitation->token_hash);
    });

    it('answers an invitation that does not exist with a 404', function (): void {
        $this->actingAs(benutzerAdmin(), 'admin')->post('/admin/benutzer/einladungen/99999/erneut')->assertNotFound();
    });
});

describe('withdrawing an invitation', function (): void {
    it('stops the link and keeps the row', function (): void {
        [$invitation, $token] = benutzerInvitation();

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->delete("/admin/benutzer/einladungen/{$invitation->id}")
            ->assertRedirect('/admin/benutzer')
            ->assertSessionHas('toast', 'Die Einladung an neu@example.test ist widerrufen.');

        expect(AdminInvitation::query()->count())->toBe(1)
            ->and($invitation->fresh()?->revoked_at)->not->toBeNull()
            ->and(benutzerLastEntry('admin.invitation_revoked')?->properties->all())->toBe(['email' => 'neu@example.test']);

        // The link is opened by the invited person, who is nobody's session yet.
        auth('admin')->logout();

        $this->get('/admin/einladung/'.$token)
            ->assertInertia(fn (AssertableInertia $page) => $page->where('state', 'revoked')->where('invitation', null));
    });

    it('refuses an invitation that was already accepted', function (): void {
        [$invitation] = benutzerInvitation(['accepted_at' => now()]);

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->delete("/admin/benutzer/einladungen/{$invitation->id}")
            ->assertSessionHasErrors(['invitation' => BenutzerController::INVITATION_ACCEPTED]);

        expect($invitation->fresh()?->revoked_at)->toBeNull();
    });

    it('refuses a role that may not invite', function (): void {
        [$invitation] = benutzerInvitation();

        $this->actingAs(benutzerAdmin('support-agent'), 'admin')
            ->delete("/admin/benutzer/einladungen/{$invitation->id}")
            ->assertForbidden();

        expect($invitation->fresh()?->revoked_at)->toBeNull();
    });
});

describe('changing a role', function (): void {
    it('moves an account to another role and logs old and new', function (): void {
        $agent = benutzerAdmin('support-agent');

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->patch("/admin/benutzer/{$agent->id}/rolle", ['role_id' => benutzerRoleId('accountant')])
            ->assertRedirect('/admin/benutzer')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast', 'Nils Fuchs hat jetzt die Rolle „Buchhaltung“.');

        expect($agent->fresh()?->getRoleNames()->all())->toBe(['accountant']);

        $entry = benutzerLastEntry('admin.role_changed');

        // toEqual, not toBe: MySQL keeps JSON keys in its own order, so only the content can be compared.
        expect($entry?->properties->all())->toEqual([
            'user_id' => $agent->id,
            'email' => 'support-agent@rimify.test',
            'old_role_label' => 'Support',
            'new_role_label' => 'Buchhaltung',
        ])->and((int) $entry?->subject_id)->toBe($agent->id);
    });

    it('refuses changing your own role', function (): void {
        $admin = benutzerAdmin();

        $this->actingAs($admin, 'admin')
            ->patch("/admin/benutzer/{$admin->id}/rolle", ['role_id' => benutzerRoleId('accountant')])
            ->assertForbidden();

        expect($admin->fresh()?->getRoleNames()->all())->toBe(['super-admin']);
    });

    it('refuses a role that may not edit roles', function (): void {
        $agent = benutzerAdmin('support-agent');
        $creator = benutzerAccountWith('einlader', ['roles.view', 'roles.create']);

        $this->actingAs($creator, 'admin')
            ->patch("/admin/benutzer/{$agent->id}/rolle", ['role_id' => benutzerRoleId('accountant')])
            ->assertForbidden();

        expect($agent->fresh()?->getRoleNames()->all())->toBe(['support-agent']);
    });

    it('refuses a role holding a right the actor lacks', function (): void {
        $agent = benutzerAdmin('support-agent');

        $this->actingAs(benutzerLead(), 'admin')->from('/admin/benutzer')
            ->patch("/admin/benutzer/{$agent->id}/rolle", ['role_id' => benutzerRoleId('catalogue-manager')])
            ->assertSessionHasErrors(['role_id' => BenutzerController::ROLE_NOT_ASSIGNABLE]);

        expect($agent->fresh()?->getRoleNames()->all())->toBe(['support-agent']);
    });

    it('refuses touching an account that holds rights the actor lacks', function (): void {
        $owner = benutzerAdmin();

        $this->actingAs(benutzerLead(), 'admin')->from('/admin/benutzer')
            ->patch("/admin/benutzer/{$owner->id}/rolle", ['role_id' => benutzerRoleId('support-agent')])
            ->assertSessionHasErrors(['role_id' => BenutzerController::OUT_OF_REACH]);

        expect($owner->fresh()?->getRoleNames()->all())->toBe(['super-admin']);
    });

    it('says so when the account already has that role', function (): void {
        $agent = benutzerAdmin('support-agent');

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->patch("/admin/benutzer/{$agent->id}/rolle", ['role_id' => benutzerRoleId('support-agent')])
            ->assertSessionHasErrors(['role_id' => BenutzerController::SAME_ROLE]);

        expect(benutzerLastEntry('admin.role_changed'))->toBeNull();
    });

    it('will not move the last account that can edit roles to a role without it', function (): void {
        $owner = benutzerAdmin();
        $second = AdminUser::factory()->create(['email' => 'zweite@rimify.test']);
        $second->syncRoles(['super-admin']);

        benutzerActorFallsAwayOn($second, 'insert into `model_has_roles`');

        $this->actingAs($second, 'admin')->from('/admin/benutzer')
            ->patch("/admin/benutzer/{$owner->id}/rolle", ['role_id' => benutzerRoleId('support-agent')])
            ->assertSessionHasErrors(['role_id' => RollenController::LOCKOUT_REFUSAL]);

        // Rolled all the way back: the owner keeps the role, and the actor was never suspended.
        expect($owner->fresh()?->getRoleNames()->all())->toBe(['super-admin'])
            ->and($second->fresh()?->status)->toBe(AdminUserStatus::Active)
            ->and(benutzerLastEntry('admin.role_changed'))->toBeNull();
    });

    it('answers an account that does not exist with a 404', function (): void {
        $this->actingAs(benutzerAdmin(), 'admin')
            ->patch('/admin/benutzer/99999/rolle', ['role_id' => benutzerRoleId('accountant')])
            ->assertNotFound();
    });
});

describe('suspending and reactivating', function (): void {
    it('suspends: the account cannot sign in, its sessions end, nothing is deleted, and it is logged', function (): void {
        $agent = benutzerAdmin('support-agent');
        $remember = $agent->getRememberToken();
        $count = AdminUser::query()->count();

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$agent->id}/sperren")
            ->assertRedirect('/admin/benutzer')
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast', 'Nils Fuchs ist gesperrt und überall abgemeldet.');

        $fresh = $agent->fresh();

        expect($fresh?->status)->toBe(AdminUserStatus::Suspended)
            ->and(EnsureAdminSessionValid::revokedAt($fresh ?? $agent))->not->toBeNull()
            ->and($fresh?->getRememberToken())->not->toBe($remember)
            ->and(AdminUser::query()->count())->toBe($count)
            ->and(benutzerLastEntry('admin.suspended')?->properties->all())
            ->toEqual(['user_id' => $agent->id, 'email' => 'support-agent@rimify.test']);

        Auth::forgetGuards();

        $this->post('/admin/anmelden', ['email' => 'support-agent@rimify.test', 'password' => 'rimify-dev-2026'])
            ->assertSessionHasErrors('email');

        expect(Auth::guard('admin')->check())->toBeFalse();
    });

    it('reactivates: the account signs in again, and it is logged', function (): void {
        $agent = benutzerAdmin('support-agent');
        $agent->forceFill(['status' => AdminUserStatus::Suspended, 'locked_until' => now()->addHour(), 'failed_login_count' => 5])->save();

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$agent->id}/entsperren")
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast', 'Nils Fuchs kann sich wieder anmelden.');

        expect($agent->fresh()?->canSignIn())->toBeTrue()
            ->and(benutzerLastEntry('admin.reactivated')?->properties->all())
            ->toEqual(['user_id' => $agent->id, 'email' => 'support-agent@rimify.test']);

        Auth::forgetGuards();
        RateLimiter::clear('support-agent@rimify.test|127.0.0.1');

        $this->post('/admin/anmelden', ['email' => 'support-agent@rimify.test', 'password' => 'rimify-dev-2026'])
            ->assertRedirect('/admin');
    });

    it('refuses suspending an account that is already suspended, or reactivating one that is not', function (): void {
        $agent = benutzerAdmin('support-agent');

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$agent->id}/entsperren")
            ->assertSessionHasErrors(['account' => BenutzerController::NOT_SUSPENDED]);

        $agent->forceFill(['status' => AdminUserStatus::Suspended])->save();

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$agent->id}/sperren")
            ->assertSessionHasErrors(['account' => BenutzerController::ALREADY_SUSPENDED]);
    });

    it('refuses suspending yourself', function (): void {
        $admin = benutzerAdmin();

        $this->actingAs($admin, 'admin')->post("/admin/benutzer/{$admin->id}/sperren")->assertForbidden();
        $this->actingAs($admin, 'admin')->post("/admin/benutzer/{$admin->id}/entsperren")->assertForbidden();

        expect($admin->fresh()?->status)->toBe(AdminUserStatus::Active);
    });

    it('refuses a role that may not edit roles', function (): void {
        $agent = benutzerAdmin('support-agent');

        $this->actingAs(benutzerAdmin('accountant'), 'admin')->post("/admin/benutzer/{$agent->id}/sperren")->assertForbidden();

        $agent->forceFill(['status' => AdminUserStatus::Suspended])->save();

        $this->actingAs(benutzerAdmin('accountant'), 'admin')->post("/admin/benutzer/{$agent->id}/entsperren")->assertForbidden();

        expect($agent->fresh()?->status)->toBe(AdminUserStatus::Suspended);
    });

    it('refuses touching an account that holds rights the actor lacks', function (): void {
        $owner = benutzerAdmin();

        $this->actingAs(benutzerLead(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$owner->id}/sperren")
            ->assertSessionHasErrors(['account' => BenutzerController::OUT_OF_REACH]);

        expect($owner->fresh()?->status)->toBe(AdminUserStatus::Active);
    });

    it('will not suspend the last account that can edit roles', function (): void {
        $owner = benutzerAdmin();
        $second = AdminUser::factory()->create(['email' => 'zweite@rimify.test']);
        $second->syncRoles(['super-admin']);

        benutzerActorFallsAwayOn($second, 'update `admin_users`');

        $this->actingAs($second, 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$owner->id}/sperren")
            ->assertSessionHasErrors(['account' => RollenController::LOCKOUT_REFUSAL]);

        expect($owner->fresh()?->status)->toBe(AdminUserStatus::Active)
            ->and($second->fresh()?->status)->toBe(AdminUserStatus::Active)
            ->and(benutzerLastEntry('admin.suspended'))->toBeNull();
    });
});

describe('ending sessions', function (): void {
    it('stamps the moment a session signed in', function (): void {
        $this->freezeTime();

        $this->post('/admin/anmelden', ['email' => 'support-agent@rimify.test', 'password' => 'rimify-dev-2026'])
            ->assertRedirect('/admin')
            ->assertSessionHas(EnsureAdminSessionValid::SESSION_KEY, now()->getTimestamp());
    });

    it('ends every existing session of the account on its next request, and logs it', function (): void {
        $agent = benutzerAdmin('support-agent');
        $remember = $agent->getRememberToken();

        // The agent's own session: a real sign-in, and a page that opens.
        $this->post('/admin/anmelden', ['email' => 'support-agent@rimify.test', 'password' => 'rimify-dev-2026']);
        $this->get('/admin')->assertOk();

        $this->travel(5)->minutes();

        $this->actingAs(benutzerAdmin(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$agent->id}/abmelden")
            ->assertSessionHasNoErrors()
            ->assertSessionHas('toast', 'Nils Fuchs ist jetzt überall abgemeldet.');

        expect($agent->fresh()?->getRememberToken())->not->toBe($remember)
            ->and(benutzerLastEntry('admin.sessions_revoked')?->properties->all())
            ->toEqual(['user_id' => $agent->id, 'email' => 'support-agent@rimify.test']);

        // Back to the agent's session exactly as the browser holds it: the guard reads it afresh.
        Auth::forgetGuards();
        $this->travel(1)->minutes();

        $this->get('/admin')
            ->assertRedirect('/admin/anmelden')
            ->assertSessionHas('toast', EnsureAdminSessionValid::REVOKED_MESSAGE);

        expect(Auth::guard('admin')->check())->toBeFalse();
    });

    it('ends a live session of an account that was suspended meanwhile', function (): void {
        $this->post('/admin/anmelden', ['email' => 'support-agent@rimify.test', 'password' => 'rimify-dev-2026']);
        $this->get('/admin')->assertOk();

        benutzerAdmin('support-agent')->forceFill(['status' => AdminUserStatus::Suspended])->save();
        Auth::forgetGuards();

        $this->get('/admin')
            ->assertRedirect('/admin/anmelden')
            ->assertSessionHas('toast', EnsureAdminSessionValid::BLOCKED_MESSAGE);

        expect(Auth::guard('admin')->check())->toBeFalse();
    });

    it('lets a session begun after the revocation carry on', function (): void {
        $agent = benutzerAdmin('support-agent');
        $agent->forceFill(['sessions_revoked_at' => now()->subMinutes(5)])->save();

        $this->post('/admin/anmelden', ['email' => 'support-agent@rimify.test', 'password' => 'rimify-dev-2026']);
        Auth::forgetGuards();

        $this->get('/admin')->assertOk();
    });

    it('ends a session that carries no stamp once anything was revoked, and leaves one alone before that', function (): void {
        $agent = benutzerAdmin('support-agent');

        $this->actingAs($agent, 'admin')->get('/admin')->assertOk();

        $agent->forceFill(['sessions_revoked_at' => now()->subMinutes(5)])->save();

        $this->actingAs($agent->fresh() ?? $agent, 'admin')->get('/admin')->assertRedirect('/admin/anmelden');
    });

    it('refuses logging yourself out everywhere from here, and a role that may not edit roles', function (): void {
        $admin = benutzerAdmin();
        $agent = benutzerAdmin('support-agent');

        $this->actingAs($admin, 'admin')->post("/admin/benutzer/{$admin->id}/abmelden")->assertForbidden();
        $this->actingAs(benutzerAdmin('order-manager'), 'admin')->post("/admin/benutzer/{$agent->id}/abmelden")->assertForbidden();

        expect(EnsureAdminSessionValid::revokedAt($admin->fresh() ?? $admin))->toBeNull()
            ->and(EnsureAdminSessionValid::revokedAt($agent->fresh() ?? $agent))->toBeNull();
    });

    it('refuses logging out an account that holds rights the actor lacks', function (): void {
        $owner = benutzerAdmin();

        $this->actingAs(benutzerLead(), 'admin')->from('/admin/benutzer')
            ->post("/admin/benutzer/{$owner->id}/abmelden")
            ->assertSessionHasErrors(['account' => BenutzerController::OUT_OF_REACH]);

        expect(EnsureAdminSessionValid::revokedAt($owner->fresh() ?? $owner))->toBeNull();
    });

    it('only looks at the admin area: a storefront request leaves the admin session alone', function (): void {
        $agent = benutzerAdmin('support-agent');
        $agent->forceFill(['sessions_revoked_at' => now()])->save();

        $this->actingAs($agent->fresh() ?? $agent, 'admin')->get('/gibt-es-nicht')->assertNotFound();

        expect(Auth::guard('admin')->check())->toBeTrue();
    });
});

it('keeps the matrix the page is built on: roles × view, create and edit are the rights asked', function (): void {
    $lead = benutzerLead();

    expect($lead->may(PermissionModule::Roles, PermissionAction::Create))->toBeTrue()
        ->and($lead->may(PermissionModule::Orders, PermissionAction::Export))->toBeFalse();
});
