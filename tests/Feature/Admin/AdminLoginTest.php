<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Anmelden — the door to the panel.
 *
 * What matters here is what the door refuses and what it refuses to say. A wrong password and an
 * unknown address get the same sentence, because a different one would tell whoever is guessing
 * which addresses exist. Too many tries and the door holds shut for a while. And signing in decides
 * only who someone is: what they may do is still asked of the Policies on every mutation (R-11).
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    RateLimiter::clear('super-admin@rimify.test|127.0.0.1');
});

function seededAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

it('lets a seeded admin in and lands them on the panel', function (): void {
    $admin = seededAdmin();

    $this->post('/admin/anmelden', [
        'email' => $admin->email,
        'password' => 'rimify-dev-2026',
    ])->assertRedirect('/admin');

    expect(auth('admin')->check())->toBeTrue()
        ->and(auth('admin')->id())->toBe($admin->getKey());
});

it('refuses a wrong password without saying which half was wrong', function (): void {
    $this->from('/admin/anmelden')
        ->post('/admin/anmelden', [
            'email' => seededAdmin()->email,
            'password' => 'not-the-password',
        ])
        ->assertRedirect('/admin/anmelden')
        ->assertSessionHasErrors(['email' => 'E-Mail-Adresse oder Passwort stimmt nicht.']);

    expect(auth('admin')->check())->toBeFalse();
});

it('answers an address it has never seen with that same sentence, so nothing is confirmed', function (): void {
    $this->from('/admin/anmelden')
        ->post('/admin/anmelden', [
            'email' => 'niemand@rimify.test',
            'password' => 'rimify-dev-2026',
        ])
        ->assertSessionHasErrors(['email' => 'E-Mail-Adresse oder Passwort stimmt nicht.']);

    expect(auth('admin')->check())->toBeFalse();
});

it('holds the door shut after five wrong tries and names the wait', function (): void {
    $admin = seededAdmin();

    for ($i = 0; $i < 5; $i++) {
        $this->post('/admin/anmelden', ['email' => $admin->email, 'password' => 'wrong']);
    }

    $response = $this->from('/admin/anmelden')->post('/admin/anmelden', [
        'email' => $admin->email,
        // The right password, and it still does not open: the lock is on the attempt, not the guess.
        'password' => 'rimify-dev-2026',
    ]);

    $response->assertSessionHasErrors('email');
    expect(session('errors')->first('email'))->toMatch('/Zu viele Versuche\. Bitte warte \d+ Sekunden/')
        ->and(auth('admin')->check())->toBeFalse();
});

it('counts the lock per address and per address only, so one admin cannot shut another out', function (): void {
    for ($i = 0; $i < 5; $i++) {
        $this->post('/admin/anmelden', ['email' => 'super-admin@rimify.test', 'password' => 'wrong']);
    }

    // A different admin, the same browser: their own door is untouched.
    $other = seededAdmin('accountant');

    $this->post('/admin/anmelden', ['email' => $other->email, 'password' => 'rimify-dev-2026'])
        ->assertRedirect('/admin');

    expect(auth('admin')->id())->toBe($other->getKey());
});

it('refuses the panel to anyone who has not signed in, and says where to', function (): void {
    $this->get('/admin')->assertRedirect('/admin/anmelden');
    $this->get('/admin/wuchtgewichte')->assertRedirect('/admin/anmelden');
});

it('takes a signed-in admin away from the sign-in screen', function (): void {
    $this->actingAs(seededAdmin(), 'admin')->get('/admin/anmelden')->assertRedirect();
});

it('signs out and leaves nothing behind', function (): void {
    $this->actingAs(seededAdmin(), 'admin')
        ->post('/admin/abmelden')
        ->assertRedirect('/admin/anmelden');

    expect(auth('admin')->check())->toBeFalse();

    $this->get('/admin')->assertRedirect('/admin/anmelden');
});

it('does not sign a customer into the shop, and the shop does not sign anyone into the panel', function (): void {
    $this->actingAs(seededAdmin(), 'admin');

    // The admin guard is its own; the storefront's own notion of a visitor is untouched by it.
    expect(auth('admin')->check())->toBeTrue()
        ->and(auth('web')->check())->toBeFalse();
});
