<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\ZweiFaktorController;
use App\Http\Middleware\EnsureAdminSessionValid;
use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Services\Admin\Auth\AdminSignIn;
use App\Services\Admin\Auth\TwoFactor;
use App\Support\Auth\Totp;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia;

/*
 * Bestätigung in zwei Schritten (the operator's answer of 22.11.2026, D-514): required for the Super-Admin, offered to
 * every other admin. Between the password and the code nothing is signed in; a code is taken once; a recovery code once,
 * and then it is gone; five wrong codes close the step for a quarter of an hour. A Super-Admin without it reaches only
 * its setup. Changing one that works asks for the password again, and the Super-Admin's cannot be switched off.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    RateLimiter::clear('super-admin@rimify.test|127.0.0.1');
});

/** An admin of the role, with a second factor whose key the test knows. */
function tfaAdmin(string $role = 'catalogue-manager', bool $enrolled = true): AdminUser
{
    $admin = AdminUser::factory()->create($enrolled ? ['totp_secret' => Totp::newSecret(), 'totp_confirmed_at' => now()] : []);
    $admin->syncRoles([$role]);
    RateLimiter::clear('admin-zwei-faktor|'.$admin->getKey());

    return $admin->fresh() ?? $admin;
}

/** The code the admin's app shows now — by the wall clock, as TwoFactor judges it. */
function tfaCode(AdminUser $admin, int $offset = 0): string
{
    return Totp::codeAt(Crypt::decryptString((string) $admin->getRawOriginal('totp_secret')), Totp::stepAt(time()) + $offset);
}

describe('signing in with a second factor', function (): void {
    it('asks for the code after the password, and signs in only with it', function (): void {
        $admin = tfaAdmin();

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password'])->assertRedirect('/admin/anmelden');

        expect(auth('admin')->check())->toBeFalse()
            ->and(session(AdminSignIn::PENDING)['id'] ?? null)->toBe($admin->getKey());

        $this->get('/admin/anmelden')->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Anmelden/Index')->where('stage', 'totp'));
        // Nothing of the panel opens between the two steps.
        $this->get('/admin')->assertRedirect('/admin/anmelden');

        $this->post('/admin/anmelden/code', ['code' => '000000'])
            ->assertRedirect('/admin/anmelden')
            ->assertSessionHasErrors(['code' => 'Der Code stimmt nicht. Gib den aktuellen Code aus deiner App ein.']);
        expect(auth('admin')->check())->toBeFalse();

        $this->post('/admin/anmelden/code', ['code' => tfaCode($admin)])->assertRedirect('/admin');

        expect(auth('admin')->id())->toBe($admin->getKey())
            ->and(session()->has(AdminSignIn::PENDING))->toBeFalse()
            ->and($admin->fresh()?->last_login_at)->not->toBeNull();
    });

    it('takes each code once: the same code for a second sign-in is refused', function (): void {
        $admin = tfaAdmin();
        $code = tfaCode($admin);

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->post('/admin/anmelden/code', ['code' => $code])->assertRedirect('/admin');
        $this->post('/admin/abmelden');

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->post('/admin/anmelden/code', ['code' => $code])->assertSessionHasErrors('code');

        expect(auth('admin')->check())->toBeFalse();
    });

    it('takes a recovery code once, says how many are left and keeps it in the Protokoll', function (): void {
        $admin = tfaAdmin();
        $codes = app(TwoFactor::class)->renewRecoveryCodes($admin);

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->post('/admin/anmelden/code', ['code' => strtoupper($codes[0])])
            ->assertRedirect('/admin')
            ->assertSessionHas('toast', 'Du hast dich mit einem Wiederherstellungscode angemeldet. Dir bleiben noch 7.');

        expect(AuditLog::query()->where('description', 'admin.two_factor_recovery_used')->where('causer_id', $admin->getKey())->exists())->toBeTrue();

        $this->post('/admin/abmelden');
        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->post('/admin/anmelden/code', ['code' => $codes[0]])->assertSessionHasErrors('code');

        expect(auth('admin')->check())->toBeFalse()
            ->and(app(TwoFactor::class)->recoveryCodesLeft($admin->fresh() ?? $admin))->toBe(7)
            // Kept as hashes: no code stands in the row.
            ->and((string) $admin->fresh()?->getRawOriginal('totp_recovery_codes'))->not->toContain($codes[1]);
    });

    it('closes the step for a quarter of an hour after five wrong codes — even a right code waits', function (): void {
        $admin = tfaAdmin();

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);

        foreach (range(1, 4) as $_) {
            $this->post('/admin/anmelden/code', ['code' => '111111'])->assertSessionHasErrors('code');
        }

        $this->post('/admin/anmelden/code', ['code' => '111111'])->assertSessionHasErrors(['email' => 'Zu viele falsche Codes. Bitte warte 15 Minuten und melde dich dann noch einmal an.']);
        expect(session()->has(AdminSignIn::PENDING))->toBeFalse();

        // The password again, and a right code: still closed.
        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->post('/admin/anmelden/code', ['code' => tfaCode($admin)])->assertSessionHasErrors('email');
        expect(auth('admin')->check())->toBeFalse();

        $this->travel(16)->minutes();
        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->post('/admin/anmelden/code', ['code' => tfaCode($admin)])->assertRedirect('/admin');
    });

    it('counts a code before it is checked: five already counted, side by side, and even a right one is refused', function (): void {
        $admin = tfaAdmin();
        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);

        // As five requests sent at once leave it, each counted before any was answered.
        foreach (range(1, 5) as $_) {
            RateLimiter::hit('admin-zwei-faktor|'.$admin->getKey(), 900);
        }

        $this->post('/admin/anmelden/code', ['code' => tfaCode($admin)])->assertSessionHasErrors('email');
        expect(auth('admin')->check())->toBeFalse();
    });

    it('waits five minutes for the code, then asks for the password again', function (): void {
        $admin = tfaAdmin();

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->travel(6)->minutes();

        $this->post('/admin/anmelden/code', ['code' => tfaCode($admin)])
            ->assertRedirect('/admin/anmelden')
            ->assertSessionHasErrors(['email' => 'Die Anmeldung ist abgelaufen. Melde dich bitte noch einmal an.']);
        $this->get('/admin/anmelden')->assertInertia(fn (AssertableInertia $page) => $page->where('stage', 'credentials'));

        expect(auth('admin')->check())->toBeFalse();
    });

    it('refuses the code without a password before it, and lets the person start over with another account', function (): void {
        $this->post('/admin/anmelden/code', ['code' => '123456'])->assertSessionHasErrors('email');

        $admin = tfaAdmin();
        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password']);
        $this->get('/admin/anmelden?neu=1')->assertInertia(fn (AssertableInertia $page) => $page->where('stage', 'credentials'));

        expect(session()->has(AdminSignIn::PENDING))->toBeFalse();
    });

    it('still signs in an admin without one by the password alone', function (): void {
        $admin = tfaAdmin(enrolled: false);

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password'])->assertRedirect('/admin');

        expect(auth('admin')->id())->toBe($admin->getKey());
    });
});

