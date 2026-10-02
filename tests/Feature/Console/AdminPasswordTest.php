<?php

declare(strict_types=1);

use App\Enums\AdminUserStatus;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Services\Admin\AuditDescriber;
use App\Support\Security\KnownPasswords;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReviewAccountsSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;

/**
 * D-141: until 02.10.2026 ten admin accounts on the preview opened with a password that stood in the then public
 * repository, two of them Super-Admin, and every staging deploy put the review accounts' password back. The operator
 * sets passwords with rimify:admin-passwort (asked for, never an argument), the seeders never set a known password
 * outside a development database and never reset one, and the preflight refuses a live shop where one still opens.
 */
afterEach(function (): void {
    app()['env'] = 'testing';
});

function accountWith(string $password, string $email = 'jemand@rimify.test'): AdminUser
{
    return AdminUser::query()->create(['name' => 'Jemand', 'email' => $email, 'password' => $password, 'status' => AdminUserStatus::Active->value]);
}

it('sets a new password from the operator’s side, ends every session and says so in the Protokoll', function (): void {
    $user = accountWith('rimify-dev-2026');
    $user->setRememberToken('alter-token');
    $user->save();

    $this->artisan('rimify:admin-passwort', ['email' => 'Jemand@rimify.test', '--grund' => 'Das alte Passwort stand im öffentlichen Repository.'])
        ->expectsQuestion('Neues Passwort', 'ein-langes-neues-passwort-2026')
        ->expectsOutputToContain('Neues Passwort gesetzt für jemand@rimify.test; alle Sitzungen des Kontos sind beendet.')
        ->doesntExpectOutputToContain('ein-langes-neues-passwort-2026')
        ->assertSuccessful();

    $user->refresh();
    $entry = AuditLog::query()->where('description', 'admin.password_reset')->latest('id')->firstOrFail();

    expect(Hash::check('ein-langes-neues-passwort-2026', $user->password))->toBeTrue()
        ->and($user->getAttribute('sessions_revoked_at'))->not->toBeNull()
        ->and($user->getRememberToken())->not->toBe('alter-token')
        ->and($entry->actor_email)->toBe('System')
        ->and(json_encode($entry->properties))->not->toContain('ein-langes-neues-passwort-2026')
        ->and(app(AuditDescriber::class)->describe($entry)['sentence'] ?? '')->toContain('jemand@rimify.test')
        ->and(app(AuditDescriber::class)->describe($entry)['sentence'] ?? '')->toContain('Grund: Das alte Passwort stand im öffentlichen Repository.');
});

it('refuses a short password, a password from the repository and an address it does not know, and changes nothing', function (string $password, string $sentence): void {
    $user = accountWith('ein-anderes-langes-passwort');

    $this->artisan('rimify:admin-passwort', ['email' => 'jemand@rimify.test'])
        ->expectsQuestion('Neues Passwort', $password)
        ->expectsOutputToContain($sentence)
        ->assertFailed();

    expect(Hash::check('ein-anderes-langes-passwort', $user->refresh()->password))->toBeTrue()
        ->and($user->getAttribute('sessions_revoked_at'))->toBeNull();
})->with([
    'too short' => ['kurz-2026', 'mindestens 16 Zeichen'],
    // 18 characters: long enough, and it stood in the repository.
    'the review password' => [ReviewAccountsSeeder::PASSWORD, 'stand im Repository'],
    'the address itself' => ['Jemand@rimify.test', 'oder ist die Adresse selbst'],
]);

it('knows which passwords stood in the repository, and asks for nothing for an address it does not know', function (): void {
    expect(KnownPasswords::contains('rimify-dev-2026'))->toBeTrue()
        ->and(KnownPasswords::contains(ReviewAccountsSeeder::PASSWORD))->toBeTrue()
        ->and(KnownPasswords::contains('ein-langes-neues-passwort-2026'))->toBeFalse();

    $this->artisan('rimify:admin-passwort', ['email' => 'niemand@rimify.test'])
        ->expectsOutputToContain('Kein Konto mit der Adresse niemand@rimify.test.')
        ->assertFailed();
});

it('names every account that may sign in with a password from the repository, and only those', function (): void {
    accountWith('rimify-dev-2026', 'offen@rimify.test');
    accountWith('ein-anderes-langes-passwort', 'zu@rimify.test');
    accountWith(ReviewAccountsSeeder::PASSWORD, 'gesperrt@rimify.test')->forceFill(['status' => AdminUserStatus::Suspended->value])->save();

    expect(KnownPasswords::openAccounts())->toBe(['offen@rimify.test']);
});

it('refuses a live shop where an account opens with a password from the repository, and only warns on staging', function (): void {
    accountWith('rimify-dev-2026', 'offen@rimify.test');
    Http::fake(['*/health' => Http::response('OK')]);

    app()['env'] = 'production';
    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('öffnen mit einem Passwort aus dem Repository: offen@rimify.test')
        ->assertFailed();

    app()['env'] = 'staging';
    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('öffnen mit einem Passwort aus dem Repository: offen@rimify.test');
});

it('makes the per-role development accounts only on a development database, and the roles everywhere', function (): void {
    app()['env'] = 'staging';
    $this->seed(AccessSeeder::class);

    expect(Role::query()->where('guard_name', 'admin')->count())->toBeGreaterThanOrEqual(7)
        ->and(AdminUser::query()->where('email', 'like', '%@rimify.test')->count())->toBe(0);
});

it('never puts a known password on a review account outside a development database, and never resets one', function (): void {
    config(['rimify.review.enabled' => true]);
    $this->seed(AccessSeeder::class);

    app()['env'] = 'staging';
    $this->seed(ReviewAccountsSeeder::class);

    foreach (array_keys(ReviewAccountsSeeder::ACCOUNTS) as $email) {
        expect(Hash::check(ReviewAccountsSeeder::PASSWORD, AdminUser::query()->where('email', $email)->firstOrFail()->password))->toBeFalse();
    }

    // The operator set a password; the next deploy runs the seeder again and leaves it.
    $admin = AdminUser::query()->where('email', 'admin@rimify.test')->firstOrFail();
    $admin->forceFill(['password' => 'vom-betreiber-gesetzt-2026'])->save();
    $this->seed(ReviewAccountsSeeder::class);

    expect(Hash::check('vom-betreiber-gesetzt-2026', $admin->refresh()->password))->toBeTrue();
});
