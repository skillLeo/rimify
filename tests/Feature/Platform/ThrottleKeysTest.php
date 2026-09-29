<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Services\Admin\AdminErrorPage;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\Route;

/*
 * Every rate limit counts its own route. Laravel's `throttle:N,M` keys by the user, or by the IP for a guest,
 * and nothing else: without a key of its own, every throttled route shared one counter and held it against its
 * own limit — a customer's search keystrokes (60 a minute) used up the checkout's 10, and an admin typing in
 * the Gutachten vehicle search (120) was refused the password confirmation (6). Found by the final gates
 * (Block E), where the e2e suite's sudo step answered 429.
 */

it('gives every throttled route its own counter', function (): void {
    $unkeyed = collect(Route::getRoutes()->getRoutes())
        ->flatMap(static fn ($route): array => array_map(static fn (string $m): string => $route->uri().' '.$m, $route->gatherMiddleware()))
        ->filter(static fn (string $m): bool => preg_match('/ throttle:\d+,\d+$/', $m) === 1)
        ->values()->all();

    expect($unkeyed)->toBe([]);
});

it('does not charge the checkout for the searches before it', function (): void {
    $this->seed(CommerceSeeder::class);

    foreach (range(1, 12) as $ignored) {
        $this->getJson('/api/v1/vehicles/models?marke=BMW')->assertOk();
    }

    // Twelve reads are more than the checkout's ten a minute: they must not count against it.
    expect($this->post('/kasse', [])->getStatusCode())->not->toBe(429);
});

it('does not charge the password confirmation for the searches before it, and still limits it', function (): void {
    $this->seed(AccessSeeder::class);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    foreach (range(1, 7) as $ignored) {
        $this->actingAs($admin, 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q=BMW')->assertOk();
    }

    $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'falsch'])->assertSessionHasErrors('password');

    // Its own six a minute still hold.
    foreach (range(2, 6) as $ignored) {
        $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'falsch'])->assertSessionHasErrors('password');
    }

    // The seventh is refused the admin's way: back to the form with the one sentence (AdminErrorPage), not a check.
    $this->actingAs($admin, 'admin')->post('/admin/bestaetigen', ['password' => 'falsch'])
        ->assertRedirect()
        ->assertSessionHas('toast', AdminErrorPage::TOO_MANY)
        ->assertSessionDoesntHaveErrors('password');
});