describe('the Super-Admin must have one', function (): void {
    it('opens nothing but the setup until it is set up — pages, changes and the page’s own fetches', function (): void {
        $admin = tfaAdmin('super-admin', enrolled: false);

        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password'])->assertRedirect('/admin');

        $this->get('/admin')->assertRedirect('/admin/zwei-faktor/einrichten');
        $this->get('/admin/profil')->assertRedirect('/admin/zwei-faktor/einrichten');
        $this->put('/admin/profil/passwort', [])->assertStatus(303)->assertRedirect('/admin/zwei-faktor/einrichten');
        $this->getJson('/admin/benachrichtigungen/neueste')->assertStatus(409)->assertJson(['message' => 'Richte zuerst die Bestätigung in zwei Schritten ein.']);

        // The setup asks for the password again first — and that page opens for an account without a second factor.
        $this->get('/admin/zwei-faktor/einrichten')->assertRedirect(route('admin.bestaetigen', ['weiter' => '/admin/zwei-faktor/einrichten']));
        $this->get(route('admin.bestaetigen', ['weiter' => '/admin/zwei-faktor/einrichten']))->assertOk();
        $this->post('/admin/bestaetigen', ['password' => 'password', 'weiter' => '/admin/zwei-faktor/einrichten'])->assertRedirect('/admin/zwei-faktor/einrichten');

        $this->get('/admin/zwei-faktor/einrichten')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/ZweiFaktor/Index')
            ->where('stage', 'setup')
            ->where('required', true)
            ->where('replacing', false)
            ->where('manualKey', fn (string $key): bool => preg_match('/^[A-Z2-7]{4}( [A-Z2-7]{4}){7}$/', $key) === 1)
            ->where('qr', fn (string $svg): bool => str_starts_with($svg, '<svg')));

        // The way out stays open.
        $this->post('/admin/abmelden')->assertRedirect('/admin/anmelden');
    });

    it('stores the key only when a code it makes confirms it, shows the recovery codes once, then lets the panel open', function (): void {
        $admin = tfaAdmin('super-admin', enrolled: false);
        $this->actingAs($admin, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()]);

        $this->get('/admin/zwei-faktor/einrichten');
        $secret = (string) session(ZweiFaktorController::SETUP);

        $this->post('/admin/zwei-faktor/einrichten', ['code' => '000000'])->assertSessionHasErrors('code');
        expect($admin->fresh()?->hasTwoFactorEnabled())->toBeFalse();

        $this->post('/admin/zwei-faktor/einrichten', ['code' => Totp::codeAt($secret, Totp::stepAt(time()))])
            ->assertRedirect('/admin/zwei-faktor/einrichten');

        $codes = [];
        $this->get('/admin/zwei-faktor/einrichten')->assertInertia(function (AssertableInertia $page) use (&$codes) {
            $page->where('stage', 'codes')->where('next', '/admin')->has('codes', 8);
            $codes = $page->toArray()['props']['codes'];
        });

        expect($codes)->each->toMatch('/^[a-z2-9]{5}-[a-z2-9]{5}$/')
            ->and($admin->fresh()?->hasTwoFactorEnabled())->toBeTrue()
            ->and(AuditLog::query()->where('description', 'admin.two_factor_enabled')->where('causer_id', $admin->getKey())->exists())->toBeTrue();

        // Once: a second visit shows no codes, and the panel is open.
        $this->get('/admin/zwei-faktor/einrichten')->assertRedirect(ZweiFaktorController::PROFILE);
        $this->get('/admin')->assertOk();
    });

    it('treats a key it can no longer read as none: set up again, never a lock nobody can open', function (): void {
        $admin = tfaAdmin('super-admin', enrolled: false);
        DB::table('admin_users')->where('id', $admin->getKey())->update(['totp_secret' => 'eyJpdiI6InVubGVzYmFyIn0=', 'totp_confirmed_at' => now()]);

        // The password alone signs in — there is no code anyone could give —, and the setup says why.
        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'password'])->assertRedirect('/admin');
        $this->get('/admin')->assertRedirect('/admin/zwei-faktor/einrichten');
        $this->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
            ->get('/admin/zwei-faktor/einrichten')->assertInertia(fn (AssertableInertia $page) => $page->where('unreadable', true));
    });

    it('cannot be switched off, not even with the password confirmed — but moves to a new phone', function (): void {
        $admin = tfaAdmin('super-admin');
        $old = (string) $admin->getRawOriginal('totp_secret');
        $this->actingAs($admin, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()]);

        $this->delete('/admin/zwei-faktor')->assertSessionHasErrors(['two_factor' => ZweiFaktorController::REQUIRED]);
        expect($admin->fresh()?->hasTwoFactorEnabled())->toBeTrue();

        $this->get('/admin/zwei-faktor/neu')->assertRedirect('/admin/zwei-faktor/einrichten');
        $this->get('/admin/zwei-faktor/einrichten')->assertInertia(fn (AssertableInertia $page) => $page->where('replacing', true));
        $secret = (string) session(ZweiFaktorController::SETUP);

        // Until the new phone's code: the old key stands.
        expect((string) $admin->fresh()?->getRawOriginal('totp_secret'))->toBe($old);

        $this->post('/admin/zwei-faktor/einrichten', ['code' => Totp::codeAt($secret, Totp::stepAt(time()))])->assertRedirect();
        expect(Crypt::decryptString((string) $admin->fresh()?->getRawOriginal('totp_secret')))->toBe($secret);
    });

    it('lets a move to a new phone go through only while the password asked for it still holds', function (): void {
        $admin = tfaAdmin('super-admin');
        $old = (string) $admin->getRawOriginal('totp_secret');
        $this->actingAs($admin, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()]);

        $this->get('/admin/zwei-faktor/neu');
        $this->get('/admin/zwei-faktor/einrichten');
        $secret = (string) session(ZweiFaktorController::SETUP);

        // Later, the password's window closed, then the password given again for something else: the move is not resumed.
        $this->travel(16)->minutes();
        $this->post('/admin/zwei-faktor/einrichten', ['code' => Totp::codeAt($secret, Totp::stepAt(time()))])->assertRedirect();
        expect((string) $admin->fresh()?->getRawOriginal('totp_secret'))->toBe($old);

        $this->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp(), ZweiFaktorController::SETUP => $secret, ZweiFaktorController::REPLACE => now()->subMinutes(16)->getTimestamp()])
            ->post('/admin/zwei-faktor/einrichten', ['code' => Totp::codeAt($secret, Totp::stepAt(time()))])
            ->assertRedirect(ZweiFaktorController::PROFILE);

        expect((string) $admin->fresh()?->getRawOriginal('totp_secret'))->toBe($old);
    });
});

it('ends every other session of the account after a change to it — this one stays signed in', function (): void {
    $admin = tfaAdmin(enrolled: false);
    $remember = (string) $admin->getRememberToken();
    $started = now()->subMinute()->getTimestamp();
    $this->actingAs($admin, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp(), EnsureAdminSessionValid::SESSION_KEY => $started]);

    $this->get('/admin/zwei-faktor/einrichten');
    $secret = (string) session(ZweiFaktorController::SETUP);
    $this->post('/admin/zwei-faktor/einrichten', ['code' => Totp::codeAt($secret, Totp::stepAt(time()))])->assertRedirect();

    $fresh = $admin->fresh();
    expect($fresh?->getRememberToken())->not->toBe($remember)
        // A session that began before the change — anyone else's — is now ended; this one began after it.
        ->and(EnsureAdminSessionValid::revoked($fresh ?? $admin, $started))->toBeTrue()
        ->and(EnsureAdminSessionValid::revoked($fresh ?? $admin, session(EnsureAdminSessionValid::SESSION_KEY)))->toBeFalse();

    $this->get('/admin/zwei-faktor/einrichten')->assertOk();
    $this->get('/admin')->assertOk();
});

describe('every other admin may', function (): void {
    it('set it up from Profil and switch it off again — the change behind the password asked again', function (): void {
        $admin = tfaAdmin(enrolled: false);
        $this->actingAs($admin, 'admin');

        $this->get('/admin')->assertOk();
        $this->get('/admin/profil')->assertInertia(fn (AssertableInertia $page) => $page->where('twoFactor.active', false)->where('twoFactor.required', false));

        // Even the first setup asks for the password again: a session someone else holds sets up nothing.
        $this->get('/admin/zwei-faktor/einrichten')->assertRedirect(route('admin.bestaetigen', ['weiter' => '/admin/zwei-faktor/einrichten']));
        $this->post('/admin/zwei-faktor/einrichten', ['code' => '123456'])->assertRedirect();
        expect($admin->fresh()?->hasTwoFactorEnabled())->toBeFalse();

        $this->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()]);
        $this->get('/admin/zwei-faktor/einrichten')->assertInertia(fn (AssertableInertia $page) => $page->where('required', false));
        $secret = (string) session(ZweiFaktorController::SETUP);
        $this->post('/admin/zwei-faktor/einrichten', ['code' => Totp::codeAt($secret, Totp::stepAt(time()))]);
        $this->get('/admin/zwei-faktor/einrichten')->assertInertia(fn (AssertableInertia $page) => $page->where('stage', 'codes')->where('next', ZweiFaktorController::PROFILE));

        // Once the password's window has closed: sent to the question, nothing changed.
        $this->travel(16)->minutes();
        $this->delete('/admin/zwei-faktor')->assertRedirect();
        expect($admin->fresh()?->hasTwoFactorEnabled())->toBeTrue();

        $this->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
            ->delete('/admin/zwei-faktor')
            ->assertRedirect(ZweiFaktorController::PROFILE);

        expect($admin->fresh()?->hasTwoFactorEnabled())->toBeFalse()
            ->and(AuditLog::query()->where('description', 'admin.two_factor_disabled')->where('causer_id', $admin->getKey())->exists())->toBeTrue();
    });

    it('make new recovery codes, behind the password asked again, and the old ones stop working', function (): void {
        $admin = tfaAdmin();
        $old = app(TwoFactor::class)->renewRecoveryCodes($admin);
        $this->actingAs($admin, 'admin');

        $this->post('/admin/zwei-faktor/wiederherstellungscodes')->assertRedirect();
        expect(app(TwoFactor::class)->verify($admin->fresh() ?? $admin, $old[1]))->toBe('recovery');

        $this->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
            ->post('/admin/zwei-faktor/wiederherstellungscodes')
            ->assertRedirect('/admin/zwei-faktor/einrichten');

        expect(app(TwoFactor::class)->verify($admin->fresh() ?? $admin, $old[0]))->toBeNull();
    });
});

it('lets the operator remove a lost second factor from the host, ending every session, with a reason in the Protokoll', function (): void {
    $admin = tfaAdmin('super-admin');

    $this->artisan('rimify:zwei-faktor-zuruecksetzen', ['email' => $admin->email])->assertFailed();
    expect($admin->fresh()?->hasTwoFactorEnabled())->toBeTrue();

    $this->artisan('rimify:zwei-faktor-zuruecksetzen', ['email' => $admin->email, '--grund' => 'Telefon verloren'])->assertSuccessful();

    $fresh = $admin->fresh();
    expect($fresh?->hasTwoFactorEnabled())->toBeFalse()
        ->and($fresh?->getRawOriginal('totp_recovery_codes'))->toBeNull()
        ->and($fresh?->getRawOriginal('sessions_revoked_at'))->not->toBeNull()
        ->and(AuditLog::query()->where('description', 'admin.two_factor_reset')->exists())->toBeTrue();
});
